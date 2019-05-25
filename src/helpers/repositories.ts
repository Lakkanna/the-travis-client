import { ExtensionContext, window, workspace } from 'vscode';
import * as request from 'request';
import * as _ from 'lodash';
import { branchesURLTemplate, buildsURLTemplate, repositoryURLTemplate } from '../common/apiTemplates';
import { RepoNodeProvider } from '../nodes/nodeProvider';
import { ActiveRepository } from '../common/ActiveRepository';
import { ProjectDetails } from '../common/ProjectDetails';

export class Repositories {
  private ActiveRepositoryInstance: any;
  constructor(private context: ExtensionContext) {
    if (workspace.rootPath) {
      this.ActiveRepositoryInstance = new ActiveRepository(workspace.rootPath);
    }
  }

  public showAuthError() {
    window.showErrorMessage('Authentication error: invalid token');
    window.registerTreeDataProvider(
      'repositories',
      new RepoNodeProvider([{ error: 'Add api-token: you are not added token yet.!', state: 'info' }])
    );
  }

  public loadData() {
    const finalData: any = {};
    const { token, base } = ProjectDetails.getProjectDetails(this.context);

    if (ProjectDetails.getProjectDetails(this.context).token) {
      const headers = {
        'Travis-API-Version': '3',
        'User-Agent': 'VSCode the-travis-client',
        Authorization: `token ${token}`
      };

      request(
        {
          headers: headers,
          uri: repositoryURLTemplate({ base: base, owner: this.ActiveRepositoryInstance.username }),
          method: 'GET'
        },
        (err, res, body) => {
          if (err) {
            console.error(err);
          }

          if (res.statusCode === 403) {
            this.showAuthError();
          }

          const repositories = JSON.parse(body).repositories;

          _.forEach(repositories, rep => {
            request(
              {
                headers: headers,
                uri: branchesURLTemplate({ base: base, repoId: rep.id }),
                method: 'GET'
              },
              (err2, res2, body2) => {
                if (err2) {
                  console.error(err2);
                }

                if (res2.statusCode === 403) {
                  this.showAuthError();
                }

                const showableBranches = workspace.getConfiguration('travisClient').get('branches', []);

                // show only user mentioned branches, if empty or undefined all branches will be shown
                const branchs = _.filter(JSON.parse(body2).branches, branch => {
                  return _.isEmpty(showableBranches) ? true : _.includes(showableBranches, branch.name);
                });

                if (res2.statusCode === 200) {
                  _.forEach(branchs, br => {
                    request(
                      {
                        headers: headers,
                        uri: buildsURLTemplate({ base: base, repoId: rep.id, branch: br.name }),
                        method: 'GET'
                      },
                      (err3, res3, body3) => {
                        if (err3) {
                          console.error(err3);
                        }

                        if (res3.statusCode === 403) {
                          this.showAuthError();
                        }

                        if (res3.statusCode === 200) {
                          const builds = JSON.parse(body3).builds;
                          const exitstingRepo: any = _.get(finalData, [rep.name]);

                          if (exitstingRepo) {
                            exitstingRepo[rep.name].push({
                              name: br.name,
                              active: this.ActiveRepositoryInstance.branch === br.name,
                              state: br.state ? rep.state : 'branch',
                              [br.name]: builds
                            });
                          }
                          else {
                            finalData[rep.name] = {
                              name: rep.name,
                              active: this.ActiveRepositoryInstance.repository === rep.name,
                              state: 'repository',
                              [rep.name]: [
                                {
                                  name: br.name,
                                  active: this.ActiveRepositoryInstance.branch === br.name,
                                  state: br.state ? br.state : 'branch',
                                  [br.name]: builds
                                }
                              ]
                            };
                          }
                          // actuall view creating, calling after getting required data
                          window.registerTreeDataProvider('repositories', new RepoNodeProvider(finalData));
                        }
                      }
                    );
                  });
                }
              }
            );
          });
        }
      );
      // request end
    }
    else {
      window.registerTreeDataProvider(
        'repositories',
        new RepoNodeProvider([{ error: 'Add token: you are not added token yet.!', state: 'loading' }])
      );
    }
  }
}
