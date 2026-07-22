# copilot-agents

Repositorio personal para almacenar, versionar y compartir agentes e instrucciones personalizadas para GitHub Copilot.

Incluye un CLI en Node.js para instalar y actualizar tanto agentes como instrucciones en el workspace actual o de forma global, siguiendo el formato oficial de GitHub Copilot.

## Requisitos

- Node.js >= 18
- GitHub Copilot (VS Code, Visual Studio, JetBrains, etc.)

## Instalación del CLI

Clona el repositorio y enlázalo localmente:

```bash
git clone https://github.com/tu-usuario/copilot-agents.git
cd copilot-agents
npm install
npm link
```

Si publicas el paquete en npm, puedes usarlo directamente:

```bash
npx copilot-agents list
```

## Uso

### Listar recursos disponibles

```bash
# Agentes
copilot-agents list

# Instrucciones
copilot-agents list --instructions

# Instalados (agentes e instrucciones)
copilot-agents list --installed
```

### Instalar agentes

#### Modo interactivo

```bash
copilot-agents install
```

Usa las flechas para moverte, la barra espaciadora para marcar/desmarcar y Enter para confirmar.

#### Modo directo

```bash
copilot-agents install react-expert
copilot-agents install react-expert --global
```

Los agentes se copian a `.github/agents/` (workspace) o `~/.github/agents/` (global).

### Instalar instrucciones

#### Modo interactivo

```bash
copilot-agents install-instructions
```

#### Modo directo

```bash
copilot-agents install-instructions coding
copilot-agents install-instructions coding --global
```

Las instrucciones se copian a `.github/` (workspace) o `~/.github/` (global).

### Actualizar

```bash
# Agentes
copilot-agents update
copilot-agents update --global

# Instrucciones
copilot-agents update-instructions
copilot-agents update-instructions --global
```

Los comandos `update` sincronizan los archivos a partir del manifiesto local (`.copilot-agents.json` o `~/.copilot-agents.json`). Si eliminas un recurso del manifiesto, `update` también lo borra de la carpeta destino.

## Formato de un agente

Cada agente es un archivo Markdown en `src/data/agents/<nombre>.agent.md` con YAML frontmatter:

```markdown
---
name: React Expert
description: Agente especializado en componentes React con TypeScript.
---

Cuando generes código React, sigue estas reglas:

- Usa componentes funcionales y hooks.
- Escribe TypeScript con tipos explícitos.
```

Propiedades del frontmatter:

| Propiedad     | Requerida | Descripción                                       |
|---------------|-----------|---------------------------------------------------|
| `name`        | No        | Nombre visible del agente.                        |
| `description` | Sí        | Descripción que aparece al listar.                |
| `model`       | No        | Modelo de IA a usar.                              |
| `tools`       | No        | Array de herramientas disponibles para el agente. |

## Formato de una instrucción

Cada instrucción es un archivo Markdown en `src/data/instructions/<nombre>.instructions.md`:

```markdown
# Coding Standards

Cuando escribas código, sigue estas reglas:

- Usa nombres descriptivos.
- Escribe tests para cada función pública.
```

> Nota: GitHub Copilot reconoce los archivos de instrucciones con la extensión `.instructions.md` (con punto, no guion). El CLI usa ese formato para garantizar la compatibilidad.

## Crear un nuevo recurso

### Nuevo agente

1. Crea `src/data/agents/my-agent.agent.md` con frontmatter e instrucciones.
2. Prueba:

```bash
copilot-agents list
copilot-agents install my-agent
```

### Nueva instrucción

1. Crea `src/data/instructions/my-rules.instructions.md` con las reglas en Markdown.
2. Prueba:

```bash
copilot-agents list --instructions
copilot-agents install-instructions my-rules
```

## Estructura del repositorio

```
copilot-agents/
├── bin/                             # Entry point del CLI
│   └── copilot-agents.js
├── src/                             # Código y datos del CLI
│   ├── commands/
│   ├── data/                        # Agentes e instrucciones
│   │   ├── agents/
│   │   │   ├── react-expert.agent.md
│   │   │   └── python-expert.agent.md
│   │   └── instructions/
│   │       ├── coding.instructions.md
│   │       └── review.instructions.md
│   ├── utils/
│   └── index.js
├── package.json
└── README.md
```

## Cómo compartir o instalar en otra máquina

Para compartir tus agentes e instrucciones solo necesitas compartir este repositorio. En otra máquina se clona y se usa el mismo CLI.

Si publicas el paquete en npm (o en un registry privado), los comandos se simplifican a:

```bash
npx copilot-agents install
npx copilot-agents install-instructions
npx copilot-agents update
npx copilot-agents update-instructions
```

## Referencias

- [Use custom agents in GitHub Copilot - Visual Studio](https://learn.microsoft.com/en-us/visualstudio/ide/copilot-specialized-agents)
- [About custom agents - GitHub Docs](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-custom-agents)
- [Adding repository custom instructions for GitHub Copilot](https://docs.github.com/en/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot)

## Contribución

Este es un repositorio personal, pero si quieres añadir recursos o mejorar el CLI, abre un issue o pull request.

## Licencia

MIT
