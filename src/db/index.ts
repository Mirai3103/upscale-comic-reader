import { Database } from "bun:sqlite";
import { DB_PATH } from "../config/env";

const db = new Database(DB_PATH);

// Initialize database
db.query(
	`
  CREATE TABLE IF NOT EXISTS processes (
    id TEXT PRIMARY KEY,
    status TEXT,
    images TEXT,
    remaining INTEGER default 0,
    title TEXT
  );
  `
).get();

export default db;
