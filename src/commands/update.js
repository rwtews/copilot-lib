const fs = require('fs');
const path = require('path');
const { loadAgent, getAgentBody } = require('../utils/agents');
const { loadInstruction } = require('../utils/instructions');
const { loadSkill, getSkillBody } = require('../utils/skills');
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

function update(args) {
  const isGlobal = args.includes('--global');
  const force = args.includes('--force');
  const agentsOnly = args.includes('--agent') || args.includes('--agents');
  const instructionsOnly = args.includes('--instructions') || args.includes('--instruction');
  const skillsOnly = args.includes('--skill') || args.includes('--skills');

  if (!isGlobal) {
    if (!instructionsOnly && !skillsOnly) {
      updateAgents(getWorkspaceManifestPath(), getWorkspaceAgentsDir(), 'workspace', force);
    }
    if (!agentsOnly && !skillsOnly) {
      updateInstructions(getWorkspaceManifestPath(), getWorkspaceDir(), 'workspace', force);
    }
    if (!agentsOnly && !instructionsOnly) {
      updateSkills(getWorkspaceManifestPath(), getWorkspaceSkillsDir(), 'workspace', force);
    }
  }

  if (!instructionsOnly && !skillsOnly) {
    updateAgents(getGlobalManifestPath(), getGlobalAgentsDir(), 'global', force);
  }
  if (!agentsOnly && !skillsOnly) {
    updateInstructions(getGlobalManifestPath(), getGlobalDir(), 'global', force);
  }
  if (!agentsOnly && !instructionsOnly) {
    updateSkills(getGlobalManifestPath(), getGlobalSkillsDir(), 'global', force);
  }
}

function updateAgents(manifestPath, targetDir, label, force) {
  const manifest = readManifest(manifestPath);
  const installedIds = Object.keys(manifest.agents || {});

  if (installedIds.length === 0) {
    console.log(`No hay agentes instalados en ${label}.`);
    return;
  }

  ensureDir(targetDir);

  const keptAgents = [];

  for (const agentId of installedIds) {
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

    const installedVersion = getResourceVersion(manifest, 'agents', agent.id);
    if (installedVersion !== agent.version || force) {
      const targetPath = path.join(targetDir, agent.fileName);
      fs.copyFileSync(agent.filePath, targetPath);
      setResourceVersion(manifest, 'agents', agent.id, agent.version);
      console.log(`Agente "${agentId}" actualizado de v${installedVersion} a v${agent.version} en ${label}.`);
    } else {
      console.log(`Agente "${agentId}" ya está en la versión más reciente (${agent.version}) en ${label}.`);
    }
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

  manifest.agents = keptAgents.reduce((acc, id) => {
    acc[id] = { version: getResourceVersion(manifest, 'agents', id) };
    return acc;
  }, {});

  writeManifest(manifestPath, manifest);

  console.log(`Actualizado(s) ${keptAgents.length} agente(s) en ${label}.`);
}

function updateInstructions(manifestPath, targetDir, label, force) {
  const manifest = readManifest(manifestPath);
  const installedIds = Object.keys(manifest.instructions || {});

  if (installedIds.length === 0) {
    console.log(`No hay instrucciones instaladas en ${label}.`);
    return;
  }

  ensureDir(targetDir);

  const keptInstructions = [];

  for (const instructionId of installedIds) {
    const instruction = loadInstruction(`${instructionId}-instructions.md`);
    if (!instruction) {
      console.warn(`Advertencia: la instrucción "${instructionId}" ya no existe en el repositorio. Se omitirá.`);
      continue;
    }

    const installedVersion = getResourceVersion(manifest, 'instructions', instruction.id);
    if (installedVersion !== instruction.version || force) {
      const targetPath = path.join(targetDir, instruction.fileName);
      fs.copyFileSync(instruction.filePath, targetPath);
      setResourceVersion(manifest, 'instructions', instruction.id, instruction.version);
      console.log(`Instrucción "${instructionId}" actualizada de v${installedVersion} a v${instruction.version} en ${label}.`);
    } else {
      console.log(`Instrucción "${instructionId}" ya está en la versión más reciente (${instruction.version}) en ${label}.`);
    }
    keptInstructions.push(instruction.id);
  }

  if (fs.existsSync(targetDir)) {
    const installedFiles = fs.readdirSync(targetDir).filter(name => name.endsWith('-instructions.md'));
    const validFiles = new Set(keptInstructions.map(id => `${id}-instructions.md`));
    for (const file of installedFiles) {
      if (!validFiles.has(file)) {
        fs.unlinkSync(path.join(targetDir, file));
      }
    }
  }

  manifest.instructions = keptInstructions.reduce((acc, id) => {
    acc[id] = { version: getResourceVersion(manifest, 'instructions', id) };
    return acc;
  }, {});

  writeManifest(manifestPath, manifest);

  console.log(`Actualizada(s) ${keptInstructions.length} instrucción(es) en ${label}.`);
}

function updateSkills(manifestPath, targetDir, label, force) {
  const manifest = readManifest(manifestPath);
  const installedIds = Object.keys(manifest.skills || {});

  if (installedIds.length === 0) {
    console.log(`No hay skills instalados en ${label}.`);
    return;
  }

  ensureDir(targetDir);

  const keptSkills = [];

  for (const skillId of installedIds) {
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

    const installedVersion = getResourceVersion(manifest, 'skills', skill.id);
    const targetPath = path.join(targetDir, skill.id);

    if (installedVersion !== skill.version || force) {
      fs.rmSync(targetPath, { recursive: true, force: true });
      fs.cpSync(skill.dirPath, targetPath, { recursive: true, force: true });
      setResourceVersion(manifest, 'skills', skill.id, skill.version);
      console.log(`Skill "${skillId}" actualizado de v${installedVersion} a v${skill.version} en ${label}.`);
    } else {
      console.log(`Skill "${skillId}" ya está en la versión más reciente (${skill.version}) en ${label}.`);
    }
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

  manifest.skills = keptSkills.reduce((acc, id) => {
    acc[id] = { version: getResourceVersion(manifest, 'skills', id) };
    return acc;
  }, {});

  writeManifest(manifestPath, manifest);

  console.log(`Actualizado(s) ${keptSkills.length} skill(s) en ${label}.`);
}

module.exports = { update };
