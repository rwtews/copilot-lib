const fs = require('fs');
const path = require('path');
const checkbox = require('@inquirer/checkbox').default;
const { Separator } = require('@inquirer/checkbox');
const { getAvailableAgents, loadAgent, getAgentBody } = require('../utils/agents');
const { getAvailableInstructions, loadInstruction } = require('../utils/instructions');
const { getAvailableSkills, loadSkill, getSkillBody } = require('../utils/skills');
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
  const forceAgent = args.includes('--agent') || args.includes('--agents');
  const forceInstruction = args.includes('--instructions') || args.includes('--instruction');
  const forceSkill = args.includes('--skill') || args.includes('--skills');
  const resourceId = args.find(arg => !arg.startsWith('--'));

  if (resourceId) {
    return installResource(resourceId, isGlobal, forceAgent, forceInstruction, forceSkill);
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

  const choices = buildChoices(agents, instructions, skills, manifest);

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
      installAgent(item.id, isGlobal);
    } else if (item.type === 'instruction') {
      installInstruction(item.id, isGlobal);
    } else {
      installSkill(item.id, isGlobal);
    }
  }
}

function buildChoices(agents, instructions, skills, manifest) {
  const choices = [];

  if (agents.length > 0) {
    choices.push(new Separator('Agentes'));
    choices.push(...agents.map(agent => ({
      name: `${agent.id} (${agent.name || agent.id}) - ${agent.description}`,
      value: { type: 'agent', id: agent.id },
      checked: manifest.agents.includes(agent.id)
    })));
  }

  if (instructions.length > 0) {
    choices.push(new Separator('Instrucciones'));
    choices.push(...instructions.map(inst => ({
      name: `${inst.id} (${inst.name}) - ${inst.description}`,
      value: { type: 'instruction', id: inst.id },
      checked: (manifest.instructions || []).includes(inst.id)
    })));
  }

  if (skills.length > 0) {
    choices.push(new Separator('Skills'));
    choices.push(...skills.map(skill => ({
      name: `${skill.id} (${skill.name || skill.id}) - ${skill.description}`,
      value: { type: 'skill', id: skill.id },
      checked: (manifest.skills || []).includes(skill.id)
    })));
  }

  return choices;
}

function installResource(id, isGlobal, forceAgent, forceInstruction, forceSkill) {
  const isAgent = getAvailableAgents().some(a => a.id === id);
  const isInstruction = getAvailableInstructions().some(i => i.id === id);
  const isSkill = getAvailableSkills().some(s => s.id === id);

  if (forceAgent) {
    return installAgent(id, isGlobal);
  }
  if (forceInstruction) {
    return installInstruction(id, isGlobal);
  }
  if (forceSkill) {
    return installSkill(id, isGlobal);
  }

  const matches = [isAgent && 'agente', isInstruction && 'instrucción', isSkill && 'skill'].filter(Boolean);
  if (matches.length > 1) {
    console.error(`Error: "${id}" coincide con ${matches.join(' y ')}. Usa --agent, --instructions o --skill para especificar el tipo.`);
    process.exit(1);
  }
  if (isAgent) {
    return installAgent(id, isGlobal);
  }
  if (isInstruction) {
    return installInstruction(id, isGlobal);
  }
  if (isSkill) {
    return installSkill(id, isGlobal);
  }

  console.error(`Error: no se encontró el recurso "${id}".`);
  process.exit(1);
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

function installInstruction(instructionId, isGlobal) {
  const instruction = loadInstruction(`${instructionId}.instructions.md`);
  if (!instruction) {
    console.error(`Error: no se encontró la instrucción "${instructionId}".`);
    process.exit(1);
  }

  const targetDir = isGlobal ? getGlobalDir() : getWorkspaceDir();
  const targetPath = path.join(targetDir, instruction.fileName);
  const manifestPath = isGlobal ? getGlobalManifestPath() : getWorkspaceManifestPath();

  const manifest = readManifest(manifestPath);
  if (!manifest.instructions) manifest.instructions = [];
  if (manifest.instructions.includes(instruction.id)) {
    console.log(`La instrucción "${instructionId}" ya está instalada. Usa "copilot-agents update-instructions" para refrescarla.`);
    return;
  }

  ensureDir(targetDir);
  fs.copyFileSync(instruction.filePath, targetPath);

  manifest.instructions.push(instruction.id);
  manifest.updatedAt = new Date().toISOString();
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`Instrucción "${instructionId}" instalada ${isGlobal ? 'globalmente' : 'en el workspace'}.`);
}

function installSkill(skillId, isGlobal) {
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
  if (!manifest.skills) manifest.skills = [];
  if (manifest.skills.includes(skill.id)) {
    console.log(`El skill "${skillId}" ya está instalado. Usa "copilot-agents update" para refrescarlo.`);
    return;
  }

  ensureDir(targetRoot);
  fs.cpSync(skill.dirPath, targetDir, { recursive: true, force: true });

  manifest.skills.push(skill.id);
  manifest.updatedAt = new Date().toISOString();
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`Skill "${skillId}" instalado ${isGlobal ? 'globalmente' : 'en el workspace'}.`);
}

function readManifest(manifestPath) {
  if (!fs.existsSync(manifestPath)) return { agents: [], instructions: [], skills: [] };
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    return {
      agents: manifest.agents || [],
      instructions: manifest.instructions || [],
      skills: manifest.skills || []
    };
  } catch (err) {
    return { agents: [], instructions: [], skills: [] };
  }
}

module.exports = { install };
