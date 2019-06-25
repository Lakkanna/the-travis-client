import axios from 'axios';
import * as _ from 'lodash';
import { ExtensionContext, StatusBarAlignment, StatusBarItem, window, workspace } from 'vscode';
import { ActiveRepositorySingleton } from '../common/ActiveRepositorySingleton';
import { buildsURLTemplate } from '../common/apiTemplates';

export class TravisStatusBar {
  private _statusBarItem: StatusBarItem;
  private singleton: any;

  constructor(private context: ExtensionContext) {
    if (workspace && workspace.rootPath) {
      this.singleton = ActiveRepositorySingleton.getInstance();
    }
    this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 100);
    this.subscribe();
    this.updateStatusBar(true);
  }

  async loadStatusBarData() {
    const headers = this.singleton.headers();

    const activeRepo = {id: await this.singleton.repositoryId()};

    const response = await axios.get(
      buildsURLTemplate({
        base: this.singleton.base(),
        repoId: _.get(activeRepo, 'id'),
        branch: this.singleton.branch()
      }),
    {headers: headers}
    );

    const build: any = _.head(_.get(response, 'data.builds'));
    const statusData = await {id: build.id, repoName: this.singleton.repository(), branchName: this.singleton.branch(), state: build.state};
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
        return 'x';
      case 'canceled':
        return 'circle-slash';
      default:
        return '';
    }
  }

  async updateStatusBar(refresh: boolean = false) {
    if (this.singleton && this.singleton.isTravisProject()) {
      if (refresh) {
        this._statusBarItem.text = 'Travis: $(sync~spin)';
        this._statusBarItem.tooltip = 'refreshing..';
        this.show();
      }

      try {
        const data: any = await this.loadStatusBarData();
        this._statusBarItem.text = `Travis: ${data.repoName}: $(${this.getStatusIcon(data.state)})`;
        this._statusBarItem.tooltip = `${data.branchName}: ${data.id} - ${data.state}`;
        this.show();
      }
      catch (e) {
        console.error(e);
        this.hide();
      }
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
