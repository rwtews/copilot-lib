# copilot-agents

Repositorio personal para almacenar, versionar y compartir agentes, instrucciones y skills personalizados para GitHub Copilot.

Incluye un CLI en Node.js para instalar y actualizar agentes, instrucciones y skills en el workspace actual o de forma global, siguiendo el formato oficial de GitHub Copilot.

## Requisitos

- Node.js >= 18
- GitHub Copilot (VS Code, Visual Studio, JetBrains, etc.)

## Instalación del CLI

Clona el repositorio y enlázalo localmente:

```bash
git clone https://github.com/rwtews/copilot-lib.git
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
# Todos los recursos
copilot-agents list

# Solo agentes
copilot-agents list --agent

# Solo instrucciones
copilot-agents list --instructions

# Solo skills
copilot-agents list --skills

# Instalados (agentes, instrucciones y skills)
copilot-agents list --installed
```

### Instalar recursos

#### Modo interactivo

```bash
copilot-agents install
```

Usa las flechas para moverte, la barra espaciadora para marcar/desmarcar y Enter para confirmar. Los recursos aparecen agrupados en **Agentes**, **Instrucciones** y **Skills**.

#### Modo directo

```bash
# Agentes
copilot-agents install react-expert
copilot-agents install react-expert --global
copilot-agents install react-expert --agent
copilot-agents install react-expert --agent --global

# Instrucciones
copilot-agents install coding --instructions
copilot-agents install coding --instructions --global

# Skills
copilot-agents install code-reviewer --skill
copilot-agents install code-reviewer --skill --global
```

Los agentes se copian a `.github/agents/` (workspace) o `~/.copilot/agents/` (global).
Las instrucciones se copian a `.github/` (workspace) o `~/.copilot/` (global).
Los skills se copian a `.github/skills/` (workspace) o `~/.copilot/skills/` (global).

### Actualizar

```bash
# Todo (agentes, instrucciones y skills)
copilot-agents update
copilot-agents update --global

# Solo agentes
copilot-agents update --agent

# Solo instrucciones
copilot-agents update --instructions

# Solo skills
copilot-agents update --skill
```

El comando `update` sincroniza los archivos a partir del manifiesto local (`.copilot-agents.json` o `~/.copilot-agents.json`). Si eliminas un recurso del manifiesto, `update` también lo borra de la carpeta destino.

`update` compara la versión indicada en el frontmatter del recurso (`version`) con la versión guardada en el manifiesto. Si coinciden, el recurso se omite; si difieren, se copia la nueva versión y se actualiza el manifiesto. Para forzar la copia aunque las versiones sean iguales, usa `--force`.

```bash
copilot-agents update --force
copilot-agents update --agent --force
```

El manifiesto guarda la versión de cada recurso instalado:

```json
{
  "agents": {
    "api-architect": { "version": "1.0.0" }
  },
  "instructions": {
    "copilot": { "version": "1.0.0" }
  },
  "skills": {
    "code-reviewer": { "version": "1.0.0" }
  },
  "updatedAt": "2026-07-22T12:00:00.000Z"
}
```

## Formato de un agente

Cada agente es un archivo Markdown en `src/data/agents/<nombre>.agent.md` con YAML frontmatter:

```markdown
---
name: React Expert
description: Agente especializado en componentes React con TypeScript.
version: 1.0.0
---

Cuando generes código React, sigue estas reglas:

- Usa componentes funcionales y hooks.
- Escribe TypeScript con tipos explícitos.
```

Propiedades del frontmatter:

| Propiedad     | Requerida | Descripción                                                           |
|---------------|-----------|-----------------------------------------------------------------------|
| `name`        | Sí        | Nombre visible del agente.                                            |
| `description` | Sí        | Descripción que aparece al listar.                                    |
| `version`     | Sí        | Versión del agente. Se usa para decidir si `update` debe refrescarlo. |
| `model`       | No        | Modelo de IA a usar.                                                  |
| `tools`       | No        | Array de herramientas disponibles para el agente.                     |

