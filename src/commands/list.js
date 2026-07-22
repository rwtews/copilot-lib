const fs = require('fs');
const { getAvailableAgents } = require('../utils/agents');
const { getAvailableInstructions } = require('../utils/instructions');
const { getWorkspaceManifestPath, getGlobalManifestPath } = require('../utils/paths');

function list(args) {
  const installed = args.includes('--installed');
  const instructions = args.includes('--instructions');

  if (installed) {
    console.log('Agentes instalados en workspace:');
    const wsManifest = readManifest(getWorkspaceManifestPath());
    if (!wsManifest.agents || wsManifest.agents.length === 0) console.log('  (ninguno)');
    else wsManifest.agents.forEach(id => console.log(`  - ${id}`));

    console.log('\nInstrucciones instaladas en workspace:');
    if (!wsManifest.instructions || wsManifest.instructions.length === 0) console.log('  (ninguna)');
    else wsManifest.instructions.forEach(id => console.log(`  - ${id}`));

    console.log('\nAgentes instalados globalmente:');
    const globalManifest = readManifest(getGlobalManifestPath());
    if (!globalManifest.agents || globalManifest.agents.length === 0) console.log('  (ninguno)');
    else globalManifest.agents.forEach(id => console.log(`  - ${id}`));

    console.log('\nInstrucciones instaladas globalmente:');
    if (!globalManifest.instructions || globalManifest.instructions.length === 0) console.log('  (ninguna)');
    else globalManifest.instructions.forEach(id => console.log(`  - ${id}`));
    return;
  }

  if (instructions) {
    const availableInstructions = getAvailableInstructions();
    if (availableInstructions.length === 0) {
      console.log('No hay instrucciones disponibles en instructions/.');
      return;
    }

    console.log('Instrucciones disponibles:');
    availableInstructions.forEach(inst => {
      console.log(`  - ${inst.id} (${inst.name}): ${inst.description}`);
    });
    return;
  }

  const agents = getAvailableAgents();
  if (agents.length === 0) {
    console.log('No hay agentes disponibles en agents/.');
    return;
  }

  console.log('Agentes disponibles:');
  agents.forEach(agent => {
    const name = agent.name || agent.id;
    console.log(`  - ${agent.id} (${name}): ${agent.description}`);
  });
}

function readManifest(manifestPath) {
  if (!fs.existsSync(manifestPath)) return { agents: [], instructions: [] };
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (err) {
    return { agents: [], instructions: [] };
  }
}

module.exports = { list };
