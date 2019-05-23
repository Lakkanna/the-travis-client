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
						} else if (branch.state === 'created') {
							timeInfo = 'Recently created';
						} else {
							timeInfo = _.replace(time, /[\/]/g, "-");
						}
					}
					return new Dependency(
						branch.name ? branch.name : timeInfo,
						branch.state,
						_.get(branch, "id", branch.name),
						branch,
						branch.active ? vscode.TreeItemCollapsibleState.Expanded : branch.name ?
							vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
					);
				});
			} else {
				return _.map(_.keys(data), (key) => {
					return new Dependency(
						key, data[key].state,
						data[key].id ? data[key].id : key, data[key],
						data[key].active ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed);
				});
			}
		} else {
			return [];
		}
	}
}

export class Dependency extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		private state: string,
		private buildId: string,
		public prevData: any,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
	}

	get tooltip(): string {
		if (this.state) {
			return `${this.buildId}-${this.state}`;
		} else {
			return `${this.buildId}`;
		}
	}

	get description(): string {
		if (this.state === 'branch' || this.state === 'repository') {
			return this.state;
		} else {
			return "";
		}
	}

	public getIconPath() {
		switch (this.state) {
			case 'started':
				return {
					dark: path.join(__filename, '..', '..', '..', 'images', 'color', 'clock.svg'),
					light: path.join(__filename, '..', '..', '..', 'images', 'color', 'clock.svg'),
				};
			case 'created':
						return {
							dark: path.join(__filename, '..', '..', '..', 'images', 'color', 'plus.svg'),
							light: path.join(__filename, '..', '..', '..', 'images', 'color', 'plus.svg'),
						};
			case 'running':
				return {
					dark: path.join(__filename, '..', '..', '..', 'images', 'color', 'clock.svg'),
					light: path.join(__filename, '..', '..', '..', 'images', 'color', 'clock.svg'),
				};
			case 'passed':
				return {
					dark: path.join(__filename, '..', '..', '..', 'images', 'color', 'check.svg'),
					light: path.join(__filename, '..', '..', '..', 'images', 'color', 'check.svg')
				};
			case 'failed': 
				return {
					dark: path.join(__filename, '..', '..', '..', 'images', 'color', 'x.svg'),
					light: path.join(__filename, '..', '..', '..', 'images', 'color', 'x.svg')
				};
			case 'errored': 
				return {
					dark: path.join(__filename, '..', '..', '..', 'images', 'color', 'stop.svg'),
					light: path.join(__filename, '..', '..', '..', 'images', 'color', 'stop.svg')
				};
			case 'branch':
				return {
					dark: path.join(__filename, '..', '..', '..', 'images', 'color', 'branch.svg'),
					light: path.join(__filename, '..', '..', '..', 'images', 'color', 'branch.svg'),
				};
			default:
				return {
					dark: path.join(__filename, '..', '..', '..', 'images', 'color', 'repo.svg'),
					light: path.join(__filename, '..', '..', '..', 'images', 'color', 'repo.svg')
				};
			}
		}

	iconPath = this.getIconPath();
	contextValue = 'dependency';

}