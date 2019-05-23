import * as vscode from 'vscode';
import * as _ from 'lodash';
const Git = require('git-rev-2');

export default class ActiveRepository {
  private _username = '';
  private _repositoryName = '';
  private _activeBranch = '';

  constructor(private path: string) {
    [this._username, this._repositoryName] = this.setRepositoryDetails();
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
      let configFile = path.join(this.path, '.git', 'config');
      try {
        let config = ini.parse(fs.readFileSync(configFile, 'utf-8'));
        let origin = _.get(config, ['remote "origin"']);
        if (!origin && !origin.url) {
          return ['', ''];
        }
        let repo: any = _.replace(origin.url, /^(.*\/\/)?[^\/:]+[\/:]/, '');
        if (_.endsWith(repo, '.git')) {
          repo = _.head(_.split(repo, '.git'));
        }
        const split = _.split(repo, '/');
        return split && split.length > 1 ? split : ['', ''];
      } catch (e) {
        vscode.window.showErrorMessage("Make sure that git is configured properly.!");
        return ['', ''];
      }
    } else {
      return ['', ''];
    }
  }
  
  private getActiveBranch() {
    Git.branch(this.path, (err: never, activeBranch: string) => {
      this._activeBranch = activeBranch;
    });
  }
}