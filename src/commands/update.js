const fs = require('fs');
const path = require('path');
const { loadAgent, getAgentBody } = require('../utils/agents');
const {
  getWorkspaceAgentsDir,
  getWorkspaceManifestPath,
  getGlobalAgentsDir,
  getGlobalManifestPath,
  ensureDir
} = require('../utils/paths');

function update(args) {
  const isGlobal = args.includes('--global');

  if (!isGlobal) {
    updateTarget(getWorkspaceManifestPath(), getWorkspaceAgentsDir(), 'workspace');
  }

  updateTarget(getGlobalManifestPath(), getGlobalAgentsDir(), 'global');
}

function updateTarget(manifestPath, targetDir, label) {
  if (!fs.existsSync(manifestPath)) {
    console.log(`No hay agentes instalados en ${label}.`);
    return;
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (err) {
    console.error(`Error leyendo manifiesto de ${label}: ${err.message}`);
    return;
  }

  if (!manifest.agents || manifest.agents.length === 0) {
    console.log(`No hay agentes instalados en ${label}.`);
    return;
  }

  ensureDir(targetDir);

  const keptAgents = [];

  for (const agentId of manifest.agents) {
    const agent = loadAgent(`${agentId}.agent.md`);
    if (!agent) {
      console.warn(`Advertencia: el agente "${agentId}" ya no existe en el repositorio. Se omitirá.`);
      continue;
    }

    const body = getAgentBody(agent);
    if (!body.trim()) {
      console.warn(`Advertencia: el agente "${agentId}" no tiene instrucciones. Se omitirá.`);
      continue;
    }

    const targetPath = path.join(targetDir, agent.fileName);
    fs.copyFileSync(agent.filePath, targetPath);
    keptAgents.push(agent.id);
  }

  // Remove agents that are no longer in the manifest
  if (fs.existsSync(targetDir)) {
    const installedFiles = fs.readdirSync(targetDir).filter(name => name.endsWith('.agent.md'));
    const validFiles = new Set(keptAgents.map(id => `${id}.agent.md`));
    for (const file of installedFiles) {
      if (!validFiles.has(file)) {
        fs.unlinkSync(path.join(targetDir, file));
      }
    }
  }

  manifest.agents = keptAgents;
  manifest.updatedAt = new Date().toISOString();
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`Actualizado(s) ${keptAgents.length} agente(s) en ${label}.`);
}

module.exports = { update };
