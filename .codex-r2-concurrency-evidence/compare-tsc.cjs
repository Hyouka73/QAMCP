const fs = require('node:fs');
const parse = path => {
  const text = fs.readFileSync(path, 'utf8').replace(/^\uFEFF/, '').replace(/\r/g, '');
  const header = /^(.+?)\(\d+,\d+\): error (TS\d+): /gm;
  const matches = [...text.matchAll(header)];
  const counts = new Map();
  matches.forEach((match, index) => {
    const message = text.slice(match.index + match[0].length, matches[index + 1]?.index ?? text.length).trim();
    const key = JSON.stringify([match[1].replaceAll('\\', '/').toLowerCase(), match[2], message]);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return counts;
};
const previous = parse('../enc-stage1a-evidence/b2a-r1-tsc.log');
const current = parse('.codex-r2-concurrency-evidence/current-tsc.log');
const entries = counts => [...counts].sort().map(([key, count]) => ({ identity: JSON.parse(key), count }));
const difference = (first, second) => [...first].filter(([key, count]) => count > (second.get(key) ?? 0))
  .map(([key, count]) => ({ identity: JSON.parse(key), count: count - (second.get(key) ?? 0) }));
const report = { baseline: entries(previous), current: entries(current), added: difference(current, previous), removed: difference(previous, current) };
fs.writeFileSync('.codex-r2-concurrency-evidence/typescript-diff.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify({ baseline: [...previous.values()].reduce((a, b) => a + b, 0),
  current: [...current.values()].reduce((a, b) => a + b, 0), added: report.added, removed: report.removed }, null, 2));
