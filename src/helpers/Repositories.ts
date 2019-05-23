import * as vscode from 'vscode';
import * as _ from 'lodash';
import request = require('request');
import { RepoNodeProvider } from '../nodes/nodeProvider';
import Configuration from './Configuration';

export default class RepositoryHelper {
  private repositoryURLTemplate = _.template('https://api.travis-ci.<%= base %>/owner/<%= owner %>/repos');
  private branchesURLTemplate = _.template('https://api.travis-ci.<%= base %>/repo/<%= repoId %>/branches');
  private buildsURLTemplate = _.template('https://api.travis-ci.<%= base %>/repo/<%= repoId %>/builds?branch.name=<%= branch %>');
  private _authToken: string;

  constructor() {
    this._authToken = new Configuration().token;
  }

  private requestFunction(token: string, uri: string, method: string, callback: (err: any, res: any, body: any) => any) {
    const headers = {
      "Travis-API-Version": "3",
      "User-Agent": "API Explorer",
      "Authorization": `token ${token}`
    };
    request({
      headers: headers,
      uri: uri,
      method: method
    }, callback);
  }

  private getBuilds(err: any, res: any, body: any) {
    if (err) {
      console.error(err);
    }
  }

  private getBranches(err: any, res: any, body: any) {
    if (err) {
      console.error(err);
    }
    const repositories = JSON.parse(body).repositories;
    _.forEach(repositories, (repo) => {
      this.requestFunction(
        this._authToken,
        this.branchesURLTemplate({'base': 'org', 'repoId': repo.id}),
        'GET',
        this.getBuilds
      );
    });
  }

  private getRepositories() {
    this.requestFunction(
      this._authToken,
      this.repositoryURLTemplate({'base': 'org', 'owner': 'lakkanna'}),
      'GET',
      this.getBranches);
  }

  public initiate() {
    const listOfRepositories = this.getRepositories();
    // actuall view creating, calling after getting required data
    // vscode.window.registerTreeDataProvider('repositories', new RepoNodeProvider(finalData, ActiveRepositoryInstance));
  }
}
