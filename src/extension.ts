import { commands, ExtensionContext, workspace, window } from 'vscode';
import * as _ from "lodash";
import { RepositoryView } from './views/repositoryView';
import { TravisStatusBar } from './views/travisStatusBarItem';
import { ActiveRepositorySingleton } from './common/ActiveRepositorySingleton';

export function activate(context: ExtensionContext) {

  // initialise singleton
  let singletonInstance: any;

  if (workspace.rootPath) {
    const singleton = ActiveRepositorySingleton.createInstance(context, workspace.rootPath);
    singletonInstance = ActiveRepositorySingleton.getInstance();
  }

  const repoView = new RepositoryView(context);
  const tree = repoView.initialise();
  const travisStatusBarInstance = new TravisStatusBar(context);

  const disposable = commands.registerCommand('extension.theTravisClient', () => tree);
  // Configuration change trigger events
  const onChangeConfigurationDisposable = workspace.onDidChangeConfiguration((event) => {
    const onChangeBranches = event.affectsConfiguration('travisClient.branches');
    const onChangePro = event.affectsConfiguration('travisClient.pro');
    const onChangeOwner = event.affectsConfiguration('travisClient.owner');
    const onChangeInterval = event.affectsConfiguration('travisClient.interval');
    if (onChangeBranches || onChangePro || onChangeOwner || onChangeInterval) {
      commands.executeCommand('theTravisClient.refresh');
    }
  });

  const setProToken = commands.registerCommand('theTravisClient.setProToken', () => singletonInstance.setAuthToken('enterprise'));

  const setToken = commands.registerCommand('theTravisClient.setToken', () => singletonInstance.setAuthToken('community'));

  const autoRefresh = function () {
    commands.executeCommand('theTravisClient.refresh');
  };

  const autoRefreshInterval = setInterval(autoRefresh, singletonInstance.interval());

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
