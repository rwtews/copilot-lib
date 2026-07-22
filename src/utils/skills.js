const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const SKILLS_DIR = path.join(__dirname, '..', '..', 'src', 'data', 'skills');
const SKILL_FILE = 'SKILL.md';

function getAvailableSkills() {
  if (!fs.existsSync(SKILLS_DIR)) return [];
  return fs.readdirSync(SKILLS_DIR)
    .filter(name => isSkillDir(name))
    .map(dirName => loadSkill(dirName))
    .filter(Boolean);
}

function isSkillDir(name) {
  const dirPath = path.join(SKILLS_DIR, name);
  if (!fs.statSync(dirPath).isDirectory()) return false;
  return fs.existsSync(path.join(dirPath, SKILL_FILE));
}

function loadSkill(dirName) {
  const dirPath = path.join(SKILLS_DIR, dirName);
  const filePath = path.join(dirPath, SKILL_FILE);
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, 'utf8');
  const parsed = parseSkillFile(content);
  if (!parsed) return null;

  return {
    id: dirName,
    dirName,
    dirPath,
    filePath,
    fileName: SKILL_FILE,
    version: '0.0.0',
    ...parsed.frontmatter,
    body: parsed.body
  };
}

function parseSkillFile(content) {
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

function getSkillBody(skill) {
  return skill.body || '';
}

module.exports = {
  getAvailableSkills,
  loadSkill,
  parseSkillFile,
  getSkillBody
};
