import * as fs from 'fs';
import * as path from 'path';
import { ExtensionContext, window, workspace } from 'vscode';
import * as _ from 'lodash';
import * as Git from 'git-rev-2';
import * as ini from 'ini';
import { ProjectDetails } from './ProjectDetails';
import { repositoryURLTemplate } from './apiTemplates';

const axios = require('axios');

export class ActiveRepository {
  private _username = '';
  private _repositoryName = '';
  private _repoId: string | number | undefined;
  private _activeBranch = '';

  constructor(private context: ExtensionContext, private path: string) {
    const owner = workspace.getConfiguration('travisClient').get<string>('owner');
    if (_.isEmpty(owner)) {
      [this._username, this._repositoryName] = this.setRepositoryDetails();
    }
    else {
      [this._username, this._repositoryName] = this.setRepositoryDetails();
      this._username = owner || '';
    }

    this.getActiveBranch();
    this.getRepositoryIdFromTravis();
  }

  get repository() {
    return this._repositoryName;
  }

  static headers(context: ExtensionContext) {
    return {
      'Travis-API-Version': '3',
      'User-Agent': 'VSCode the-travis-client',
      Authorization: `token ${ProjectDetails.getProjectDetails(context).token}`
    };
  }

  get repositoryId() {
    return this._repoId;
  }

  get username() {
    return this._username;
  }

  get branch() {
    return this._activeBranch;
  }

  private setRepositoryDetails() {
    if (this.path) {
      const configFile = path.join(this.path, '.git', 'config');
      try {
        const config = ini.parse(fs.readFileSync(configFile, 'utf-8'));
        const origin = _.get(config, ['remote "origin"']);
        if (!origin && !origin.url) {
          return ['', ''];
        }
        let repo: any = _.replace(origin.url, /^(.*\/\/)?[^/:]+[/:]/, '');
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

  async getRepositoryIdFromTravis() {
    const response = await axios.get(repositoryURLTemplate({
      base: ProjectDetails.getProjectDetails(this.context).base,
      owner: this._username
    }), {headers: ActiveRepository.headers});

    const repo: any = _.head(_.filter(response.data.repositories, (repo) => repo.name === this._repositoryName));
    this._repoId = repo.id;
    return repo;
  }
  async getActiveRepositoryDetails() {
    const headers = ActiveRepository.headers(this.context);

    const response = await axios(repositoryURLTemplate({
      base: ProjectDetails.getProjectDetails(this.context).base,
      owner: this._username
    }), {headers: headers});
    return _.head(_.filter(response.data.repositories, (repo) => repo.name === this._repositoryName));
  }
}
