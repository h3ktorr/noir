import "dotenv/config";

const url = process.env.DATABASE_URL;

if (!url) {
  console.log("DATABASE_URL is missing");
  process.exit(1);
}

const u = new URL(url);

console.log("Encoded password length:", u.password.length);
console.log("Decoded password length:", decodeURIComponent(u.password).length);
console.log("Contains encoded plus:", u.password.includes("%2B"));
console.log(
  "Decoded contains plus:",
  decodeURIComponent(u.password).includes("+"),
);
