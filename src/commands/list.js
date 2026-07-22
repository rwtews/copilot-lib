const fs = require('fs');
const { getAvailableAgents } = require('../utils/agents');
const { getAvailableInstructions } = require('../utils/instructions');
const { getAvailableSkills } = require('../utils/skills');
const { getWorkspaceManifestPath, getGlobalManifestPath } = require('../utils/paths');

function list(args) {
  const installed = args.includes('--installed');
  const instructions = args.includes('--instructions');
  const skills = args.includes('--skills');

  if (installed) {
    printInstalled();
    return;
  }

  if (instructions) {
    printInstructions();
    return;
  }

  if (skills) {
    printSkills();
    return;
  }

  printAgents();
}

function printInstalled() {
  const wsManifest = readManifest(getWorkspaceManifestPath());
  const globalManifest = readManifest(getGlobalManifestPath());

  console.log('Agentes instalados en workspace:');
  if (!wsManifest.agents || wsManifest.agents.length === 0) console.log('  (ninguno)');
  else wsManifest.agents.forEach(id => console.log(`  - ${id}`));

  console.log('\nInstrucciones instaladas en workspace:');
  if (!wsManifest.instructions || wsManifest.instructions.length === 0) console.log('  (ninguna)');
  else wsManifest.instructions.forEach(id => console.log(`  - ${id}`));

  console.log('\nSkills instalados en workspace:');
  if (!wsManifest.skills || wsManifest.skills.length === 0) console.log('  (ninguno)');
  else wsManifest.skills.forEach(id => console.log(`  - ${id}`));

  console.log('\nAgentes instalados globalmente:');
  if (!globalManifest.agents || globalManifest.agents.length === 0) console.log('  (ninguno)');
  else globalManifest.agents.forEach(id => console.log(`  - ${id}`));

  console.log('\nInstrucciones instaladas globalmente:');
  if (!globalManifest.instructions || globalManifest.instructions.length === 0) console.log('  (ninguna)');
  else globalManifest.instructions.forEach(id => console.log(`  - ${id}`));

  console.log('\nSkills instalados globalmente:');
  if (!globalManifest.skills || globalManifest.skills.length === 0) console.log('  (ninguno)');
  else globalManifest.skills.forEach(id => console.log(`  - ${id}`));
}

function printInstructions() {
  const availableInstructions = getAvailableInstructions();
  if (availableInstructions.length === 0) {
    console.log('No hay instrucciones disponibles en instructions/.');
    return;
  }

  console.log('Instrucciones disponibles:');
  availableInstructions.forEach(inst => {
    console.log(`  - ${inst.id} (${inst.name}): ${inst.description}`);
  });
}

function printSkills() {
  const availableSkills = getAvailableSkills();
  if (availableSkills.length === 0) {
    console.log('No hay skills disponibles en skills/.');
    return;
  }

  console.log('Skills disponibles:');
  availableSkills.forEach(skill => {
    const name = skill.name || skill.id;
    console.log(`  - ${skill.id} (${name}): ${skill.description}`);
  });
}

function printAgents() {
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
  if (!fs.existsSync(manifestPath)) return { agents: [], instructions: [], skills: [] };
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (err) {
    return { agents: [], instructions: [], skills: [] };
  }
}

module.exports = { list };
