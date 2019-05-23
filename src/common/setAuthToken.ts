import * as vscode from 'vscode';

const setAuthToken = async (context: vscode.ExtensionContext) => {
  const newToken = await vscode.window.showInputBox({
    prompt: 'Please add auth token for travis client!',
    placeHolder: 'Add travis token here',
    value: undefined
  });
  if (newToken) {
    context.globalState.update('travisAuthToken', newToken);
    vscode.commands.executeCommand('theTravisClient.refresh');
    vscode.window.showInformationMessage('You successfully added token, loading repositories wait a moment.');
  } else {
    vscode.window.showWarningMessage('You failed to add token, try again (Shift + CMD + P) travis set token');
  }
};

export default setAuthToken;