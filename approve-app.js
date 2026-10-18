'use strict';
/* Reads an approved app-submission issue (ISSUE_BODY) and writes <category>/<id>.json.
   Every value is validated here, because the issue text comes from the public.
   On a problem it writes a message to RESULT_FILE and exits with code 1. */
const fs = require('fs');

const CATEGORIES = ['app', 'tool', 'game'];
const PLATFORMS = ['Android', 'iOS', 'Desktop'];
const CONFIRMATIONS = 4;
const LABELS = [
  'App Name', 'Category', 'App ID', 'Live App URL', 'Source Code URL', 'License',
  'Developer or Team Name', 'Tagline', 'Version', 'Supported Platforms', 'Icon URL',
  'Website', 'Tags', 'Search Keywords', 'Reviewed Commit or Release',
  'Short Description', 'Full Description', 'Key Features', 'Confirmations',
];

const body = (process.env.ISSUE_BODY || '').replace(/\r/g, '');
let issueLabels = [];
try { issueLabels = JSON.parse(process.env.ISSUE_LABELS || '[]'); } catch (_) {}

/* 1) split the issue into sections (only known headings, first one wins) */
const sections = {};
let current = null;
for (const line of body.split('\n')) {
  const m = /^### (.+?)\s*$/.exec(line);
  if (m && LABELS.includes(m[1]) && !(m[1] in sections)) {
    current = m[1];
    sections[current] = [];
    continue;
  }
  if (current) sections[current].push(line);
}
const get = (label) => {
  const v = (sections[label] || []).join('\n').trim();
  return v === '_No response_' ? '' : v;
};

/* 2) validators */
const errors = [];
const stripCtl = (s) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');

function text(label, { required = false, max = 100, multiline = false } = {}) {
  let v = stripCtl(get(label));
  v = multiline ? v.replace(/\n{3,}/g, '\n\n').trim() : v.replace(/\s+/g, ' ').trim();
  if (!v) {
    if (required) errors.push(`**${label}** is required.`);
    return '';
  }
  if (v.length > max) {
    errors.push(`**${label}** is too long (${v.length} characters, maximum ${max}).`);
    return '';
  }
  return v;
}

