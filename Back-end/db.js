import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new pkg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // required for Neon SSL
  },
});
