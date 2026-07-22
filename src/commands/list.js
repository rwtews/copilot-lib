const { getAvailableAgents } = require('../utils/agents');
const { getAvailableInstructions } = require('../utils/instructions');
const { getAvailableSkills } = require('../utils/skills');
const { readManifest, getResourceVersion } = require('../utils/manifest');
const { getWorkspaceManifestPath, getGlobalManifestPath } = require('../utils/paths');

function list(args) {
  const installed = args.includes('--installed');
  const agents = args.includes('--agent') || args.includes('--agents');
  const instructions = args.includes('--instructions');
  const skills = args.includes('--skills');

  if (installed) {
    printInstalled();
    return;
  }

  if (agents) {
    printAgents();
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

  printAll();
}

function printAll() {
  const agents = getAvailableAgents();
  const instructions = getAvailableInstructions();
  const skills = getAvailableSkills();

  if (agents.length === 0 && instructions.length === 0 && skills.length === 0) {
    console.log('No hay recursos disponibles.');
    return;
  }

  if (agents.length > 0) {
    console.log('Agentes disponibles:');
    agents.forEach(agent => {
      const name = agent.name || agent.id;
      console.log(`  - ${agent.id} (${name}) v${agent.version}: ${agent.description}`);
    });
  } else {
    console.log('No hay agentes disponibles en agents/.');
  }

  if (instructions.length > 0) {
    console.log('\nInstrucciones disponibles:');
    instructions.forEach(inst => {
      console.log(`  - ${inst.id} (${inst.name}) v${inst.version}: ${inst.description}`);
    });
  } else {
    console.log('\nNo hay instrucciones disponibles en instructions/.');
  }

  if (skills.length > 0) {
    console.log('\nSkills disponibles:');
    skills.forEach(skill => {
      const name = skill.name || skill.id;
      console.log(`  - ${skill.id} (${name}) v${skill.version}: ${skill.description}`);
    });
  } else {
    console.log('\nNo hay skills disponibles en skills/.');
  }
}

function printInstalled() {
  const wsManifest = readManifest(getWorkspaceManifestPath());
  const globalManifest = readManifest(getGlobalManifestPath());

  console.log('Agentes instalados en workspace:');
  const wsAgents = Object.keys(wsManifest.agents || {});
  if (wsAgents.length === 0) console.log('  (ninguno)');
  else wsAgents.forEach(id => console.log(`  - ${id} v${getResourceVersion(wsManifest, 'agents', id)}`));

  console.log('\nInstrucciones instaladas en workspace:');
  const wsInstructions = Object.keys(wsManifest.instructions || {});
  if (wsInstructions.length === 0) console.log('  (ninguna)');
  else wsInstructions.forEach(id => console.log(`  - ${id} v${getResourceVersion(wsManifest, 'instructions', id)}`));

  console.log('\nSkills instalados en workspace:');
  const wsSkills = Object.keys(wsManifest.skills || {});
  if (wsSkills.length === 0) console.log('  (ninguno)');
  else wsSkills.forEach(id => console.log(`  - ${id} v${getResourceVersion(wsManifest, 'skills', id)}`));

  console.log('\nAgentes instalados globalmente:');
  const globalAgents = Object.keys(globalManifest.agents || {});
  if (globalAgents.length === 0) console.log('  (ninguno)');
  else globalAgents.forEach(id => console.log(`  - ${id} v${getResourceVersion(globalManifest, 'agents', id)}`));

  console.log('\nInstrucciones instaladas globalmente:');
  const globalInstructions = Object.keys(globalManifest.instructions || {});
  if (globalInstructions.length === 0) console.log('  (ninguna)');
  else globalInstructions.forEach(id => console.log(`  - ${id} v${getResourceVersion(globalManifest, 'instructions', id)}`));

  console.log('\nSkills instalados globalmente:');
  const globalSkills = Object.keys(globalManifest.skills || {});
  if (globalSkills.length === 0) console.log('  (ninguno)');
  else globalSkills.forEach(id => console.log(`  - ${id} v${getResourceVersion(globalManifest, 'skills', id)}`));
}

function printAgents() {
  const availableAgents = getAvailableAgents();
  if (availableAgents.length === 0) {
    console.log('No hay agentes disponibles en agents/.');
    return;
  }

  console.log('Agentes disponibles:');
  availableAgents.forEach(agent => {
    const name = agent.name || agent.id;
    console.log(`  - ${agent.id} (${name}) v${agent.version}: ${agent.description}`);
  });
}

function printInstructions() {
  const availableInstructions = getAvailableInstructions();
  if (availableInstructions.length === 0) {
    console.log('No hay instrucciones disponibles en instructions/.');
    return;
  }

  console.log('Instrucciones disponibles:');
  availableInstructions.forEach(inst => {
    console.log(`  - ${inst.id} (${inst.name}) v${inst.version}: ${inst.description}`);
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
    console.log(`  - ${skill.id} (${name}) v${skill.version}: ${skill.description}`);
  });
}

module.exports = { list };
