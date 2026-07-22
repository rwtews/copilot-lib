const fs = require('fs');
const path = require('path');
const checkbox = require('@inquirer/checkbox').default;
const { getAvailableAgents, loadAgent, getAgentBody } = require('../utils/agents');
const {
  getWorkspaceAgentsDir,
  getWorkspaceManifestPath,
  getGlobalAgentsDir,
  getGlobalManifestPath,
  ensureDir
} = require('../utils/paths');

async function install(args) {
  const isGlobal = args.includes('--global');
  const agentId = args.find(arg => !arg.startsWith('--'));

  if (agentId) {
    return installAgent(agentId, isGlobal);
  }

  const agents = getAvailableAgents();
  if (agents.length === 0) {
    console.log('No hay agentes disponibles en agents/.');
    return;
  }

  if (!process.stdin.isTTY) {
    console.log('Entorno no interactivo. Usa:');
    console.log(`  copilot-agents install <id>${isGlobal ? ' --global' : ''}`);
    console.log('\nAgentes disponibles:');
    agents.forEach(agent => console.log(`  - ${agent.id}`));
    return;
  }

  const manifestPath = isGlobal ? getGlobalManifestPath() : getWorkspaceManifestPath();
  const manifest = readManifest(manifestPath);

  const choices = agents.map(agent => ({
    name: `${agent.id} (${agent.name || agent.id}) - ${agent.description}`,
    value: agent.id,
    checked: manifest.agents.includes(agent.id)
  }));

  let selected;
  try {
    selected = await checkbox({
      message: isGlobal
        ? 'Selecciona los agentes a instalar globalmente:'
        : 'Selecciona los agentes a instalar en el workspace:',
      choices,
      required: false
    });
  } catch (err) {
    if (err.message && err.message.toLowerCase().includes('user force closed')) {
      console.log('\nCancelado.');
      return;
    }
    throw err;
  }

  if (selected.length === 0) {
    console.log('No se seleccionó ningún agente.');
    return;
  }

  for (const id of selected) {
    installAgent(id, isGlobal);
  }
}

function installAgent(agentId, isGlobal) {
  const agent = loadAgent(`${agentId}.agent.md`);
  if (!agent) {
    console.error(`Error: no se encontró el agente "${agentId}".`);
    process.exit(1);
  }

  const body = getAgentBody(agent);
  if (!body.trim()) {
    console.error(`Error: el agente "${agentId}" no tiene instrucciones.`);
    process.exit(1);
  }

  const targetDir = isGlobal ? getGlobalAgentsDir() : getWorkspaceAgentsDir();
  const targetPath = path.join(targetDir, agent.fileName);
  const manifestPath = isGlobal ? getGlobalManifestPath() : getWorkspaceManifestPath();

  const manifest = readManifest(manifestPath);
  if (manifest.agents.includes(agent.id)) {
    console.log(`El agente "${agentId}" ya está instalado. Usa "copilot-agents update" para refrescarlo.`);
    return;
  }

  ensureDir(targetDir);
  fs.copyFileSync(agent.filePath, targetPath);

  manifest.agents.push(agent.id);
  manifest.updatedAt = new Date().toISOString();
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`Agente "${agentId}" instalado ${isGlobal ? 'globalmente' : 'en el workspace'}.`);
}

function readManifest(manifestPath) {
  if (!fs.existsSync(manifestPath)) return { agents: [] };
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (err) {
    return { agents: [] };
  }
}

module.exports = { install };
