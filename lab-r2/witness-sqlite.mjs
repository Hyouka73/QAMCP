import { DatabaseSync } from 'node:sqlite';

const dbPath = process.argv[2];
const table = process.argv[3] || 'reservations';

if (!dbPath) {
  console.error(JSON.stringify({ ok: false, error: 'missing_db_path' }));
  process.exit(2);
}

try {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    const rows = db.prepare(`SELECT marker FROM ${table} ORDER BY marker`).all();
    console.log(JSON.stringify({ ok: true, count: rows.length, markers: rows.map(r => r.marker) }));
  } finally {
    db.close();
  }
} catch (error) {
  console.log(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
  process.exit(1);
}
