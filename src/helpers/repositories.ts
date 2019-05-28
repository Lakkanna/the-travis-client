import { ExtensionContext, workspace } from 'vscode';
const axios = require("axios");
import * as _ from 'lodash';
import { branchesURLTemplate, buildsURLTemplate, repositoryURLTemplate } from '../common/apiTemplates';
import { ActiveRepository } from '../common/ActiveRepository';
import { ProjectDetails } from '../common/ProjectDetails';

export class Repositories {

  private ActiveRepositoryInstance: any;
  private headers: any;
  private token: string;
  private base: string;

  constructor(private context: ExtensionContext) {
    this.token = "";
    this.base = "";
    if (workspace.rootPath) {
      this.ActiveRepositoryInstance = new ActiveRepository(workspace.rootPath);
      const obj = ProjectDetails.getProjectDetails(this.context);
      this.token = obj.token;
      this.base = obj.base;
      this.headers = {
        'Travis-API-Version': '3',
        'User-Agent': 'VSCode the-travis-client',
        Authorization: `token ${this.token}`
      };
    }
  }

  async getRepositories() {
    try {
      const response = await axios.get(repositoryURLTemplate({
        base: this.base,
        owner: this.ActiveRepositoryInstance.username
      }), {headers: this.headers});

      return response.data.repositories;
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async getBranches() {
    try {
      const repos = await this.getRepositories();

      let d = _.map(repos, async rep => {
        try {
          const response = await axios.get(branchesURLTemplate({ base: this.base, repoId: rep.id }), {headers: this.headers});
          return response.data.branches;
        } catch (e) {
          return Promise.reject(e);
        }
      });
      return Promise.all(d);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async getBuilds() {
    try {
      const branches = await this.getBranches();
      const actualBranches = _.filter(branches, b => !_.isEmpty(b));
      let filteredBranches: any = [];
      const showableBranches = workspace.getConfiguration('travisClient').get('branches', []);

      _.forEach(actualBranches, br => {
        _.forEach(br, b => {
          if (_.isEmpty(showableBranches) || _.includes(showableBranches, b.name)) {
            filteredBranches.push(b);
          }
        });
      });

      let buildsPromise = _.map(filteredBranches, async br => {
        try {
          const response = await axios.get(
            buildsURLTemplate({ base: this.base, repoId: _.get(br, "repository.id"), branch: _.get(br, "name") }),
            {headers: this.headers}
          );
          return response.data.builds;
        } catch (e) {
          return Promise.reject(e);
        }
      });
      return Promise.all(buildsPromise);
    } catch (e) {
      return Promise.reject(e);
    }
  }
  async loadData() {
    const finalData = await this.getBuilds();
    return finalData;
  }
}
