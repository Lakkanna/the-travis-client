import * as _ from 'lodash';
import { ExtensionContext, StatusBarAlignment, StatusBarItem, window, workspace } from 'vscode';
import { ProjectDetails } from '../common/ProjectDetails';
import { ActiveRepository } from '../common/ActiveRepository';
import { buildsURLTemplate } from '../common/apiTemplates';

const axios = require('axios');

export class TravisStatusBar {
  private _statusBarItem: StatusBarItem;
  private activeRepositoryInstance: any;

  constructor(private context: ExtensionContext) {
    if (workspace && workspace.rootPath) {
      this.activeRepositoryInstance = new ActiveRepository(this.context, workspace.rootPath);
    }
    this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 100);
    this.subscribe();
    this.updateStatusBar(true);
  }

  async loadStatusBarData() {
    const headers = ActiveRepository.headers(this.context);

    let activeRepo = {id: await this.activeRepositoryInstance.repositoryId};
    if (!activeRepo || !activeRepo.id) {
      activeRepo = await this.activeRepositoryInstance.getActiveRepositoryDetails();
    }

    const response = await axios.get(
      buildsURLTemplate({
        base: ProjectDetails.getProjectDetails(this.context).base,
        repoId: _.get(activeRepo, 'id'),
        branch: this.activeRepositoryInstance.branch
      }),
    {headers: headers}
    );

    const build: any = _.head(_.get(response, 'data.builds'));
    const statusData = await {id: build.id, name: this.activeRepositoryInstance.branch, state: build.state};
    return statusData;
  }

  public getStatusIcon(state: string) {
    switch (state) {
      case 'created':
        return 'diff-added';
      case 'started':
        return 'history';
      case 'passed':
        return 'check';
      case 'failed':
        return 'x';
      case 'errored':
        return 'circle-slash';
      default:
        return '';
    }
  }

  async updateStatusBar(refresh: boolean = false) {
    if (ProjectDetails.isTravisProject()) {
      if (refresh) {
        this._statusBarItem.text = `Travis: $(sync~spin)`;
        this._statusBarItem.tooltip = `refreshing`;
        this.show();
      }
      const data: any = await this.loadStatusBarData();
      this._statusBarItem.text = `Travis: ${data.name}: $(${this.getStatusIcon(data.state)})`;
      this._statusBarItem.tooltip = `${data.name}: ${data.id} - ${data.state}`;
      this.show();
    }
  }

  private show() {
    this._statusBarItem.show();
  }

  private hide() {
    this._statusBarItem.hide();
  }

  private subscribe() {
    this.context.subscriptions.push(this._statusBarItem);
  }
}
