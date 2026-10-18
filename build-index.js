const fs = require('fs');
const KEEP = ['name','icon','short','keywords','verified','featured'];
const apps = [];
for (const category of ['app', 'tool', 'game']) {
  if (!fs.existsSync(category)) continue;
  for (const f of fs.readdirSync(category).filter(f => f.endsWith('.json'))) {
    const a = JSON.parse(fs.readFileSync(`${category}/${f}`, 'utf8'));
    const o = { id: f.slice(0, -5), category };
    KEEP.forEach(k => { if (a[k] !== undefined) o[k] = a[k]; });
    apps.push(o);
  }
}
fs.writeFileSync('store-index.json', JSON.stringify({ apps }));
