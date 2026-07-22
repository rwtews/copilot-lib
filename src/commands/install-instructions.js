const fs = require('fs');
const path = require('path');
const checkbox = require('@inquirer/checkbox').default;
const { getAvailableInstructions, loadInstruction } = require('../utils/instructions');
const {
  getWorkspaceDir,
  getWorkspaceManifestPath,
  getGlobalDir,
  getGlobalManifestPath,
  ensureDir
} = require('../utils/paths');

async function installInstructions(args) {
  const isGlobal = args.includes('--global');
  const instructionId = args.find(arg => !arg.startsWith('--'));

  if (instructionId) {
    return installInstruction(instructionId, isGlobal);
  }

  const instructions = getAvailableInstructions();
  if (instructions.length === 0) {
    console.log('No hay instrucciones disponibles en instructions/.');
    return;
  }

  if (!process.stdin.isTTY) {
    console.log('Entorno no interactivo. Usa:');
    console.log(`  copilot-agents install-instructions <id>${isGlobal ? ' --global' : ''}`);
    console.log('\nInstrucciones disponibles:');
    instructions.forEach(inst => console.log(`  - ${inst.id}`));
    return;
  }

  const manifestPath = isGlobal ? getGlobalManifestPath() : getWorkspaceManifestPath();
  const manifest = readManifest(manifestPath);

  const choices = instructions.map(inst => ({
    name: `${inst.id} (${inst.name})`,
    value: inst.id,
    checked: manifest.instructions?.includes(inst.id)
  }));

  let selected;
  try {
    selected = await checkbox({
      message: isGlobal
        ? 'Selecciona las instrucciones a instalar globalmente:'
        : 'Selecciona las instrucciones a instalar en el workspace:',
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
    console.log('No se seleccionó ninguna instrucción.');
    return;
  }

  for (const id of selected) {
    installInstruction(id, isGlobal);
  }
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

function readManifest(manifestPath) {
  if (!fs.existsSync(manifestPath)) return { agents: [], instructions: [] };
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (err) {
    return { agents: [], instructions: [] };
  }
}

module.exports = { installInstructions };
