#!/usr/bin/env node

var fs = require('fs');
let path = require('path');
let chalk = require('chalk');
let packageInfo = require('./package.json');
let axios = require('axios');

let labelsToUpdatePath = path.join(process.cwd(), `./labels-to-update.json`);
let labelsToUpdate = fs.existsSync(labelsToUpdatePath) ? require(labelsToUpdatePath) : [];

let labelsToCreatePath = path.join(process.cwd(), `./labels-to-create.json`);
let labelsToCreate = fs.existsSync(labelsToCreatePath) ? require(labelsToCreatePath) : [];

let labelsToRemovePath = path.join(process.cwd(), './labels-to-remove.json');
let labelsToRemove = fs.existsSync(labelsToRemovePath) ?
    require(labelsToRemovePath).map(label => ({ ...label, color: '#fff' })) : [];

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

async function getIssuesForRepo({api, repository, token}) {
  try {
    let response = await axios.get(
      `${api}/repos/${repository}/issues`,
      { 'headers': { 'Authorization': `token ${token}` } }
    );
    return response.data
  }
  catch(error) {
    console.log(error);
  }
}

async function getLabelsForIssue({api, repository, token}, issue) {
  try {
    let response = await axios.get(
      `${api}/repos/${repository}/issues/${issue.number}/labels`,
      { 'headers': { 'Authorization': `token ${token}` } })

    let labelBackup = {
      "repository": repository,
      "issue": issue.number,
      "labels": response.data
    };

    return labelBackup;
  }

  catch(error) {
    console.log(error);
  }
}

async function getUsedLabels({api, repository, token}) {
  let issues = await getIssuesForRepo({api, repository, token});
  let usedLabels = await Promise.all(issues.map(issue => {
    return getLabelsForIssue({api, repository, token}, issue)
  }));

  return usedLabels;
}

async function createBackup({ api, repository, token }) {
  let backup = [];
  let usedLabels = await getUsedLabels({ api, repository, token });
  backup.push(usedLabels);

  let currentDate = new Date();
  fs.writeFile(`used-labels-${currentDate.toISOString()}.json.bak`, JSON.stringify(backup), (err) => {
    if (err) throw err;
  });

  console.log("Your labels were saved to 'used-labels.json.bak'.");
  return backup;
}

async function deleteLabel({api, repository, token}, label) {
  try {
    await axios.delete(
      `${api}/repos/${repository}/labels/${label.name}`,
      { 'headers': { 'Authorization': `token ${token}` } });
  }
  catch(error) {
    console.log(error);
  }
}

async function deleteLabels({api, repository, token}, labelsToRemove) {
  labelsToRemove.forEach(label => {
    return deleteLabel({api, repository, token}, label)
  })
  console.log(`Removed ${labelsToRemove.length} labels`);
}

async function updateLabel({api, repository, token}, label) {
  let keys = Object.keys(label);
  let filteredKeys = keys.slice(1, keys.length);
  let updatedLabel = {};
  filteredKeys.forEach(key => {
    updatedLabel[key] = key === "color" ? label[key].replace('#', '') : label[key];
  });
  try {
    let response = await axios.patch(
      `${api}/repos/${repository}/labels/${label.currentName}`,
        updatedLabel,
      {
        headers: {"Authorization": `token ${token}`}
      }
    )
    return response.data;
  }
  catch(error) {
    console.log(error);
  }
}

async function updateLabels({api, repository, token}, labelsToUpdate) {
  labelsToUpdate.forEach(label => {
    return updateLabel({api, repository, token}, label);
  });
  console.log(`Updated ${labelsToUpdate.length} labels`);
}

async function createLabel({api, repository, token}, label) {
  let color = label.color.replace('#', '');
  try {
    let response = await axios.post(
      `${api}/repos/${repository}/labels`,
      {
        "name": label.name,
        "color": color
      },
      {
        headers: {"Authorization": `token ${token}`}
      }
    )
    return response.data;
  }
  catch(error) {
    console.log(error);
  }
}

async function createLabels({api, repository, token}, labelsToCreate) {
  labelsToCreate.forEach(label => {
    return createLabel({api, repository, token}, label);
  });
  console.log(`Created ${labelsToCreate.length} labels`);
}

function applyLabels({ api, repository, token, labelsToUpdate, labelsToCreate, labelsToRemove }) {
  let config = {
	  api,
	  repository,
	  token
  };

  updateLabels(config, labelsToUpdate);

  createLabels(config, labelsToCreate);

  deleteLabels(config, labelsToRemove);
}

repositories.forEach(repository => {
  createBackup({
    api: 'https://api.github.com',
    repository,
    token: process.env.GITHUB_TOKEN
  });
  applyLabels({
	  api: 'https://api.github.com',
	  repository,
	  token: process.env.GITHUB_TOKEN,
    labelsToUpdate,
	  labelsToCreate,
	  labelsToRemove
  });
});
