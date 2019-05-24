import * as vscode from 'vscode';
import * as _ from 'lodash';
import { RepoNodeProvider } from './nodes/nodeProvider';
import Repositories from './commands/repositories';
import ProjectDetails from './common/ProjectDetails';

export function activate(context: vscode.ExtensionContext) {

	let ActiveRepositoryInstance: any;
	const ProjectDetailsInstance = new ProjectDetails();

	let disposable = vscode.commands.registerCommand('extension.theTravisClient', () => {

		// actuall view creating, calling after getting required data
		const token = ProjectDetails.getProjectDetails(context).token;
		if (token) {
			vscode.window.registerTreeDataProvider('repositories',
				new RepoNodeProvider([{error: 'Loading: wait a moment..', state: 'loading'}])
			);
			const instance = new Repositories(context);
			instance.loadData();
		} else {
			vscode.window.showErrorMessage('You have not added token, please add to get repositories.');
			vscode.window.registerTreeDataProvider('repositories',
				new RepoNodeProvider([{error: 'Add token: you are not added token yet.!', state: 'loading'}])
			);
			ProjectDetailsInstance.setAuthToken(context);
		}

	});

	const setProToken = vscode.commands.registerCommand('theTravisClient.setProToken', function () {
		ProjectDetailsInstance.setAuthToken(context, 'enterprise');
	});

	const setToken = vscode.commands.registerCommand('theTravisClient.setToken', function () {
		ProjectDetailsInstance.setAuthToken(context, 'community');
	});

	const refresh = vscode.commands.registerCommand('theTravisClient.refresh', function () {
		const instance = new Repositories(context);
		instance.loadData();
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(setProToken);
	context.subscriptions.push(setToken);
	context.subscriptions.push(refresh);
	vscode.commands.executeCommand('extension.theTravisClient');
}

// this method is called when your extension is deactivated
export function deactivate() {}
