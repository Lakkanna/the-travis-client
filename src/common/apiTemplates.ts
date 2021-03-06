import * as _ from 'lodash';

export const repositoryURLTemplate = _.template('https://api.travis-ci.<%= base %>/owner/<%= owner %>/repos');
export const branchesURLTemplate = _.template('https://api.travis-ci.<%= base %>/repo/<%= repoId %>/branches');
export const buildsURLTemplate = _.template(
  'https://api.travis-ci.<%= base %>/repo/<%= repoId %>/builds?branch.name=<%= branch %>&limit=10'
);

// POST methods cancel/restart build
export const cancelBuildTemplate = _.template('https://api.travis-ci.<%= base %>/build/<%= buildId %>/cancel');
export const restartBuildTemplate = _.template('https://api.travis-ci.<%= base %>/build/<%= buildId %>/restart');
