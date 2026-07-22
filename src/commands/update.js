const fs = require('fs');
const path = require('path');
const { loadAgent, getAgentBody } = require('../utils/agents');
const { loadInstruction } = require('../utils/instructions');
const { loadSkill, getSkillBody } = require('../utils/skills');
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

function update(args) {
  const isGlobal = args.includes('--global');
  const agentsOnly = args.includes('--agent') || args.includes('--agents');
  const instructionsOnly = args.includes('--instructions') || args.includes('--instruction');
  const skillsOnly = args.includes('--skill') || args.includes('--skills');

  if (!isGlobal) {
    if (!instructionsOnly && !skillsOnly) {
      updateAgents(getWorkspaceManifestPath(), getWorkspaceAgentsDir(), 'workspace');
    }
    if (!agentsOnly && !skillsOnly) {
      updateInstructions(getWorkspaceManifestPath(), getWorkspaceDir(), 'workspace');
    }
    if (!agentsOnly && !instructionsOnly) {
      updateSkills(getWorkspaceManifestPath(), getWorkspaceSkillsDir(), 'workspace');
    }
  }

  if (!instructionsOnly && !skillsOnly) {
    updateAgents(getGlobalManifestPath(), getGlobalAgentsDir(), 'global');
  }
  if (!agentsOnly && !skillsOnly) {
    updateInstructions(getGlobalManifestPath(), getGlobalDir(), 'global');
  }
  if (!agentsOnly && !instructionsOnly) {
    updateSkills(getGlobalManifestPath(), getGlobalSkillsDir(), 'global');
  }
}

function updateAgents(manifestPath, targetDir, label) {
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

function updateInstructions(manifestPath, targetDir, label) {
  if (!fs.existsSync(manifestPath)) {
    console.log(`No hay instrucciones instaladas en ${label}.`);
    return;
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (err) {
    console.error(`Error leyendo manifiesto de ${label}: ${err.message}`);
    return;
  }

  if (!manifest.instructions || manifest.instructions.length === 0) {
    console.log(`No hay instrucciones instaladas en ${label}.`);
    return;
  }

  ensureDir(targetDir);

  const keptInstructions = [];

  for (const instructionId of manifest.instructions) {
    const instruction = loadInstruction(`${instructionId}.instructions.md`);
    if (!instruction) {
      console.warn(`Advertencia: la instrucción "${instructionId}" ya no existe en el repositorio. Se omitirá.`);
      continue;
    }

    const targetPath = path.join(targetDir, instruction.fileName);
    fs.copyFileSync(instruction.filePath, targetPath);
    keptInstructions.push(instruction.id);
  }

  if (fs.existsSync(targetDir)) {
    const installedFiles = fs.readdirSync(targetDir).filter(name => name.endsWith('.instructions.md'));
    const validFiles = new Set(keptInstructions.map(id => `${id}.instructions.md`));
    for (const file of installedFiles) {
      if (!validFiles.has(file)) {
        fs.unlinkSync(path.join(targetDir, file));
      }
    }
  }

  manifest.instructions = keptInstructions;
  manifest.updatedAt = new Date().toISOString();
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`Actualizada(s) ${keptInstructions.length} instrucción(es) en ${label}.`);
}

function updateSkills(manifestPath, targetDir, label) {
  if (!fs.existsSync(manifestPath)) {
    console.log(`No hay skills instalados en ${label}.`);
    return;
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (err) {
    console.error(`Error leyendo manifiesto de ${label}: ${err.message}`);
    return;
  }

  if (!manifest.skills || manifest.skills.length === 0) {
    console.log(`No hay skills instalados en ${label}.`);
    return;
  }

  ensureDir(targetDir);

  const keptSkills = [];

  for (const skillId of manifest.skills) {
    const skill = loadSkill(skillId);
    if (!skill) {
      console.warn(`Advertencia: el skill "${skillId}" ya no existe en el repositorio. Se omitirá.`);
      continue;
    }

    const body = getSkillBody(skill);
    if (!body.trim()) {
      console.warn(`Advertencia: el skill "${skillId}" no tiene instrucciones. Se omitirá.`);
      continue;
    }

    const targetPath = path.join(targetDir, skill.id);
    fs.rmSync(targetPath, { recursive: true, force: true });
    fs.cpSync(skill.dirPath, targetPath, { recursive: true, force: true });
    keptSkills.push(skill.id);
  }

  if (fs.existsSync(targetDir)) {
    const installedDirs = fs.readdirSync(targetDir)
      .filter(name => fs.statSync(path.join(targetDir, name)).isDirectory());
    const validDirs = new Set(keptSkills);
    for (const dir of installedDirs) {
      if (!validDirs.has(dir)) {
        fs.rmSync(path.join(targetDir, dir), { recursive: true, force: true });
      }
    }
  }

  manifest.skills = keptSkills;
  manifest.updatedAt = new Date().toISOString();
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`Actualizado(s) ${keptSkills.length} skill(s) en ${label}.`);
}

module.exports = { update };
