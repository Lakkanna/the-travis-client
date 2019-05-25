import { window, workspace, } from 'vscode';
import * as _ from 'lodash';
const Git = require('git-rev-2');

export default class ActiveRepository {
  private _username = '';
  private _repositoryName = '';
  private _activeBranch = '';

  constructor(private path: string) {
    const owner = workspace.getConfiguration('travisClient')
      .get<string>('owner');
    if (_.isEmpty(owner)) {
      [this._username, this._repositoryName] = this.setRepositoryDetails();
    }
    else {
      [this._username, this._repositoryName] = this.setRepositoryDetails();
      this._username = owner || '';
    }

    this.getActiveBranch();
  }

  get repository() {
    return this._repositoryName;
  }

  get username() {
    return this._username;
  }

  get branch() {
    return this._activeBranch;
  }

  private setRepositoryDetails() {
    const ini = require('ini');
    const path = require('path');
    const fs = require('fs');

    if (this.path) {
      const configFile = path.join(this.path, '.git', 'config');
      try {
        const config = ini.parse(fs.readFileSync(configFile, 'utf-8'));
        const origin = _.get(config, ['remote "origin"']);
        if (!origin && !origin.url) {
          return ['', ''];
        }
        let repo: any = _.replace(origin.url, /^(.*\/\/)?[^\/:]+[\/:]/, '');
        if (_.endsWith(repo, '.git')) {
          repo = _.head(_.split(repo, '.git'));
        }
        const split = _.split(repo, '/');
        return split && split.length > 1 ? split : ['', ''];
      }
      catch (e) {
        window.showErrorMessage('Make sure that git is configured properly.!');
        return ['', ''];
      }
    }
    else {
      return ['', ''];
    }
  }
  
  private getActiveBranch() {
    Git.branch(this.path, (err: never, activeBranch: string) => {
      this._activeBranch = activeBranch;
    });
  }
}