function httpsUrl(label, { required = false, image = false } = {}) {
  const v = stripCtl(get(label)).trim();
  if (!v) {
    if (required) errors.push(`**${label}** is required.`);
    return '';
  }
  if (/[\s"'<>`\\]/.test(v)) { errors.push(`**${label}** contains characters that are not allowed.`); return ''; }
  let u;
  try { u = new URL(v); } catch (_) { errors.push(`**${label}** is not a valid link.`); return ''; }
  if (u.protocol !== 'https:') { errors.push(`**${label}** must start with https://`); return ''; }
  if (u.username || u.password) { errors.push(`**${label}** must not contain a user name or password.`); return ''; }
  if (!u.hostname.includes('.')) { errors.push(`**${label}** must be a public web address.`); return ''; }
  if (v.length > 300) { errors.push(`**${label}** is too long.`); return ''; }
  if (image && !/\.(png|jpe?g|webp|svg|gif)$/i.test(u.pathname)) {
    errors.push(`**${label}** must be a direct link to an image (png, jpg, webp, svg or gif).`);
    return '';
  }
  return u.href;
}

function list(label, { max, itemMax }) {
  const raw = stripCtl(get(label));
  const items = [...new Set(raw.split(/[,\n]/).map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean))];
  if (items.length > max) errors.push(`**${label}**: too many items (maximum ${max}).`);
  if (items.some((s) => s.length > itemMax)) errors.push(`**${label}**: each item must be at most ${itemMax} characters.`);
  return items.slice(0, max).filter((s) => s.length <= itemMax);
}

function features() {
  const out = [];
  for (let line of stripCtl(get('Key Features')).split('\n')) {
    line = line.replace(/^\s*[-*•]\s*/, '').trim();
    if (!line) continue;
    const [t, ...rest] = line.split('|');
    const title = t.trim();
    const sub = rest.join('|').trim();
    if (!title) continue;
    if (title.length > 60 || sub.length > 120) {
      errors.push('**Key Features**: a title can be 60 characters and a subtitle 120 characters at most.');
      continue;
    }
    out.push({ title, sub });
  }
  if (out.length > 12) errors.push('**Key Features**: maximum 12 lines.');
  return out.slice(0, 12);
}

/* 3) read the fields */
const name = text('App Name', { required: true, max: 60 });
const category = text('Category', { required: true, max: 10 }).toLowerCase();
if (category && !CATEGORIES.includes(category)) errors.push('**Category** must be App, Tool or Game.');

const id = text('App ID', { required: true, max: 40 });
if (id && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
  errors.push('**App ID** may contain only lowercase English letters, numbers and single hyphens (example: car-racing).');
}
if (id && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
  for (const c of CATEGORIES) {
    if (fs.existsSync(`${c}/${id}.json`)) errors.push(`**App ID** \`${id}\` is already used by another app. Please choose a different one.`);
  }
}

const liveUrl = httpsUrl('Live App URL', { required: true });
const sourceUrl = httpsUrl('Source Code URL', { required: true });
const license = text('License', { required: true, max: 80 });
const developer = text('Developer or Team Name', { required: true, max: 60 });
const tagline = text('Tagline', { max: 100 });
const version = text('Version', { max: 20 });
const iconUrl = httpsUrl('Icon URL', { image: true });
const website = httpsUrl('Website');
const reviewedCommit = text('Reviewed Commit or Release', { required: true, max: 100 });
const short = text('Short Description', { required: true, max: 300, multiline: true });
const description = text('Full Description', { required: true, max: 4000, multiline: true });
const tags = list('Tags', { max: 12, itemMax: 30 });
const keywords = list('Search Keywords', { max: 25, itemMax: 40 });
const featureList = features();

const platforms = list('Supported Platforms', { max: 3, itemMax: 20 }).filter((p) => PLATFORMS.includes(p));
if (!platforms.length) errors.push('**Supported Platforms**: choose at least one.');

const ticks = get('Confirmations').split('\n').filter((l) => /^\s*- \[[ xX]\]/.test(l));
if (ticks.length < CONFIRMATIONS || ticks.some((l) => !/^\s*- \[[xX]\]/.test(l))) {
  errors.push('**Confirmations**: every box must be ticked.');
}

/* 4) stop on problems */
if (errors.length) {
  const msg = [
    '❌ **This app could not be published yet.** Please fix the following:',
    '',
    ...errors.map((e) => `- ${e}`),
    '',
    'Edit the issue text (the ⋯ menu, then **Edit**), then ask the owner to approve it again.',
  ].join('\n');
  if (process.env.RESULT_FILE) fs.writeFileSync(process.env.RESULT_FILE, msg + '\n');
  console.error(msg);
  process.exit(1);
}

/* 5) write the file */
const updated = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
const app = { name };
if (iconUrl) app.icon = iconUrl;
app.path = liveUrl;
app.developer = developer;
if (tagline) app.tagline = tagline;
if (version) app.version = version;
app.size = 'Web App';
app.updated = updated;
if (website) app.website = website;
app.license = license;
app.compatibility = `Web App (${platforms.join(', ')})`;
if (tags.length) app.tags = tags;
if (featureList.length) app.features = featureList;
app.short = short;
app.description = description;
if (keywords.length) app.keywords = keywords;
app.verified = true;
app.featured = issueLabels.includes('featured');
app.source = sourceUrl;
app.reviewedCommit = reviewedCommit;

fs.mkdirSync(category, { recursive: true });
fs.writeFileSync(`${category}/${id}.json`, JSON.stringify(app, null, 2) + '\n');
console.log(`Created ${category}/${id}.json`);
