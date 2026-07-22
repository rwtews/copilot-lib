const fs = require('fs');
const path = require('path');
const { loadInstruction } = require('../utils/instructions');
const {
  getWorkspaceDir,
  getWorkspaceManifestPath,
  getGlobalDir,
  getGlobalManifestPath,
  ensureDir
} = require('../utils/paths');

function updateInstructions(args) {
  const isGlobal = args.includes('--global');

  if (!isGlobal) {
    updateTarget(getWorkspaceManifestPath(), getWorkspaceDir(), 'workspace');
  }

  updateTarget(getGlobalManifestPath(), getGlobalDir(), 'global');
}

function updateTarget(manifestPath, targetDir, label) {
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

module.exports = { updateInstructions };
