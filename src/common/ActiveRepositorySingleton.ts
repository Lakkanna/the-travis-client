import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { commands, ExtensionContext, window, workspace } from 'vscode';
import * as _ from 'lodash';
import * as Git from 'git-rev-2';
import * as ini from 'ini';
import { repositoryURLTemplate } from '../common/apiTemplates';

let instance: any;

interface Key {
  [key: string]: any;
}

interface Content {
  storageKey: string;
  base: string;
  prompt: string;
  placeholder: string;
}

const AccountType: Key = {
  enterprise: {
    storageKey: 'travisProToken',
    base: 'com',
    prompt: 'Please add enterprise auth token for travis client!',
    placeHolder: 'Add travis enterprise token here'
  },
  community: {
    storageKey: 'travisAuthToken',
    base: 'org',
    prompt: 'Please add community auth token for travis client!',
    placeHolder: 'Add travis community token here'
  }
};

export class ActiveRepositorySingleton {
  private _branch: string | undefined;
  private _repository: string | undefined;
  private _repositoryId: string | number | undefined;
  private _owner: string | undefined;
  private _isTravisProject: boolean | undefined;
  private _accountType = '';
  private _base: string | undefined;
  private _token: string | undefined;
  private _storageKey: string | undefined;
  private _timeInterval: number | undefined;

  constructor(private context: ExtensionContext, private _path: string) {}

  static createInstance = (context: ExtensionContext, repoPath: string) => {
    instance = new ActiveRepositorySingleton(context, repoPath);
  };

  static getInstance = () => {
    if (instance) {
      return instance;
    }
    return undefined;
  };

  // referenced from felixrieseberg/vsc-travis-ci-status
  private static isTravisProject(): boolean {
    if (!workspace) {
      return false;
    }
    if (workspace && workspace.workspaceFolders && workspace.workspaceFolders.length > 0) {
      const work = workspace.workspaceFolders[0];

      const conf = path.join(work.uri.path, '.travis.yml');
      try {
        return fs.statSync(conf).isFile();
      }
      catch (err) {
        return false;
      }
    }
    return false;
  }

  private static getAccountType() {
    return workspace.getConfiguration('travisClient').get('pro') === true ? 'enterprise' : 'community';
  }

  public interval() {
    if (!this._timeInterval) {
      this.setDetails(this._path);
    }
    return this._timeInterval;
  }

  public headers() {
    return {
      'Travis-API-Version': '3',
      'User-Agent': 'VSCode the-travis-client',
      Authorization: `token ${this.token()}`
    };
  }

  async getRepositoryIdFromTravis() {
    try {
      const response = await axios.get(
        repositoryURLTemplate({
          base: this.base(),
          owner: this.owner()
        }),
        { headers: this.headers() }
      );

      const repo: any = _.head(_.filter(response.data.repositories, repo => repo.name === this.repository()));
      this._repositoryId = repo.id;
      return repo;
    }
    catch (e) {
      console.error(e);
      return {};
    }
  }

  private getProjectDetails(context: ExtensionContext = this.context) {
    const currentProjectDetails = AccountType[this.accountType()];
    return {
      base: currentProjectDetails.base,
      token: context.globalState.get(currentProjectDetails.storageKey, ''),
      storageKey: currentProjectDetails.storageKey
    };
  }

  async setAuthToken(accountFlavour?: string) {
    let type = accountFlavour;
    if (!type) {
      type = this.accountType();
    }

    const accountContext: Content = AccountType[type];
    const newToken = await window.showInputBox({
      prompt: accountContext.prompt,
      placeHolder: accountContext.placeholder,
      value: undefined
    });

    if (newToken) {
      this.context.globalState.update(accountContext.storageKey, newToken);
      this.setToken(newToken);
      commands.executeCommand('theTravisClient.refresh');
      window.showInformationMessage('You successfully added token, loading repositories wait a moment.');
    }
    else {
      window.showWarningMessage('You failed to add token, try again (Shift + CMD + P) travis set token');
    }
  }

  private setDetails(repoPath: string = this._path) {
    if (repoPath) {
      // time interval for auto refresh
      if (!this._timeInterval) {
        let interval = workspace.getConfiguration('travisClient').get<number>('interval');
        interval = _.isNumber(_.toNumber(interval)) ? _.toNumber(interval) : 5;
        this._timeInterval = interval * 60000;
      }

      if (!this._owner) {
        // check owner is added in configuration
        this._owner = workspace.getConfiguration('travisClient').get<string>('owner');
      }

      // get repository name and owner name from git info
      if (_.isEmpty(this._owner) || !this._repository) {
        [this._owner, this._repository] = setRepositoryDetails(repoPath);
        this.getRepositoryIdFromTravis();
      }

      if (!this._branch) {
        Git.branch(this._path, (err: never, activeBranch: string) => {
          this._branch = activeBranch;
        });
      }

      if (
        this._isTravisProject === undefined &&
        ActiveRepositorySingleton &&
        ActiveRepositorySingleton.isTravisProject()
      ) {
        this._isTravisProject = ActiveRepositorySingleton.isTravisProject();
      }

      if (!this._accountType) {
        this._accountType = ActiveRepositorySingleton && ActiveRepositorySingleton.getAccountType();
      }

      if (!this._base || !this._token || !this._storageKey) {
        const { base, token, storageKey } = this.getProjectDetails(this.context);
        this._base = base;
        this.setToken(token);
        this._storageKey = storageKey;
      }
    }
  }

  private owner() {
    if (!this._owner) {
      this.setDetails(this._path);
    }
    return this._owner;
  }

  private repository() {
    if (!this._repository) {
      this.setDetails(this._path);
      this.getRepositoryIdFromTravis();
    }
    return this._repository;
  }

  private branch() {
    if (!this._branch) {
      this.setDetails(this._path);
    }
    return this._branch;
  }

  private isTravisProject() {
    if (this._isTravisProject === undefined) {
      this.setDetails(this._path);
    }
    return this._isTravisProject;
  }

  public accountType() {
    if (!this._accountType) {
      this.setDetails(this._path);
    }
    return this._accountType;
  }

  public setToken(newToken: string | undefined) {
    this._token = newToken;
  }

  private token() {
    if (!this._token) {
      this.setDetails(this._path);
    }
    return this._token;
  }

  private base() {
    if (!this._base) {
      this.setDetails(this._path);
    }
    return this._base;
  }

  async repositoryId() {
    if (!this._repositoryId) {
      await this.getRepositoryIdFromTravis();
    }
    return this._repositoryId;
  }
}

function setRepositoryDetails(repoPath: string) {
  if (path) {
    const configFile = path.join(repoPath, '.git', 'config');
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
