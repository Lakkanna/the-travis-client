import * as path from 'path';
import { Repositories } from '../helpers/repositories';
import { Command, Event, EventEmitter, TreeDataProvider, TreeItem, TreeItemCollapsibleState, window, ExtensionContext, workspace } from 'vscode';
import * as _ from 'lodash';
import { ActiveRepository } from '../common/ActiveRepository';
import { ProjectDetails } from '../common/ProjectDetails';

export class RepoNodeProvider implements TreeDataProvider<Dependency> {
  private _onDidChangeTreeData: EventEmitter<Dependency | undefined> = new EventEmitter<Dependency | undefined>();
  readonly onDidChangeTreeData: Event<Dependency | undefined> = this._onDidChangeTreeData.event;

  public repoInstance: any;
  public ActiveRepositoryInstance: any;
  public ProjectDetailsInstance: any;

  constructor(private context: ExtensionContext) {
    this.repoInstance = new Repositories(this.context);
    if (workspace.rootPath) {
      this.ActiveRepositoryInstance = new ActiveRepository(workspace.rootPath);
      this.ProjectDetailsInstance = new ProjectDetails();
    }
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: Dependency): TreeItem {
    return element;
  }
  
  public getTimeInfo(data: any) {
    const timeEnum = {
      passed: 'finished_at',
      started: 'started_at',
      errored: 'started_at',
      failed: 'finished_at'
    };
    const time = new Date(_.get(data, [_.get(timeEnum, [data.state])])).toLocaleString();
    switch (data.state) {
      case "started":
        let duration = Math.round(_.get(data, 'duration') / 60).toString();
        duration += duration === '1' ? ' minute' : ' minutes';
        return duration;

      case "created":
        return "now created";
    
      default:
        return _.replace(time, /[/]/g, '-');
    }
  }

  async getPreparedData(element?: Dependency) {
    if (element) {
      if (!element.prevData) {
        return [];
      } else {
        return _.map(element.prevData.data, (d: any, k) => {
          if (_.isArray(element.prevData.data)) {
            return new Dependency(this.getTimeInfo(d), d.state, d.id, d, TreeItemCollapsibleState.None);
          } else {
            return new Dependency(k, "branch", k, {data: d}, this.ActiveRepositoryInstance.branch === k ? TreeItemCollapsibleState.Expanded : TreeItemCollapsibleState.Collapsed);
          }
        });
      }
    } else {
      try {
        const data = await this.repoInstance.loadData();
        const preparedData = _.chain(data)
        .flatMap()
        .groupBy("repository.name")
        .mapValues((v, k) => ({
          name: k,
          state: "repository",
          id: "",
          data: {..._.groupBy(v, "branch.name")}
        }))
        .value();
        return _.map(preparedData, eachData => {
          return new Dependency(eachData.name, eachData.state, eachData.name, eachData, this.ActiveRepositoryInstance.repository === eachData.name ? TreeItemCollapsibleState.Expanded : TreeItemCollapsibleState.Collapsed);
        });
      } catch (e) {
        if (e.response.status === 403) {
          window.showErrorMessage('Authentication error: invalid token');
          return Promise.resolve([new Dependency("Api token error!", "errored", "api token ", {}, TreeItemCollapsibleState.None)]);
        }
        else {
          window.showErrorMessage(e.message);
          return Promise.resolve([new Dependency(e.message, "errored", e.response.status, {}, TreeItemCollapsibleState.None)]);
        }
      }
    }
  }

  async getChildren(element?: Dependency): Promise<any> {
    if (ProjectDetails.isTravisProject()) {
      const token = ProjectDetails.getProjectDetails(this.context).token;
      if (token) {
        return await this.getPreparedData(element);
      } else {
        window.showErrorMessage('You have not added token, please add to get repositories.');
        this.ProjectDetailsInstance.setAuthToken(this.context);
        return [new Dependency("Add api-token", "info", "api", {}, TreeItemCollapsibleState.None)];
      }
    }
    else {
      window.showErrorMessage('This is not a travis project!');
      return [new Dependency("Not a travis project", "errored", "not a travis project", {}, TreeItemCollapsibleState.None)];
    }
  }
}

export class Dependency extends TreeItem {
  constructor(
    public readonly label: string,
    private state: string,
    private buildId: string,
    public prevData: any,
    public readonly collapsibleState: TreeItemCollapsibleState,
    public readonly command?: Command
  ) {
    super(label, collapsibleState);
  }

  get tooltip(): string {
    if (this.state) {
      return `${this.buildId}-${this.state}`;
    }
    return `${this.buildId}`;
  }

  get description(): string {
    if (this.state === 'branch' || this.state === 'repository') {
      return this.state;
    }
    return '';
  }

  public getIconPath() {
    switch (this.state) {
      case 'started':
        return {
          dark: path.join(__filename, '..', '..', '..', 'images', 'color', 'clock.svg'),
          light: path.join(__filename, '..', '..', '..', 'images', 'color', 'clock.svg')
        };
      case 'created':
        return {
          dark: path.join(__filename, '..', '..', '..', 'images', 'color', 'plus.svg'),
          light: path.join(__filename, '..', '..', '..', 'images', 'color', 'plus.svg')
        };
      case 'running':
        return {
          dark: path.join(__filename, '..', '..', '..', 'images', 'color', 'clock.svg'),
          light: path.join(__filename, '..', '..', '..', 'images', 'color', 'clock.svg')
        };
      case 'passed':
        return {
          dark: path.join(__filename, '..', '..', '..', 'images', 'color', 'check.svg'),
          light: path.join(__filename, '..', '..', '..', 'images', 'color', 'check.svg')
        };
      case 'failed':
        return {
          dark: path.join(__filename, '..', '..', '..', 'images', 'color', 'x.svg'),
          light: path.join(__filename, '..', '..', '..', 'images', 'color', 'x.svg')
        };
      case 'errored':
        return {
          dark: path.join(__filename, '..', '..', '..', 'images', 'color', 'stop.svg'),
          light: path.join(__filename, '..', '..', '..', 'images', 'color', 'stop.svg')
        };
      case 'branch':
        return {
          dark: path.join(__filename, '..', '..', '..', 'images', 'color', 'branch.svg'),
          light: path.join(__filename, '..', '..', '..', 'images', 'color', 'branch.svg')
        };
      case 'loading':
        return {
          dark: path.join(__filename, '..', '..', '..', 'images', 'dark', 'refresh.svg'),
          light: path.join(__filename, '..', '..', '..', 'images', 'light', 'refresh.svg')
        };
      case 'info':
        return {
          dark: path.join(__filename, '..', '..', '..', 'images', 'color', 'info.svg'),
          light: path.join(__filename, '..', '..', '..', 'images', 'color', 'info.svg')
        };
      default:
        return {
          dark: path.join(__filename, '..', '..', '..', 'images', 'color', 'repo.svg'),
          light: path.join(__filename, '..', '..', '..', 'images', 'color', 'repo.svg')
        };
    }
  }

  iconPath = this.getIconPath();
  contextValue = 'dependency';
}
