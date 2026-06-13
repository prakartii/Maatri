/**
 * One-time migration: add anm_id ownership column to patients table.
 *
 * Prerequisites:
 *   1. npm install pg          (only needed once)
 *   2. Add DATABASE_URL to .env:
 *        DATABASE_URL=postgresql://postgres:[YOUR_DB_PASSWORD]@db.counipsipnhftdhryoka.supabase.co:5432/postgres
 *      Get the password from:
 *        Supabase Dashboard → Settings → Database → Connection string → URI → copy the password
 *
 * Usage:
 *   node scripts/migrate.js
 */

import dotenv from "dotenv";
dotenv.config();

import pg from "pg";
const { Client } = pg;

const ANM_PRIYA_ID = "3b48cd32-3730-4151-a95c-c4d58cc288da"; // anm@maatri.org

const STEPS = [
  {
    name: "Add anm_id column",
    sql: `ALTER TABLE patients ADD COLUMN IF NOT EXISTS anm_id UUID REFERENCES users(id) ON DELETE RESTRICT`,
  },
  {
    name: "Assign existing patients to anm@maatri.org",
    sql: `UPDATE patients SET anm_id = '${ANM_PRIYA_ID}' WHERE anm_id IS NULL`,
  },
  {
    name: "Create index",
    sql: `CREATE INDEX IF NOT EXISTS idx_patients_anm_id ON patients (anm_id)`,
  },
];

const VERIFY_SQL = `
SELECT
  COUNT(*)                     AS total_patients,
  COUNT(anm_id)                AS with_anm_id,
  COUNT(*) - COUNT(anm_id)     AS still_null
FROM patients
`;

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("❌ DATABASE_URL is not set in .env");
    console.error("   Add:  DATABASE_URL=postgresql://postgres:[PASSWORD]@db.counipsipnhftdhryoka.supabase.co:5432/postgres");
    process.exit(1);
  }

  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    console.log("✅ Connected to database\n");

    for (const step of STEPS) {
      process.stdout.write(`Running: ${step.name} ... `);
      await client.query(step.sql);
      console.log("done");
    }

    const { rows } = await client.query(VERIFY_SQL);
    const r = rows[0];
    console.log("\nVerification:");
    console.log(`  Total patients:   ${r.total_patients}`);
    console.log(`  With anm_id:      ${r.with_anm_id}`);
    console.log(`  Still NULL:       ${r.still_null}`);

    if (Number(r.still_null) === 0) {
      console.log("\n✅ Migration complete — patient creation will work now.");
    } else {
      console.warn("\n⚠ Some patients still have NULL anm_id. Re-run the script.");
    }
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
