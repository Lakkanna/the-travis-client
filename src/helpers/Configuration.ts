import * as vscode from 'vscode';

export default class Configuration {
  private _authToken: string;

  constructor() {
    this._authToken = vscode.workspace.getConfiguration('travisClient')['github_oauth_token'];
  }

  get token() {
    return this._authToken;
  }
}
