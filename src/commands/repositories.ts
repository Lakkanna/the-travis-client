import * as vscode from 'vscode';
import request = require('request');
import * as _ from 'lodash';
import { repositoryURLTemplate, branchesURLTemplate, buildsURLTemplate } from '../common/apiTemplates';
import { RepoNodeProvider } from '../nodes/nodeProvider';
import ActiveRepository from '../common/ActiveRepository';

export default class Repositories {
  private ActiveRepositoryInstance: any;
  constructor(private context: vscode.ExtensionContext) {
    if (vscode.workspace.rootPath) {
      this.ActiveRepositoryInstance = new ActiveRepository(vscode.workspace.rootPath);
    }
  }
  public loadData() {
    let finalData: any = {};
    const token = this.context.globalState.get<string>('travisAuthToken', '');
    if (token) {
      const headers = {
        "Travis-API-Version": "3",
        "User-Agent": "API Explorer",
        "Authorization": `token ${token}`
      };
  
      request({
        headers: headers,
        uri: repositoryURLTemplate({'base': 'org', 'owner': this.ActiveRepositoryInstance.username}),
        method: 'GET'
      }, (err, res, body) => {
        if (err) {
          console.error(err);
        }
        const repositories = JSON.parse(body).repositories;
        
        repositories.forEach((rep: any) => {
  
          request({
            headers: headers,
            uri: branchesURLTemplate({'base': 'org', 'repoId': rep.id}),
            method: 'GET'
          }, (err2, res2, body2) => {
            if (err2) {
              console.error(err2);
            }
            const branchs = JSON.parse(body2).branches;
  
            if (res2.statusCode === 200) {
              branchs.forEach((br: any) => {
  
                request({
                  headers: headers,
                  uri: buildsURLTemplate({'base': 'org', 'repoId': rep.id, 'branch': br.name}),
                  method: 'GET'
                }, (err3, res3, body3) => {
                  if (err3) {
                    console.error(err3);
                  }
                  if (res3.statusCode === 200) {
                    const builds = JSON.parse(body3).builds;
                    let exitstingRepo: any = _.get(finalData, [rep.name]);
                    if (exitstingRepo) {
                      exitstingRepo[rep.name].push({
                        name: br.name, active: this.ActiveRepositoryInstance.branch === br.name,
                        state: br.state ? rep.state : 'branch', [br.name]: builds
                      });
                    } else {
                      finalData[rep.name] = {
                        name: rep.name, active: this.ActiveRepositoryInstance.repository === rep.name,
                        state: 'repository', [rep.name]: [{ name: br.name, active: this.ActiveRepositoryInstance.branch === br.name,
                          state: br.state ? br.state : 'branch', [br.name]: builds
                        }]
                      };
                    }
                    // actuall view creating, calling after getting required data
                    vscode.window.registerTreeDataProvider('repositories', new RepoNodeProvider(finalData));
                  }
                });
              });
            }
          });
        });
      });
      // request end 
    } else {
      vscode.window.registerTreeDataProvider('repositories', new RepoNodeProvider([{error: 'Add token: you are not added token yet.!', state: 'loading'}]));
    }
  }
}

