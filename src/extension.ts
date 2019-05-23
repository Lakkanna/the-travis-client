import * as vscode from 'vscode';
import request = require('request');
import * as _ from 'lodash';
import { RepoNodeProvider } from './nodes/nodeProvider';
import ActiveRepository from './common/ActiveRepository';

const repoURL = 'https://api.travis-ci.org/owner/Lakkanna/repos';

export function activate(context: vscode.ExtensionContext) {
	let ActiveRepositoryInstance: any;
	let disposable = vscode.commands.registerCommand('extension.theTravisClient', () => {
		if (vscode.workspace.rootPath) {
			ActiveRepositoryInstance = new ActiveRepository(vscode.workspace.rootPath);
			console.log(ActiveRepositoryInstance.branch);
		}
		let finalData: any = {};
		const token = vscode.workspace.getConfiguration('travisClient')['github_oauth_token'];
		const headers = {
			"Travis-API-Version": "3",
			"User-Agent": "API Explorer",
			"Authorization": `token ${token}`
		};
		request({
			headers: headers,
			uri: repoURL,
			method: 'GET'
		}, (err, res, body) => {
			//it works!
			if (err) {
				console.error(err);
			}
			const repositories = JSON.parse(body).repositories;
			
			repositories.forEach((rep: any) => {
				const branchesURL = `https://api.travis-ci.org/repo/${rep.id}/branches`;
				request({
					headers: headers,
					uri: branchesURL,
					method: 'GET'
				}, (err2, res2, body2) => {
					if (err2) {
						console.error(err2);
					}
					const branchs = JSON.parse(body2).branches;
					//finalData.push({[rep.name]: branchs});
					if (res2.statusCode === 200) {
						branchs.forEach((br: any) => {
							const branchBuildsURL = `https://api.travis-ci.org/repo/${rep.id}/builds?branch.name=${br.name}`;
							request({
								headers: headers,
								uri: branchBuildsURL,
								method: 'GET'
							}, (err3, res3, body3) => {
								if (err3) {
									console.error(err3);
								}
								if (res3.statusCode === 200) {
									const builds = JSON.parse(body3).builds;
									let exitstingRepo: any = _.get(finalData, [rep.name]);
									if (exitstingRepo) {
										exitstingRepo[rep.name].push({ name: br.name, state: br.state ? rep.state : 'branch', [br.name]: builds });
									} else {
										finalData[rep.name] = {name: rep.name, state: 'repository', [rep.name]: [{ name: br.name, state: br.state ? br.state : 'branch', [br.name]: builds }]};
									}
									// actuall view creating, calling after getting required data
									vscode.window.registerTreeDataProvider('repositories', new RepoNodeProvider(finalData, ActiveRepositoryInstance));
								}
							});
						});
					}
				});
			});
		});
	});
	const refresh = vscode.commands.registerCommand('theTravisClient.refresh', function () {
		console.log("Refreshing travis status...");
		vscode.commands.executeCommand('extension.theTravisClient');
	});
	context.subscriptions.push(disposable);
	context.subscriptions.push(refresh);
	vscode.commands.executeCommand('extension.theTravisClient');
}

// this method is called when your extension is deactivated
export function deactivate() {}
