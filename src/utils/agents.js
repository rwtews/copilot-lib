const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const AGENTS_DIR = path.join(__dirname, '..', '..', 'src', 'data', 'agents');

function getAvailableAgents() {
  if (!fs.existsSync(AGENTS_DIR)) return [];
  return fs.readdirSync(AGENTS_DIR)
    .filter(name => name.endsWith('.agent.md'))
    .map(fileName => loadAgent(fileName))
    .filter(Boolean);
}

function loadAgent(fileName) {
  const filePath = path.join(AGENTS_DIR, fileName);
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, 'utf8');
  const parsed = parseAgentFile(content);
  if (!parsed) return null;

  const id = fileName.replace(/\.agent\.md$/, '');

  return {
    id,
    fileName,
    filePath,
    version: '0.0.0',
    ...parsed.frontmatter,
    body: parsed.body
  };
}

function parseAgentFile(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) return null;

  try {
    const frontmatter = yaml.load(match[1]) || {};
    const body = match[2].trim();
    return { frontmatter, body };
  } catch (err) {
    console.error(`Error parseando frontmatter: ${err.message}`);
    return null;
  }
}

function getAgentBody(agent) {
  return agent.body || '';
}

module.exports = {
  getAvailableAgents,
  loadAgent,
  parseAgentFile,
  getAgentBody
};
