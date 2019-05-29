import { commands, ExtensionContext, workspace } from 'vscode';
import { ProjectDetails } from './common/ProjectDetails';
import { RepositoryView } from './views/repositoryView';
import { TravisStatusBar } from './views/travisStatusBarItem';

export function activate(context: ExtensionContext) {

  const projectDetailsInstance = new ProjectDetails();
  const repoView = new RepositoryView(context);
  const tree = repoView.initialise();
  const travisStatusBarInstance = new TravisStatusBar(context);

  const disposable = commands.registerCommand('extension.theTravisClient', () => tree);

  const onChangeConfigurationDisposable = workspace.onDidChangeConfiguration((event) => {
    const onChangeBranches = event.affectsConfiguration('travisClient.branches');
    const onChangePro = event.affectsConfiguration('travisClient.pro');
    const onChangeOwner = event.affectsConfiguration('travisClient.owner');
    if (onChangeBranches || onChangePro || onChangeOwner) {
      commands.executeCommand('theTravisClient.refresh');
    }
  });

  const setProToken = commands.registerCommand('theTravisClient.setProToken', () => projectDetailsInstance.setAuthToken(context, 'enterprise'));

  const setToken = commands.registerCommand('theTravisClient.setToken', () => projectDetailsInstance.setAuthToken(context, 'community'));

  const refresh = commands.registerCommand('theTravisClient.refresh', () => {
    const repoView = new RepositoryView(context);
    repoView.initialise();
    travisStatusBarInstance.updateStatusBar(true);
  });

  context.subscriptions.push(disposable);
  context.subscriptions.push(onChangeConfigurationDisposable);
  context.subscriptions.push(setProToken);
  context.subscriptions.push(setToken);
  context.subscriptions.push(refresh);
}

// this method is called when your extension is deactivated
export function deactivate() {}
