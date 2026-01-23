import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) throw new Error("MONGODB_URI missing");

const client = new MongoClient(uri);

export const db = client.db();        // database name comes from URI
export const connectDB = async () => {
  if (!client.topology?.isConnected()) {
    await client.connect();
  }
};
