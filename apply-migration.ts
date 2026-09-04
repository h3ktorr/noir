import "dotenv/config";
import fs from "fs";
import mariadb from "mariadb";

async function main() {
  const migrationPath = process.argv[2];

  if (!migrationPath) {
    throw new Error("Please provide a migration.sql path.");
  }

  const pool = mariadb.createPool({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    ssl: {
      rejectUnauthorized: false,
    },
    connectionLimit: 1,
    connectTimeout: 20000,
    acquireTimeout: 20000,
  });

  const migration = fs.readFileSync(migrationPath, "utf8");

  const statements = migration
    .split(/;\s*(?=--|CREATE|ALTER)/i)
    .map((sql) => sql.trim())
    .filter(Boolean);

  let conn;

  try {
    conn = await pool.getConnection();

    console.log(`Found ${statements.length} SQL statements.`);

    for (let i = 0; i < statements.length; i++) {
      console.log(`Running statement ${i + 1}/${statements.length}...`);
      await conn.query(statements[i]);
      console.log("✓ Done");
    }

    console.log("\nMigration completed successfully!");
  } finally {
    if (conn) conn.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("\nMigration failed:");
  console.error(error);
  process.exit(1);
});
