/**
 * Verifies the versioned agent-skill harness (`.harness/manifest.json`):
 *  - every skill vendored under .github/skills/ has `name` / `description` / `version` in its
 *    SKILL.md frontmatter
 *  - each skill's content hash matches what's recorded in the manifest — this is what turns an
 *    in-place edit to a skill that didn't bump its version into a CI failure, rather than a
 *    silent drift between what the manifest claims and what agents actually read
 *  - .claude/skills/ is exactly what scripts/sync-claude-skills.sh would produce right now
 *
 * Run via `npm run harness:check`. Reports every failure found, not just the first.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const skillsDir = path.join(repoRoot, '.github', 'skills');
const manifestPath = path.join(repoRoot, '.harness', 'manifest.json');

interface ManifestEntry {
  name: string;
  version: string;
  source: string;
  sha256: string;
}

interface Manifest {
  skills: ManifestEntry[];
}

function sha256(input: Buffer | string): string {
  return createHash('sha256').update(input).digest('hex');
}

/** Every file under `dir`, as absolute paths, in a stable sorted order (depth-first). */
function listFiles(dir: string): string[] {
  const out: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

/** A deterministic hash over every file's (repo-relative path, content) under `dir`. */
function hashSkillDir(dir: string): string {
  const lines = listFiles(dir).map((file) => {
    const relative = path.relative(repoRoot, file);
    return `${sha256(readFileSync(file))}  ${relative}`;
  });
  return sha256(lines.join('\n'));
}

function parseFrontmatterField(skillMd: string, field: string): string | undefined {
  const match = skillMd.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'));
  return match?.[1]?.trim();
}

const failures: string[] = [];

// .claude/skills/ must be exactly what the sync script produces right now — re-run it (it's
// idempotent) and check for a resulting diff, rather than re-implementing its symlink logic here.
execFileSync(path.join(repoRoot, 'scripts', 'sync-claude-skills.sh'), { stdio: 'ignore' });
const gitStatus = execFileSync('git', ['status', '--porcelain', '.claude/skills'], {
  cwd: repoRoot,
  encoding: 'utf8',
});
if (gitStatus.trim() !== '') {
  failures.push(
    '.claude/skills/ is out of sync with .github/skills/ — run scripts/sync-claude-skills.sh ' +
      `and commit the result:\n${gitStatus}`,
  );
}

const manifest: Manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Manifest;
const manifestByName = new Map(manifest.skills.map((entry) => [entry.name, entry]));

const skillNames = readdirSync(skillsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

for (const name of skillNames) {
  const skillDir = path.join(skillsDir, name);
  const skillMdPath = path.join(skillDir, 'SKILL.md');
  if (!existsSync(skillMdPath)) {
    failures.push(`${name}: no SKILL.md`);
    continue;
  }
  const skillMd = readFileSync(skillMdPath, 'utf8');

  for (const field of ['name', 'description', 'version']) {
    if (!parseFrontmatterField(skillMd, field)) {
      failures.push(`${name}/SKILL.md: missing required frontmatter field '${field}'`);
    }
  }

  const entry = manifestByName.get(name);
  if (!entry) {
    failures.push(`${name}: no .harness/manifest.json entry — add one`);
    continue;
  }

  const declaredVersion = parseFrontmatterField(skillMd, 'version');
  if (declaredVersion && declaredVersion !== entry.version) {
    failures.push(
      `${name}: SKILL.md declares version ${declaredVersion} but .harness/manifest.json ` +
        `records ${entry.version} — keep them in sync.`,
    );
  }

  const actualHash = hashSkillDir(skillDir);
  if (entry.sha256 !== actualHash) {
    failures.push(
      `${name}: changed on disk (sha256 ${actualHash}) but .harness/manifest.json still ` +
        `records ${entry.sha256} for version ${entry.version} — bump the version in SKILL.md ` +
        `and update the checksum in .harness/manifest.json.`,
    );
  }
}

for (const entry of manifest.skills) {
  if (!skillNames.includes(entry.name)) {
    failures.push(
      `.harness/manifest.json references '${entry.name}', which no longer exists under ` +
        `.github/skills/ — remove its entry.`,
    );
  }
}

if (failures.length > 0) {
  console.error('Harness check failed:\n');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Harness check passed (${skillNames.length} skill(s) verified).`);
}
