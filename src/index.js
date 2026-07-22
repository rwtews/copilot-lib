const { list } = require('./commands/list');
const { install } = require('./commands/install');
const { update } = require('./commands/update');

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
    case 'update':
      update(rest);
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
  copilot-agents list                         Lista agentes, instrucciones y skills disponibles
  copilot-agents list --agent                 Lista solo los agentes disponibles
  copilot-agents list --instructions          Lista solo las instrucciones disponibles
  copilot-agents list --skills                Lista solo los skills disponibles
  copilot-agents list --installed             Lista agentes, instrucciones y skills instalados
  copilot-agents install                      Selecciona e instala agentes, instrucciones y skills interactivamente
  copilot-agents install <id>                 Instala un recurso en el workspace
  copilot-agents install <id> --global        Instala un recurso globalmente
  copilot-agents install <id> --agent         Instala un agente directamente
  copilot-agents install <id> --instructions  Instala una instrucción directamente
  copilot-agents install <id> --skill         Instala un skill directamente
  copilot-agents install <id> --force         Reinstala aunque sea la misma versión
  copilot-agents update                       Actualiza agentes, instrucciones y skills del workspace
  copilot-agents update --global              Actualiza agentes, instrucciones y skills globales
  copilot-agents update --agent               Actualiza solo agentes
  copilot-agents update --instructions        Actualiza solo instrucciones
  copilot-agents update --skill               Actualiza solo skills
  copilot-agents update --force               Actualiza aunque sea la misma versión
  copilot-agents help                         Muestra esta ayuda

En el workspace, los agentes se instalan en .github/agents/, las instrucciones en .github/ y los skills en .github/skills/.
Globalmente, los agentes se instalan en ~/.copilot/agents/, las instrucciones en ~/.copilot/ y los skills en ~/.copilot/skills/.
Todos siguen el formato oficial de GitHub Copilot.
`);
}

module.exports = { run };
