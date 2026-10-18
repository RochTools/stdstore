const fs = require('fs');
const { apps } = JSON.parse(fs.readFileSync('apps.json', 'utf8'));
apps.forEach(a => {
  fs.mkdirSync(a.category, { recursive: true });
  const { id, category, ...rest } = a;
  fs.writeFileSync(`${a.category}/${id}.json`, JSON.stringify(rest, null, 2));
});
