import * as vscode from 'vscode';
import * as path from 'path';
import * as _ from 'lodash';

export class RepoNodeProvider implements vscode.TreeDataProvider<Dependency> {
	private _onDidChangeTreeData: vscode.EventEmitter<Dependency | undefined> = new vscode.EventEmitter<Dependency | undefined>();
	readonly onDidChangeTreeData: vscode.Event<Dependency | undefined> = this._onDidChangeTreeData.event;

	constructor(private data: any, private ActiveRepositoryInstance: any) {}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: Dependency): vscode.TreeItem {
		return element;
	}

	public getChildren(element?: Dependency): Thenable<Dependency[]> {
		if (element) {
			let data = _.get(element, ["prevData", element.label]);
			if (!data) {
				//data = this.data.filter((nestedEl: any) => nestedEl.name === element.label)[0][element.label];
				data = _.chain(this.data)
					.filter((nestedEl: any) => nestedEl.name === element.label)
					.first()
					.value()
					.get(element.label);
			}
			return Promise.resolve(this.getDepsInPackageJson(data));
		} else {
			if (this.data) {
				return Promise.resolve(this.getDepsInPackageJson(this.data));
			} else {
				vscode.window.showInformationMessage('Problem while getting repositories.!');
				return Promise.resolve([]);
			}
		}
	}

	private getDepsInPackageJson(data: any): Dependency[] {
		const timeEnum = {
			'passed': 'finished_at',
			'started': 'started_at',
			'errored': 'started_at',
			'failed': 'finished_at'
		};
		if (data) {
			if (Array.isArray(data)) {
				return data.map((branch: any) => {
					let timeInfo: string = '';
					if (!branch.name) {
						const time = new Date(_.get(branch, [_.get(timeEnum, [branch.state])])).toLocaleString();
						if (branch.state === 'started') {
							let duration = Math.round(_.get(branch, "duration")  / 60).toString();
							duration += (duration === '1') ? ' minute' : ' minutes';
							timeInfo = duration;
						} else {
							timeInfo = _.replace(time, /[\/]/g, "-");
						}
					}
					return new Dependency(
						branch.name ? branch.name : timeInfo,
						branch.state,
						branch,
						branch.name ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
					);
				});
			} else {
				return _.map(_.keys(data), (key) => {
					return new Dependency(key, data[key].state, data[key], vscode.TreeItemCollapsibleState.Collapsed);
				});
				//return [new Dependency(data.name, data.state, data, vscode.TreeItemCollapsibleState.Collapsed)];
			}
		} else {
			return [];
		}
	}
}

export class Dependency extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		private version: string,
		public prevData: any,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
	}

	get tooltip(): string {
		return `${this.label}-${this.version}`;
	}

	get description(): string {
		return this.version;
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
	};

	contextValue = 'dependency';

}