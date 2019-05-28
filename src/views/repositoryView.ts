import { RepoNodeProvider } from '../nodes/nodeProvider';
import { ExtensionContext, window } from "vscode";

export class RepositoryView {
  private repoNodeProvider: any;
  private _tree: any;

  constructor(private context: ExtensionContext) {
    this.repoNodeProvider = new RepoNodeProvider(this.context);
  }
  public initialise() {
    this._tree = window.registerTreeDataProvider('repositories', this.repoNodeProvider);
    return this._tree;
  }
}