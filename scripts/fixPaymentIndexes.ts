import mongoose from "mongoose";


async function fixPaymentIndexes() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("No MongoDB URI found in environment variables");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;
    if (!db) {
      console.error("Database connection not established");
      process.exit(1);
    }

    const paymentsCollection = db.collection("payments");

    // List current indexes
    console.log("\n📋 Current indexes:");
    const currentIndexes = await paymentsCollection.indexes();
    currentIndexes.forEach((idx) => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    // Drop the problematic indexes if they exist
    const indexesToDrop = [
      "studentId_1_paymentMonth_1",
      "studentId_1_installmentNumber_1"
    ];

    console.log("\n🗑️  Dropping old indexes...");
    for (const indexName of indexesToDrop) {
      try {
        await paymentsCollection.dropIndex(indexName);
        console.log(`  ✓ Dropped: ${indexName}`);
      } catch (err: unknown) {
        const error = err as { code?: number; message?: string };
        if (error.code === 27) {
          console.log(`  - ${indexName} does not exist, skipping...`);
        } else {
          console.error(`  ✗ Error dropping ${indexName}:`, error.message);
        }
      }
    }

    console.log("\n✅ Index fix completed! Your app will create new indexes on next startup.");
    console.log("   No data was deleted - all payment records are safe.");
    
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

fixPaymentIndexes();
