import { commands, ExtensionContext, window, workspace } from 'vscode';
import axios from 'axios';
import * as _ from 'lodash';
import { RepositoryView } from './views/repositoryView';
import { TravisStatusBar } from './views/travisStatusBarItem';
import { ActiveRepositorySingleton } from './common/ActiveRepositorySingleton';
import { cancelBuildTemplate, restartBuildTemplate } from './common/apiTemplates';

export function activate(context: ExtensionContext) {
  // initialise singleton
  let singletonInstance: any;

  if (workspace.workspaceFolders) {
    const firstWorkspace = _.first(workspace.workspaceFolders);
    if (firstWorkspace) {
      ActiveRepositorySingleton.createInstance(context, firstWorkspace.uri.path);
      singletonInstance = ActiveRepositorySingleton.getInstance();
    }
  }

  const repoView = new RepositoryView(context);
  const tree = repoView.initialise();
  const travisStatusBarInstance = new TravisStatusBar(context);

  const disposable = commands.registerCommand('extension.theTravisClient', () => tree);

  // Configuration change trigger events
  const onChangeConfigurationDisposable = workspace.onDidChangeConfiguration(event => {
    const onChangeBranches = event.affectsConfiguration('travisClient.branches');
    const onChangePro = event.affectsConfiguration('travisClient.pro');
    const onChangeOwner = event.affectsConfiguration('travisClient.owner');
    const onChangeInterval = event.affectsConfiguration('travisClient.interval');
    if (onChangeBranches || onChangePro || onChangeOwner || onChangeInterval) {
      commands.executeCommand('theTravisClient.refresh');
    }
  });

  const setProToken = commands.registerCommand('theTravisClient.setProToken', () =>
    singletonInstance.setAuthToken('enterprise')
  );

  const setToken = commands.registerCommand('theTravisClient.setToken', () =>
    singletonInstance.setAuthToken('community')
  );

  const autoRefresh = function() {
    commands.executeCommand('theTravisClient.refresh');
  };

  const setAutoRefreshInterval = () => {
    if (singletonInstance && singletonInstance.interval()) {
      setInterval(autoRefresh, singletonInstance.interval());
    }
  };

  setAutoRefreshInterval();

  const refresh = commands.registerCommand('theTravisClient.refresh', () => {
    const repoView = new RepositoryView(context);
    repoView.initialise();
    travisStatusBarInstance.updateStatusBar(true);
  });

  const restart = commands.registerCommand('theTravisClient.restart', async data => {
    if (data && data.buildId) {
      try {
        const response = await axios.post(
          restartBuildTemplate({
            base: singletonInstance.base(),
            buildId: data.buildId
          }),
          {},
          { headers: singletonInstance.headers() }
        );
        if (response.status === 202) {
          window.showInformationMessage(`Sucessfully ${data.buildId} build is restarted`);
          commands.executeCommand('theTravisClient.refresh');
        }
      } catch (e) {
        showErrorMessage(e.response.status);
      }
    }
  });

  const cancel = commands.registerCommand('theTravisClient.cancel', async data => {
    if (data && data.buildId) {
      try {
        const response = await axios.post(
          cancelBuildTemplate({
            base: singletonInstance.base(),
            buildId: data.buildId
          }),
          {},
          { headers: singletonInstance.headers() }
        );
        if (response.status === 202) {
          window.showInformationMessage(`Sucessfully ${data.buildId} build is canceled`);
          commands.executeCommand('theTravisClient.refresh');
        }
      } catch (e) {
        showErrorMessage(e.response.status);
      }
    }
  });

  context.subscriptions.push(disposable);
  context.subscriptions.push(onChangeConfigurationDisposable);
  context.subscriptions.push(setProToken);
  context.subscriptions.push(setToken);
  context.subscriptions.push(refresh);
  context.subscriptions.push(restart);
  context.subscriptions.push(cancel);
}

// this method is called when your extension is deactivated
export function deactivate() {
  console.log('Extension the-travis-client deactivating!');
}

const showErrorMessage = (status: number) => {
  switch (status) {
    case 403:
      window.showErrorMessage('You do not have permission to restart build!');
      break;
    case 404:
      window.showErrorMessage('Build is not found!');
      break;
    default:
      window.showErrorMessage('Something went wrong!');
      break;
  }
};
