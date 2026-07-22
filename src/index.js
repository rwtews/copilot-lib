const { list } = require('./commands/list');
const { install } = require('./commands/install');
const { update } = require('./commands/update');
const { installInstructions } = require('./commands/install-instructions');
const { updateInstructions } = require('./commands/update-instructions');

async function run(args) {
  const command = args[0];
  const rest = args.slice(1);

  switch (command) {
    case 'list':
      list(rest);
      break;
    case 'install':
      await install(rest);
      break;
    case 'install-instructions':
      await installInstructions(rest);
      break;
    case 'update':
      update(rest);
      break;
    case 'update-instructions':
      updateInstructions(rest);
      break;
    case 'help':
    case '--help':
    case '-h':
    default:
      printHelp();
      break;
  }
}

function printHelp() {
  const version = require('../package.json').version;
  console.log(`copilot-agents v${version}

Uso:
  copilot-agents list                       Lista los agentes disponibles
  copilot-agents list --instructions        Lista las instrucciones disponibles
  copilot-agents list --installed           Lista agentes e instrucciones instalados
  copilot-agents install                    Selecciona e instala agentes interactivamente
  copilot-agents install <id>               Instala un agente en el workspace
  copilot-agents install <id> --global      Instala un agente globalmente
  copilot-agents install-instructions       Selecciona e instala instrucciones interactivamente
  copilot-agents install-instructions <id>  Instala una instrucción en el workspace
  copilot-agents install-instructions <id> --global  Instala una instrucción globalmente
  copilot-agents update                     Actualiza los agentes del workspace
  copilot-agents update --global            Actualiza los agentes globales
  copilot-agents update-instructions        Actualiza las instrucciones del workspace
  copilot-agents update-instructions --global  Actualiza las instrucciones globales
  copilot-agents help                       Muestra esta ayuda

Los agentes se instalan en .github/agents/ y las instrucciones en .github/,
siguiendo el formato oficial de GitHub Copilot.
`);
}

module.exports = { run };
