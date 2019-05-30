import { ExtensionContext, workspace } from 'vscode';
import * as _ from 'lodash';
import { branchesURLTemplate, buildsURLTemplate, repositoryURLTemplate } from '../common/apiTemplates';
import { ActiveRepositorySingleton } from '../common/ActiveRepositorySingleton';
const axios = require('axios');

export class Repositories {

  private singleton: any;
  private headers: any;

  constructor(private context: ExtensionContext) {
    if (workspace.rootPath) {
      this.singleton = ActiveRepositorySingleton.getInstance();
      
      this.headers = {
        'Travis-API-Version': '3',
        'User-Agent': 'VSCode the-travis-client',
        Authorization: `token ${this.singleton.token()}`
      };
    }
  }

  async getRepositories() {
    try {
      const response = await axios.get(repositoryURLTemplate({
        base: this.singleton.base(),
        owner: this.singleton.owner()
      }), {headers: this.headers});

      return response.data.repositories;
    }
    catch (e) {
      return Promise.reject(e);
    }
  }

  async getBranches() {
    try {
      const repos = await this.getRepositories();

      const branchesPromise = _.map(repos, async rep => {
        try {
          const response = await axios.get(branchesURLTemplate({ base: this.singleton.base(), repoId: rep.id }), {headers: this.headers});
          return response.data.branches;
        }
        catch (e) {
          return Promise.reject(e);
        }
      });
      return Promise.all(branchesPromise);
    }
    catch (e) {
      return Promise.reject(e);
    }
  }

  async getBuilds() {
    try {
      const branches = await this.getBranches();
      const actualBranches = _.filter(branches, b => !_.isEmpty(b));
      const filteredBranches: any = [];
      const showableBranches = workspace.getConfiguration('travisClient').get('branches', []);

      _.forEach(actualBranches, br => {
        _.forEach(br, b => {
          if (_.isEmpty(showableBranches) || _.includes(showableBranches, b.name)) {
            filteredBranches.push(b);
          }
        });
      });

      const buildsPromise = _.map(filteredBranches, async br => {
        try {
          const response = await axios.get(
            buildsURLTemplate({ base: this.singleton.base(), repoId: _.get(br, 'repository.id'), branch: _.get(br, 'name') }),
            {headers: this.headers}
          );
          return response.data.builds;
        }
        catch (e) {
          return Promise.reject(e);
        }
      });
      return Promise.all(buildsPromise);
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
  async loadData() {
    const finalData = await this.getBuilds();
    return finalData;
  }
}
