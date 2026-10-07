const { MongoClient, ObjectId } = require("mongodb");

const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017";
const client = new MongoClient(uri);

let db = null;

async function connectDB() {
  if (db) return db;
  try {
    await client.connect();
    console.log("Successfully connected to MongoDB");
    db = client.db("CoursePortalDB");
    return db;
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    throw err;
  }
}

function getDb() {
  if (!db) {
    throw new Error("Database not connected. Call connectDB() first.");
  }
  return db;
}

module.exports = {
  client,
  connectDB,
  getDb,
  ObjectId
};