## Formato de una instrucción

Cada instrucción es un archivo Markdown en `src/data/instructions/<nombre>-instructions.md`:

```markdown
---
version: 1.0.0
---

# Coding Standards

Cuando escribas código, sigue estas reglas:

- Usa nombres descriptivos.
- Escribe tests para cada función pública.
```

> Nota: GitHub Copilot reconoce los archivos de instrucciones con el sufijo `-instructions.md`. El CLI usa ese formato para garantizar la compatibilidad.

## Formato de un skill

Cada skill es un directorio en `src/data/skills/<nombre>/` que contiene al menos un archivo `SKILL.md` con YAML frontmatter:

```markdown
---
name: Code Reviewer
description: Revisa código buscando problemas de calidad, mantenibilidad y seguridad.
version: 1.0.0
---

Eres un revisor de código experto. Cuando se te pida revisar código:

1. Identifica bugs, code smells y problemas de seguridad.
2. Sugiere mejoras concretas y ejemplos de código cuando sea posible.
```

Puedes añadir archivos adicionales en el mismo directorio (ejemplos, scripts, referencias) y se copiarán junto con el skill.

## Crear un nuevo recurso

### Nuevo agente

1. Crea `src/data/agents/my-agent.agent.md` con frontmatter e instrucciones.
2. Prueba:

```bash
copilot-agents list
copilot-agents install my-agent
```

### Nueva instrucción

1. Crea `src/data/instructions/my-rules-instructions.md` con las reglas en Markdown.
2. Prueba:

```bash
copilot-agents list --instructions
copilot-agents install my-rules --instructions
```

### Nuevo skill

1. Crea un directorio `src/data/skills/my-skill/` con un archivo `SKILL.md` que incluya YAML frontmatter (`name`, `description`) y las instrucciones en Markdown.
2. Opcionalmente añade archivos de soporte (ejemplos, scripts, referencias) dentro del mismo directorio.
3. Prueba:

```bash
copilot-agents list --skills
copilot-agents install my-skill --skill
```

## Estructura del repositorio

```
copilot-agents/
├── bin/                             # Entry point del CLI
│   └── copilot-agents.js
├── src/                             # Código y datos del CLI
│   ├── commands/
│   ├── data/                        # Agentes, instrucciones y skills
│   │   ├── agents/
│   │   │   ├── react-expert.agent.md
│   │   │   └── python-expert.agent.md
│   │   ├── instructions/
│   │   │   ├── coding-instructions.md
│   │   │   └── review-instructions.md
│   │   └── skills/
│   │       └── code-reviewer/
│   │           └── SKILL.md
│   ├── utils/
│   └── index.js
├── package.json
└── README.md
```

## Cómo compartir o instalar en otra máquina

Para compartir tus agentes, instrucciones y skills solo necesitas compartir este repositorio. En otra máquina se clona y se usa el mismo CLI.

Si publicas el paquete en npm (o en un registry privado), los comandos se simplifican a:

```bash
npx copilot-agents install
npx copilot-agents update
```

## Referencias

- [Use custom agents in GitHub Copilot - Visual Studio](https://learn.microsoft.com/en-us/visualstudio/ide/copilot-specialized-agents)
- [About custom agents - GitHub Docs](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-custom-agents)
- [Adding repository custom instructions for GitHub Copilot](https://docs.github.com/en/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot)
- [Use Agent Skills with GitHub Copilot - Visual Studio](https://learn.microsoft.com/en-us/visualstudio/ide/copilot-agent-skills)
- [Adding agent skills for GitHub Copilot CLI - GitHub Docs](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills)

## Contribución

Este es un repositorio personal, pero si quieres añadir recursos o mejorar el CLI, abre un issue o pull request.

## Licencia

MIT
