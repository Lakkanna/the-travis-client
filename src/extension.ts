import { ExtensionContext, commands, window } from 'vscode';
import { RepoNodeProvider } from './nodes/nodeProvider';
import { Repositories } from './helpers/repositories';
import { ProjectDetails } from './common/ProjectDetails';

export function activate(context: ExtensionContext) {

	const ProjectDetailsInstance = new ProjectDetails();

	let disposable = commands.registerCommand('extension.theTravisClient', () => {

		// actuall view creating, calling after getting required data
		const token = ProjectDetails.getProjectDetails(context).token;
		if (token) {
			window.registerTreeDataProvider('repositories',
				new RepoNodeProvider([{error: 'Loading: wait a moment..', state: 'loading'}])
			);
			const instance = new Repositories(context);
			instance.loadData();
		} else {
			window.showErrorMessage('You have not added token, please add to get repositories.');
			window.registerTreeDataProvider('repositories',
				new RepoNodeProvider([{error: 'Add api-token: you are not added token yet.!', state: 'info'}])
			);
			ProjectDetailsInstance.setAuthToken(context);
		}

	});

	const setProToken = commands.registerCommand('theTravisClient.setProToken', function () {
		ProjectDetailsInstance.setAuthToken(context, 'enterprise');
	});

	const setToken = commands.registerCommand('theTravisClient.setToken', function () {
		ProjectDetailsInstance.setAuthToken(context, 'community');
	});

	const refresh = commands.registerCommand('theTravisClient.refresh', function () {
		const instance = new Repositories(context);
		instance.loadData();
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(setProToken);
	context.subscriptions.push(setToken);
	context.subscriptions.push(refresh);
	commands.executeCommand('extension.theTravisClient');
}

// this method is called when your extension is deactivated
export function deactivate() {}
