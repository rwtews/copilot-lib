const fs = require('fs');
const path = require('path');

const INSTRUCTIONS_DIR = path.join(__dirname, '..', '..', 'src', 'data', 'instructions');

function getAvailableInstructions() {
  if (!fs.existsSync(INSTRUCTIONS_DIR)) return [];
  return fs.readdirSync(INSTRUCTIONS_DIR)
    .filter(name => name.endsWith('.instructions.md'))
    .map(fileName => loadInstruction(fileName))
    .filter(Boolean);
}

function loadInstruction(fileName) {
  const filePath = path.join(INSTRUCTIONS_DIR, fileName);
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, 'utf8');
  const id = fileName.replace(/\.instructions\.md$/, '');

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
    content
  };
}

module.exports = {
  getAvailableInstructions,
  loadInstruction
};
