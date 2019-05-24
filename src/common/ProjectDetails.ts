import * as vscode from 'vscode';

interface IKey {
  [key: string]: any;
}

interface IObject {
  storageKey: string;
  base: string;
  prompt: string;
  placeholder: string;
}

const AccountType: IKey = {
  'enterprise': {
    storageKey: 'travisProToken',
    base: 'com',
    prompt: 'Please add enterprise auth token for travis client!',
    placeHolder: 'Add travis enterprise token here',
  },
  'community': {
    storageKey: 'travisAuthToken',
    base: 'org',
    prompt: 'Please add community auth token for travis client!',
    placeHolder: 'Add travis community token here',
  }
};

export default class ProjectDetails {

  static getAccountType() {
    return vscode.workspace.getConfiguration('travisClient').get('pro') === true ? 'enterprise' : 'community';
  }

  static getProjectDetails(context: vscode.ExtensionContext) {
    const currentProjectDetails = AccountType[ProjectDetails.getAccountType()];
    return {
      base: currentProjectDetails.base,
      token: context.globalState.get(currentProjectDetails.storageKey, ""),
      storageKey: currentProjectDetails.storageKey
    };
  }

  async setAuthToken(context: vscode.ExtensionContext, accountFlavour?:string) {
    let type = accountFlavour;
    if (!type) {
      type = ProjectDetails.getAccountType();
    }

    const accountContext: IObject = AccountType[type];
    const newToken = await vscode.window.showInputBox({
      prompt: accountContext.prompt,
      placeHolder: accountContext.placeholder,
      value: undefined
    });

    if (newToken) {
      context.globalState.update(accountContext.storageKey, newToken);
      vscode.commands.executeCommand('theTravisClient.refresh');
      vscode.window.showInformationMessage('You successfully added token, loading repositories wait a moment.');
    } else {
      vscode.window.showWarningMessage('You failed to add token, try again (Shift + CMD + P) travis set token');
    }
  }

}
