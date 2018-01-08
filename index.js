#!/usr/bin/env node

var fs = require('fs');
let path = require('path');
let chalk = require('chalk');
let packageInfo = require('./package.json');
let gitLabel = require('git-label');

let labelsToCreatePath = path.join(process.cwd(), `./labels-to-create.json`);
let labelsToCreate = fs.existsSync(labelsToCreatePath) ? require(labelsToCreatePath) : [];

let labelsToRemovePath = path.join(process.cwd(), './labels-to-remove.json');
let labelsToRemove = fs.existsSync(labelsToRemovePath) ? require(labelsToRemovePath) : [];

let log = msg => console.log(msg);
let logDanger = msg => console.log(chalk.red.bold(msg));
let logInfo = msg => console.log(chalk.blue.bold(msg));

if (!process.env.GITHUB_TOKEN) {
  log(`$GITHUB_TOKEN env variable MUST be provided`);
  process.exit(1);
}

if (
  process.argv.indexOf('--help') !== -1 ||
  process.argv.indexOf('-h') !== -1 ||
  process.argv.length <= 2
) {
  log(`${packageInfo.name} version: ${packageInfo.version}`);
  log(`Synopsis: create and remove labels across GitHub repositories\n`);

  logDanger(`----------------------------------------------------------------`);
  logDanger(`Be careful! Use it only for new repository or`);
  logDanger(`repositories with a little count of issues`);
  logDanger(`Existing labels applied to issues can be lost`);
  logDanger(`Label replacement instead of deleting will be added (maybe...)`);
  logDanger(`----------------------------------------------------------------\n`);

  log(`$GITHUB_TOKEN env variable MUST be provided!`);
  log(`'labels-to-add.json' and 'labels-to-remove.json' **SHOULD** be in CWD\n`);
  logInfo(`json:`);
  log(`[ { "name": "closed: completed", "color": "#d93f0b" }, ... ]\n`);

  logInfo(`Examples:`);
  log(`$ git-label -- opuscapita/minsk-core-sandbox opuscapita/test-circleci-release-process`);
  log(`$ git-label --repositories-json\n`);

  log(`Issues: https://github.com/OpusCapita/git-label-cli/issues\n\n`);

  process.exit(0);
}

let repositoriesSelectionMethod = process.argv.indexOf('--repositories-json') !== -1 ? 'FROM_FILE' : 'FROM_ARGV';
let repositories = repositoriesSelectionMethod === 'FROM_FILE' ?
    require(path.join(process.cwd(), './repositories.json')) :
    process.argv.slice(2, process.argv.length);

function applyLabels({ api, repository, token, labelsToCreate, labelsToRemove }) {
  let config = {
	  api,
	  repo: repository,
	  token
  };

  gitLabel.remove(config, labelsToRemove)
	  .then(console.log)
	  .catch(console.log);

  gitLabel.add(config, labelsToCreate)
	  .then(console.log)
	  .catch(console.log);
}

repositories.forEach(repository => {
  applyLabels({
	  api: 'https://api.github.com',
	  repository,
	  token: process.env.GITHUB_TOKEN,
	  labelsToCreate,
	  labelsToRemove
  });
});
