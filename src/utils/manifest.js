const fs = require('fs');

const DEFAULT_MANIFEST = {
  agents: {},
  instructions: {},
  skills: {}
};

function readManifest(manifestPath) {
  if (!fs.existsSync(manifestPath)) return structuredClone(DEFAULT_MANIFEST);

  try {
    const raw = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    return normalizeManifest(raw);
  } catch (err) {
    return structuredClone(DEFAULT_MANIFEST);
  }
}

function normalizeManifest(raw) {
  return {
    agents: normalizeSection(raw.agents),
    instructions: normalizeSection(raw.instructions),
    skills: normalizeSection(raw.skills),
    updatedAt: raw.updatedAt
  };
}

function normalizeSection(section) {
  if (!section) return {};
  if (Array.isArray(section)) {
    return section.reduce((acc, id) => {
      acc[id] = { version: '0.0.0' };
      return acc;
    }, {});
  }
  if (typeof section === 'object') {
    return section;
  }
  return {};
}

function writeManifest(manifestPath, manifest) {
  manifest.updatedAt = new Date().toISOString();
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

function getResourceVersion(manifest, type, id) {
  const section = manifest[type];
  if (!section || !section[id]) return '0.0.0';
  return section[id].version || '0.0.0';
}

function setResourceVersion(manifest, type, id, version) {
  if (!manifest[type]) manifest[type] = {};
  manifest[type][id] = { version };
}

function removeResource(manifest, type, id) {
  if (manifest[type]) {
    delete manifest[type][id];
  }
}

function hasResource(manifest, type, id) {
  return manifest[type] && typeof manifest[type][id] === 'object';
}

module.exports = {
  readManifest,
  writeManifest,
  getResourceVersion,
  setResourceVersion,
  removeResource,
  hasResource
};
