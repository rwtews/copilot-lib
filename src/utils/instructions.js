const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const INSTRUCTIONS_DIR = path.join(__dirname, '..', '..', 'src', 'data', 'instructions');

function getAvailableInstructions() {
  if (!fs.existsSync(INSTRUCTIONS_DIR)) return [];
  return fs.readdirSync(INSTRUCTIONS_DIR)
    .filter(name => name.endsWith('-instructions.md'))
    .map(fileName => loadInstruction(fileName))
    .filter(Boolean);
}

function loadInstruction(fileName) {
  const filePath = path.join(INSTRUCTIONS_DIR, fileName);
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, 'utf8');
  const id = fileName.replace(/-instructions\.md$/, '');

  const frontmatter = parseFrontmatter(content) || {};

  const titleMatch = content.match(/^#\s+(.+)$/m);
  const name = titleMatch ? titleMatch[1].trim() : id;

  const firstParagraphMatch = content.match(/^#\s+.+\n+([^#\n][^\n]*)/m);
  const description = firstParagraphMatch
    ? firstParagraphMatch[1].trim()
    : name;

  return {
    id,
    fileName,
    filePath,
    name,
    description,
    version: '0.0.0',
    ...frontmatter,
    content
  };
}

function parseFrontmatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  if (!match) return null;
  try {
    return yaml.load(match[1]) || {};
  } catch (err) {
    console.error(`Error parseando frontmatter: ${err.message}`);
    return null;
  }
}

module.exports = {
  getAvailableInstructions,
  loadInstruction
};
