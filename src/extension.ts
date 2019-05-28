import { commands, ExtensionContext } from 'vscode';
import { ProjectDetails } from './common/ProjectDetails';
import { RepositoryView } from './views/repositoryView';

export function activate(context: ExtensionContext) {

  const ProjectDetailsInstance = new ProjectDetails();
  const repoView = new RepositoryView(context);
  const tree = repoView.initialise();

  const disposable = commands.registerCommand('extension.theTravisClient', () => tree);
  const setProToken = commands.registerCommand('theTravisClient.setProToken', function() {
    ProjectDetailsInstance.setAuthToken(context, 'enterprise');
  });

  const setToken = commands.registerCommand('theTravisClient.setToken', function() {
    ProjectDetailsInstance.setAuthToken(context, 'community');
  });

  const refresh = commands.registerCommand('theTravisClient.refresh', function() {
    const repoView = new RepositoryView(context);
    repoView.initialise();
  });

  context.subscriptions.push(disposable);
  context.subscriptions.push(setProToken);
  context.subscriptions.push(setToken);
  context.subscriptions.push(refresh);
}

// this method is called when your extension is deactivated
export function deactivate() {}
