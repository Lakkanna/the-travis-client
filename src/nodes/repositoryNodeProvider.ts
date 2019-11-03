import {
  Command,
  Event,
  EventEmitter,
  ExtensionContext,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  window,
  workspace
} from 'vscode';
import * as _ from 'lodash';
import { Repositories } from '../helpers/repositories';
import { ActiveRepositorySingleton } from '../common/ActiveRepositorySingleton';

export class RepoNodeProvider implements TreeDataProvider<BuildItem> {
  private _onDidChangeTreeData: EventEmitter<BuildItem | undefined> = new EventEmitter<BuildItem | undefined>();
  readonly onDidChangeTreeData: Event<BuildItem | undefined> = this._onDidChangeTreeData.event;

  public repoInstance: any;
  public singleton: any;

  constructor(private context: ExtensionContext) {
    this.repoInstance = new Repositories(this.context);
    if (workspace && workspace.workspaceFolders && workspace.workspaceFolders.length > 0) {
      this.singleton = ActiveRepositorySingleton.getInstance();
    }
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: BuildItem): TreeItem {
    return element;
  }

  public getTimeInfo(data: any) {
    const timeEnum = {
      passed: 'finished_at',
      started: 'started_at',
      errored: 'started_at',
      failed: 'finished_at',
      canceled: 'updated_at'
    };
    const time = new Date(_.get(data, [_.get(timeEnum, [data.state])])).toLocaleString();
    let duration: string;
    switch (data.state) {
      case 'started':
        duration = _.toString(_.round(_.get(data, 'duration') / 60));
        duration += duration === '1' ? ' minute' : ' minutes';
        return duration;

      case 'created':
        return 'now created';

      default:
        return _.replace(time, /[/]/g, '-');
    }
  }

  async getPreparedData(element?: BuildItem) {
    if (element) {
      if (!element.prevData) {
        return [];
      }
      return _.map(element.prevData.data, (d: any, k) => {
        // contextValue: build, builds of branch
        if (_.isArray(element.prevData.data)) {
          return new BuildItem(
            this.context,
            this.getTimeInfo(d),
            d.state,
            d.id,
            d,
            TreeItemCollapsibleState.None,
            'build'
          );
        }
        // contextValue: branch, branches of repository
        return new BuildItem(
          this.context,
          k,
          'branch',
          k,
          { data: d },
          this.singleton.branch() === k ? TreeItemCollapsibleState.Expanded : TreeItemCollapsibleState.Collapsed,
          'branch'
        );
      });
    }
    try {
      const data = await this.repoInstance.loadData();
      const preparedData = _.chain(data)
        .flatMap()
        .groupBy('repository.name')
        .mapValues((v, k) => ({
          name: k,
          state: 'repository',
          id: '',
          data: { ..._.groupBy(v, 'branch.name') }
        }))
        .value();
      // contextValue: repository
      return _.map(preparedData, eachData => {
        return new BuildItem(
          this.context,
          eachData.name,
          eachData.state,
          eachData.name,
          eachData,
          this.singleton.repository() === eachData.name
            ? TreeItemCollapsibleState.Expanded
            : TreeItemCollapsibleState.Collapsed,
          'repository'
        );
      });
    } catch (e) {
      // contextValue: messageNode
      if (e.response.status === 403) {
        window.showErrorMessage('Authentication error: invalid token');
        return Promise.resolve([
          new BuildItem(
            this.context,
            'Api token error!',
            'errored',
            'api token',
            {},
            TreeItemCollapsibleState.None,
            'messageNode'
          )
        ]);
      } else if (e.response.status === 404) {
        window.showErrorMessage('Owner/Repository not found!');
        return Promise.resolve([
          new BuildItem(
            this.context,
            'Owner/Repository not found!',
            'errored',
            'owner/repository not found',
            {},
            TreeItemCollapsibleState.None,
            'messageNode'
          )
        ]);
      }

      window.showErrorMessage(e.message);
      return Promise.resolve([
        new BuildItem(
          this.context,
          e.message,
          'errored',
          e.response.status,
          {},
          TreeItemCollapsibleState.None,
          'messageNode'
        )
      ]);
    }
  }

  async getChildren(element?: BuildItem): Promise<any> {
    if (
      workspace &&
      workspace.workspaceFolders &&
      workspace.workspaceFolders.length > 0 &&
      this.singleton &&
      this.singleton.isTravisProject()
    ) {
      const token = this.singleton.token();
      if (token) {
        const data = await this.getPreparedData(element);
        return data;
      }
      window.showErrorMessage('You have not added token, please add to get repositories.');
      this.singleton.setAuthToken();
      return [
        new BuildItem(this.context, 'Add api-token', 'info', 'api', {}, TreeItemCollapsibleState.None, 'messageNode')
      ];
    }

    window.showErrorMessage('This is not a travis project!');
    return [
      new BuildItem(
        this.context,
        'Not a travis project',
        'errored',
        'not a travis project',
        {},
        TreeItemCollapsibleState.None,
        'messageNode'
      )
    ];
  }
}

export class BuildItem extends TreeItem {
  constructor(
    private context: ExtensionContext,
    public readonly label: string,
    private state: string,
    private buildId: string,
    public prevData: any,
    public readonly collapsibleState: TreeItemCollapsibleState,
    public ctxValue?: any,
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
          dark: this.context.asAbsolutePath('images/color/clock.svg'),
          light: this.context.asAbsolutePath('images/color/clock.svg')
        };
      case 'created':
        return {
          dark: this.context.asAbsolutePath('images/color/plus.svg'),
          light: this.context.asAbsolutePath('images/color/plus.svg')
        };
      case 'running':
        return {
          dark: this.context.asAbsolutePath('images/color/clock.svg'),
          light: this.context.asAbsolutePath('images/color/clock.svg')
        };
      case 'passed':
        return {
          dark: this.context.asAbsolutePath('images/color/check.svg'),
          light: this.context.asAbsolutePath('images/color/check.svg')
        };
      case 'failed':
        return {
          dark: this.context.asAbsolutePath('images/color/x.svg'),
          light: this.context.asAbsolutePath('images/color/x.svg')
        };
      case 'errored':
        return {
          dark: this.context.asAbsolutePath('images/color/stop.svg'),
          light: this.context.asAbsolutePath('images/color/stop.svg')
        };
      case 'canceled':
        return {
          dark: this.context.asAbsolutePath('images/color/circle-slash.svg'),
          light: this.context.asAbsolutePath('images/color/check.svg')
        };
      case 'branch':
        return {
          dark: this.context.asAbsolutePath('images/color/branch.svg'),
          light: this.context.asAbsolutePath('images/color/branch.svg')
        };
      case 'loading':
        return {
          dark: this.context.asAbsolutePath('images/dark/refresh.svg'),
          light: this.context.asAbsolutePath('images/light/refresh.svg')
        };
      case 'info':
        return {
          dark: this.context.asAbsolutePath('images/color/info.svg'),
          light: this.context.asAbsolutePath('images/color/info.svg')
        };
      default:
        return {
          dark: this.context.asAbsolutePath('images/color/repo.svg'),
          light: this.context.asAbsolutePath('images/color/repo.svg')
        };
    }
  }

  iconPath = this.getIconPath();

  contextValue = this.ctxValue;
}
