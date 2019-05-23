import * as vscode from 'vscode';
import request = require('request');
import * as _ from 'lodash';
import { RepoNodeProvider } from './nodes/nodeProvider';
import ActiveRepository from './common/ActiveRepository';
import { repositoryURLTemplate, branchesURLTemplate, buildsURLTemplate } from './common/apiTemplates';

export function activate(context: vscode.ExtensionContext) {
	let ActiveRepositoryInstance: any;
	let disposable = vscode.commands.registerCommand('extension.theTravisClient', () => {
		if (vscode.workspace.rootPath) {
			ActiveRepositoryInstance = new ActiveRepository(vscode.workspace.rootPath);

			let finalData: any = {};
			const token = vscode.workspace.getConfiguration('travisClient')['github_oauth_token'];
			const headers = {
				"Travis-API-Version": "3",
				"User-Agent": "API Explorer",
				"Authorization": `token ${token}`
			};

			request({
				headers: headers,
				uri: repositoryURLTemplate({'base': 'org', 'owner': ActiveRepositoryInstance.username}),
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
												name: br.name, active: ActiveRepositoryInstance.branch === br.name,
												state: br.state ? rep.state : 'branch', [br.name]: builds
											});
										} else {
											finalData[rep.name] = {
												name: rep.name, active: ActiveRepositoryInstance.repository === rep.name,
												state: 'repository', [rep.name]: [{ name: br.name, active: ActiveRepositoryInstance.branch === br.name,
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
		}
	});
	const refresh = vscode.commands.registerCommand('theTravisClient.refresh', function () {
		vscode.commands.executeCommand('extension.theTravisClient');
	});
	context.subscriptions.push(disposable);
	context.subscriptions.push(refresh);
	vscode.commands.executeCommand('extension.theTravisClient');
}

// this method is called when your extension is deactivated
export function deactivate() {}
