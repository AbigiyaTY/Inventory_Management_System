require("dotenv").config();
const { MongoClient } = require("mongodb");

let client = null;
let db = null;

async function connect() {
  if (db) return db;
  if (!process.env.MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is not set. Copy .env.example to .env and fill it in.",
    );
  }
  client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db(process.env.DB_NAME || "inventory_db");
  console.log(`Connected to MongoDB database "${db.databaseName}"`);
  return db;
}

function getDb() {
  if (!db) throw new Error("Database not connected yet. Call connect() first.");
  return db;
}

async function close() {
  if (client) await client.close();
  client = null;
  db = null;
}

module.exports = { connect, getDb, close };
