import * as vscode from 'vscode';
import * as _ from 'lodash';
import { RepoNodeProvider } from './nodes/nodeProvider';
import Repositories from './commands/repositories';
import setAuthToken from './common/setAuthToken';

export function activate(context: vscode.ExtensionContext) {
	let ActiveRepositoryInstance: any;
	let disposable = vscode.commands.registerCommand('extension.theTravisClient', () => {
		// actuall view creating, calling after getting required data
		const token = context.globalState.get<string>('travisAuthToken', "");
		if (token) {
			vscode.window.registerTreeDataProvider('repositories', new RepoNodeProvider([{error: 'Loading: wait a moment..', state: 'loading'}]));
			const instance = new Repositories(context);
			instance.loadData();
		} else {
			vscode.window.showErrorMessage('You have not added token, please add to get repositories.');
			vscode.window.registerTreeDataProvider('repositories', new RepoNodeProvider([{error: 'Add token: you are not added token yet.!', state: 'loading'}]));
			setAuthToken(context);
		}
	});
	const setToken = vscode.commands.registerCommand('theTravisClient.setToken', function () {
		setAuthToken(context);
	});
	const refresh = vscode.commands.registerCommand('theTravisClient.refresh', function () {
		const instance = new Repositories(context);
		instance.loadData();
	});
	context.subscriptions.push(disposable);
	context.subscriptions.push(setToken);
	context.subscriptions.push(refresh);
	vscode.commands.executeCommand('extension.theTravisClient');
}

// this method is called when your extension is deactivated
export function deactivate() {}
