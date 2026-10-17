import { MongoClient, Db } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export function getMongoClient(): Promise<MongoClient> {
  const connectionUri = process.env.MONGODB_URI;

  if (!connectionUri) {
    throw new Error(
      "MongoDB connection URI is missing. Please define MONGODB_URI in your .env or environment variables."
    );
  }

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(connectionUri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000
      });
      global._mongoClientPromise = client.connect().catch((err) => {
        global._mongoClientPromise = undefined;
        throw err;
      });
    }
    return global._mongoClientPromise;
  } else {
    const client = new MongoClient(connectionUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000
    });
    return client.connect();
  }
}

export async function getDatabase(dbName?: string): Promise<Db> {
  const clientInstance = await getMongoClient();
  const databaseName = dbName || process.env.MONGODB_DB || "mediscan";
  return clientInstance.db(databaseName);
}

export default getMongoClient;
