import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI?.trim();
let cached = (global as any).mongoose;
console.log("MONGODB_URI:", MONGODB_URI);
if (MONGODB_URI) {
  try {
    const parsed = new URL(MONGODB_URI);
    console.log("Parsed Mongo host:", parsed.hostname, "protocol:", parsed.protocol);
  } catch (err) {
    console.log("Could not parse MONGODB_URI with URL():", (err as Error).message);
  }
} else {
  console.log("MONGODB_URI is not set or empty");
}

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI as any, {
        bufferCommands: false,
      })
      .then((mongoose) => {
        return mongoose;
      })
      .catch((err) => {
        console.error("Mongo connect error:", err && err.message ? err.message : err);
        throw err;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;