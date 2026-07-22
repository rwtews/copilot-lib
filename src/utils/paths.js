const os = require('os');
const path = require('path');
const fs = require('fs');

function getGlobalDir() {
  return path.join(os.homedir(), '.copilot');
}

function getGlobalAgentsDir() {
  return path.join(getGlobalDir(), 'agents');
}

function getGlobalSkillsDir() {
  return path.join(getGlobalDir(), 'skills');
}

function getGlobalManifestPath() {
  return path.join(os.homedir(), '.copilot-agents.json');
}

function getWorkspaceRoot() {
  return process.cwd();
}

function getWorkspaceDir() {
  return path.join(getWorkspaceRoot(), '.github');
}

function getWorkspaceAgentsDir() {
  return path.join(getWorkspaceDir(), 'agents');
}

function getWorkspaceSkillsDir() {
  return path.join(getWorkspaceDir(), 'skills');
}

function getWorkspaceManifestPath() {
  return path.join(getWorkspaceRoot(), '.copilot-agents.json');
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

module.exports = {
  getGlobalDir,
  getGlobalAgentsDir,
  getGlobalSkillsDir,
  getGlobalManifestPath,
  getWorkspaceRoot,
  getWorkspaceDir,
  getWorkspaceAgentsDir,
  getWorkspaceSkillsDir,
  getWorkspaceManifestPath,
  ensureDir
};
