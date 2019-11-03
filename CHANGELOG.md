# Change Log

## [Unreleased]

- Add Pull requests build status

## [0.1.4] - 2019-09-03

### Fixed

- theTravisClient command not found fixed, replaced workspace.rootPath by workspace.workspaceFolders

## [0.1.3] - 2019-06-05

### Removed

- Unused node_module packages

### Added

- Webpack configuration

## [0.1.2] - 2019-05-31

### Fixed

- Actions (Restart/Cancel) disabled for auth token error in view/context/item

## [0.1.1] - 2019-05-31

### Fixed

- Extension activation problem fixed

## [0.1.0] - 2019-05-31

### Added

- **Build Restart**: restarts individual build for already created
- **Build Cancel**: cancels individual build for already running or created build

## [0.0.9] - 2019-05-31

### Security

- Updated devDependencies reason _(axios)_ vulnerability.

## [0.0.8] - 2019-05-31

### Added

- Auto refresh after given interval _(default: 5 minutes)_

  ```json
  "travisClient.interval": 5
  ```

## [0.0.7] - 2019-05-29

- Fixed extension activation problem

## [0.0.6] - 2019-05-29

### Fixed

- Fixed activation events

## [0.0.5] - 2019-05-29

### Added

- Status bar item to show active repositories, active branch last build status

## [0.0.4] - 2019-05-28

### Added

- Check is travis project
- Auto refresh on configuration changes in **settings.json**
- Reasonable error messages

## [0.0.3] - 2019-05-24

### Added

- Travis Enterprise account (for private repository access)

## [0.0.2] - 2019-05-24

### Added

- Keywords in package.json

## [0.0.1] - 2019-05-24

### Added

- Get all repositories from https://travis-ci.org
- Get branches for all repositories
- Get build status for all branches
