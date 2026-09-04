import "dotenv/config";
import mariadb from "mariadb";

async function main() {
  const url = new URL(process.env.DATABASE_URL!);

  const pool = mariadb.createPool({
    host: url.hostname,
    port: Number(url.port),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.slice(1)),

    ssl: {
      rejectUnauthorized: false,
    },

    connectionLimit: 1,
    connectTimeout: 20000,
    acquireTimeout: 20000,
  });

  try {
    const result = await pool.query("SELECT 1 AS test");
    console.log("SUCCESS:", result);
  } catch (error) {
    console.error("FAILED:");
    console.dir(error, { depth: null });
  } finally {
    await pool.end();
  }
}

main();
