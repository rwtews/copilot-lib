const fs = require('fs');
const path = require('path');
const checkbox = require('@inquirer/checkbox').default;
const { Separator } = require('@inquirer/checkbox');
const { getAvailableAgents, loadAgent, getAgentBody } = require('../utils/agents');
const { getAvailableInstructions, loadInstruction } = require('../utils/instructions');
const { getAvailableSkills, loadSkill, getSkillBody } = require('../utils/skills');
const { readManifest, writeManifest, setResourceVersion, getResourceVersion } = require('../utils/manifest');
const {
  getWorkspaceAgentsDir,
  getWorkspaceDir,
  getWorkspaceSkillsDir,
  getWorkspaceManifestPath,
  getGlobalAgentsDir,
  getGlobalDir,
  getGlobalSkillsDir,
  getGlobalManifestPath,
  ensureDir
} = require('../utils/paths');

async function install(args) {
  const isGlobal = args.includes('--global');
  const force = args.includes('--force');
  const forceAgent = args.includes('--agent') || args.includes('--agents');
  const forceInstruction = args.includes('--instructions') || args.includes('--instruction');
  const forceSkill = args.includes('--skill') || args.includes('--skills');
  const resourceId = args.find(arg => !arg.startsWith('--'));

  if (resourceId) {
    return installResource(resourceId, isGlobal, forceAgent, forceInstruction, forceSkill, force);
  }

  const agents = getAvailableAgents();
  const instructions = getAvailableInstructions();
  const skills = getAvailableSkills();

  if (agents.length === 0 && instructions.length === 0 && skills.length === 0) {
    console.log('No hay recursos disponibles.');
    return;
  }

  if (!process.stdin.isTTY) {
    console.log('Entorno no interactivo. Usa:');
    console.log(`  copilot-agents install <id>${isGlobal ? ' --global' : ''}`);
    console.log('\nRecursos disponibles:');
    if (agents.length > 0) {
      console.log('\nAgentes:');
      agents.forEach(agent => console.log(`  - ${agent.id}`));
    }
    if (instructions.length > 0) {
      console.log('\nInstrucciones:');
      instructions.forEach(inst => console.log(`  - ${inst.id}`));
    }
    if (skills.length > 0) {
      console.log('\nSkills:');
      skills.forEach(skill => console.log(`  - ${skill.id}`));
    }
    return;
  }

  const manifestPath = isGlobal ? getGlobalManifestPath() : getWorkspaceManifestPath();
  const manifest = readManifest(manifestPath);

  const choices = buildChoices(agents, instructions, skills, manifest, isGlobal);

  let selected;
  try {
    selected = await checkbox({
      message: isGlobal
        ? 'Selecciona los recursos a instalar globalmente:'
        : 'Selecciona los recursos a instalar en el workspace:',
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
    console.log('No se seleccionó ningún recurso.');
    return;
  }

  for (const item of selected) {
    if (item.type === 'agent') {
      installAgent(item.id, isGlobal, force);
    } else if (item.type === 'instruction') {
      installInstruction(item.id, isGlobal, force);
    } else {
      installSkill(item.id, isGlobal, force);
    }
  }
}

function buildChoices(agents, instructions, skills, manifest, isGlobal) {
  const choices = [];

  if (agents.length > 0) {
    choices.push(new Separator('Agentes'));
    choices.push(...agents.map(agent => ({
      name: `${agent.id} (${agent.name || agent.id}) - ${agent.description}`,
      value: { type: 'agent', id: agent.id },
      checked: isAgentInstalled(agent.id, isGlobal)
    })));
  }

  if (instructions.length > 0) {
    choices.push(new Separator('Instrucciones'));
    choices.push(...instructions.map(inst => ({
      name: `${inst.id} (${inst.name}) - ${inst.description}`,
      value: { type: 'instruction', id: inst.id },
      checked: isInstructionInstalled(inst.id, isGlobal)
    })));
  }

  if (skills.length > 0) {
    choices.push(new Separator('Skills'));
    choices.push(...skills.map(skill => ({
      name: `${skill.id} (${skill.name || skill.id}) - ${skill.description}`,
      value: { type: 'skill', id: skill.id },
      checked: isSkillInstalled(skill.id, isGlobal)
    })));
  }

  return choices;
}

function installResource(id, isGlobal, forceAgent, forceInstruction, forceSkill, force) {
  const isAgent = getAvailableAgents().some(a => a.id === id);
  const isInstruction = getAvailableInstructions().some(i => i.id === id);
  const isSkill = getAvailableSkills().some(s => s.id === id);

  if (forceAgent) {
    return installAgent(id, isGlobal, force);
  }
  if (forceInstruction) {
    return installInstruction(id, isGlobal, force);
  }
  if (forceSkill) {
    return installSkill(id, isGlobal, force);
  }

  const matches = [isAgent && 'agente', isInstruction && 'instrucción', isSkill && 'skill'].filter(Boolean);
  if (matches.length > 1) {
    console.error(`Error: "${id}" coincide con ${matches.join(' y ')}. Usa --agent, --instructions o --skill para especificar el tipo.`);
    process.exit(1);
  }
  if (isAgent) {
    return installAgent(id, isGlobal, force);
  }
  if (isInstruction) {
    return installInstruction(id, isGlobal, force);
  }
  if (isSkill) {
    return installSkill(id, isGlobal, force);
  }

  console.error(`Error: no se encontró el recurso "${id}".`);
  process.exit(1);
}

function installAgent(agentId, isGlobal, force) {
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
  const installedVersion = getResourceVersion(manifest, 'agents', agent.id);

  if (fs.existsSync(targetPath) && installedVersion === agent.version && !force) {
    console.log(`El agente "${agentId}" ya está instalado en la versión ${installedVersion}. Usa "copilot-agents update" para refrescarlo o "--force" para reinstalarlo.`);
    return;
  }

  ensureDir(targetDir);
  fs.copyFileSync(agent.filePath, targetPath);

  setResourceVersion(manifest, 'agents', agent.id, agent.version);
  writeManifest(manifestPath, manifest);

  const action = installedVersion === agent.version ? 'reinstalado' : 'instalado';
  console.log(`Agente "${agentId}" ${action} ${isGlobal ? 'globalmente' : 'en el workspace'} (v${agent.version}).`);
}

function installInstruction(instructionId, isGlobal, force) {
  const instruction = loadInstruction(`${instructionId}-instructions.md`);
  if (!instruction) {
    console.error(`Error: no se encontró la instrucción "${instructionId}".`);
    process.exit(1);
  }

  const targetDir = isGlobal ? getGlobalDir() : getWorkspaceDir();
  const targetPath = path.join(targetDir, instruction.fileName);
  const manifestPath = isGlobal ? getGlobalManifestPath() : getWorkspaceManifestPath();

  const manifest = readManifest(manifestPath);
  const installedVersion = getResourceVersion(manifest, 'instructions', instruction.id);

  if (fs.existsSync(targetPath) && installedVersion === instruction.version && !force) {
    console.log(`La instrucción "${instructionId}" ya está instalada en la versión ${installedVersion}. Usa "copilot-agents update" para refrescarla o "--force" para reinstalarla.`);
    return;
  }

  ensureDir(targetDir);
  fs.copyFileSync(instruction.filePath, targetPath);

  setResourceVersion(manifest, 'instructions', instruction.id, instruction.version);
  writeManifest(manifestPath, manifest);

  const action = installedVersion === instruction.version ? 'reinstalada' : 'instalada';
  console.log(`Instrucción "${instructionId}" ${action} ${isGlobal ? 'globalmente' : 'en el workspace'} (v${instruction.version}).`);
}

function installSkill(skillId, isGlobal, force) {
  const skill = loadSkill(skillId);
  if (!skill) {
    console.error(`Error: no se encontró el skill "${skillId}".`);
    process.exit(1);
  }

  const body = getSkillBody(skill);
  if (!body.trim()) {
    console.error(`Error: el skill "${skillId}" no tiene instrucciones.`);
    process.exit(1);
  }

  const targetRoot = isGlobal ? getGlobalSkillsDir() : getWorkspaceSkillsDir();
  const targetDir = path.join(targetRoot, skill.id);
  const manifestPath = isGlobal ? getGlobalManifestPath() : getWorkspaceManifestPath();

  const manifest = readManifest(manifestPath);
  const installedVersion = getResourceVersion(manifest, 'skills', skill.id);

  if (fs.existsSync(targetDir) && installedVersion === skill.version && !force) {
    console.log(`El skill "${skillId}" ya está instalado en la versión ${installedVersion}. Usa "copilot-agents update" para refrescarlo o "--force" para reinstalarlo.`);
    return;
  }

  ensureDir(targetRoot);
  fs.cpSync(skill.dirPath, targetDir, { recursive: true, force: true });

  setResourceVersion(manifest, 'skills', skill.id, skill.version);
  writeManifest(manifestPath, manifest);

  const action = installedVersion === skill.version ? 'reinstalado' : 'instalado';
  console.log(`Skill "${skillId}" ${action} ${isGlobal ? 'globalmente' : 'en el workspace'} (v${skill.version}).`);
}

function isAgentInstalled(agentId, isGlobal) {
  const targetDir = isGlobal ? getGlobalAgentsDir() : getWorkspaceAgentsDir();
  return fs.existsSync(path.join(targetDir, `${agentId}.agent.md`));
}

function isInstructionInstalled(instructionId, isGlobal) {
  const targetDir = isGlobal ? getGlobalDir() : getWorkspaceDir();
  return fs.existsSync(path.join(targetDir, `${instructionId}-instructions.md`));
}

function isSkillInstalled(skillId, isGlobal) {
  const targetRoot = isGlobal ? getGlobalSkillsDir() : getWorkspaceSkillsDir();
  return fs.existsSync(path.join(targetRoot, skillId));
}

module.exports = { install };
