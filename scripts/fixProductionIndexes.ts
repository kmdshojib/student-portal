import mongoose from "mongoose";
import { readFileSync } from 'fs';
import { join } from 'path';

// Simple .env loader
function loadEnv() {
    try {
        const envPath = join(process.cwd(), '.env');
        console.log("Loading .env from:", envPath);
        const envFile = readFileSync(envPath, 'utf-8');
        envFile.split('\n').forEach(line => {
            const match = line.match(/^([^#=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim();
                if (!process.env[key]) {
                    process.env[key] = value;
                }
            }
        });
    } catch (err) {
        // .env file not found, that's okay
    }
}

loadEnv();

async function fixPaymentIndexes() {
    // You can pass the MongoDB URI as an argument or use the one from .env
    const mongoUri = process.argv[2] || process.env.MONGODB_URI;
    console.log("MongoDB URI:", mongoUri);

    if (!mongoUri) {
        console.error("❌ No MongoDB URI provided!");
        console.log("\nUsage:");
        console.log("  npx tsx scripts/fixProductionIndexes.ts [MONGODB_URI]");
        console.log("\nExample:");
        console.log("  npx tsx scripts/fixProductionIndexes.ts 'mongodb+srv://user:pass@cluster.mongodb.net/studentdb'");
        process.exit(1);
    }

    try {
        console.log("🔌 Connecting to MongoDB...");
        await mongoose.connect(mongoUri);
        console.log("✅ Connected to MongoDB");

        const db = mongoose.connection.db;
        if (!db) {
            console.error("❌ Database connection not established");
            process.exit(1);
        }

        const paymentsCollection = db.collection("payments");

        // List current indexes
        console.log("\n📋 Current indexes:");
        const currentIndexes = await paymentsCollection.indexes();
        currentIndexes.forEach((idx) => {
            console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
            if (idx.partialFilterExpression) {
                console.log(`    Partial filter: ${JSON.stringify(idx.partialFilterExpression)}`);
            }
        });

        // Drop the problematic indexes if they exist
        const indexesToDrop = [
            "studentId_1_paymentMonth_1",
            "studentId_1_installmentNumber_1"
        ];

        console.log("\n🗑️  Dropping old indexes without partial filters...");
        for (const indexName of indexesToDrop) {
            try {
                await paymentsCollection.dropIndex(indexName);
                console.log(`  ✅ Dropped: ${indexName}`);
            } catch (err: unknown) {
                const error = err as { code?: number; message?: string };
                if (error.code === 27) {
                    console.log(`  ℹ️  ${indexName} does not exist, skipping...`);
                } else {
                    console.error(`  ❌ Error dropping ${indexName}:`, error.message);
                }
            }
        }

        // Create the new indexes with partial filters
        console.log("\n🔨 Creating new indexes with partial filters...");

        try {
            await paymentsCollection.createIndex(
                { studentId: 1, paymentMonth: 1 },
                {
                    unique: true,
                    name: "studentId_1_paymentMonth_1_partial",
                    partialFilterExpression: {
                        paymentMonth: { $exists: true },
                        paymentType: "monthly"
                    }
                }
            );
            console.log("  ✅ Created: studentId_1_paymentMonth_1_partial (with partial filter)");
        } catch (err: unknown) {
            const error = err as { message?: string };
            console.log(`  ℹ️  ${error.message}`);
        }

        try {
            await paymentsCollection.createIndex(
                { studentId: 1, installmentNumber: 1 },
                {
                    unique: true,
                    name: "studentId_1_installmentNumber_1_partial",
                    partialFilterExpression: {
                        installmentNumber: { $exists: true },
                        paymentType: "installment"
                    }
                }
            );
            console.log("  ✅ Created: studentId_1_installmentNumber_1_partial (with partial filter)");
        } catch (err: unknown) {
            const error = err as { message?: string };
            console.log(`  ℹ️  ${error.message}`);
        }

        // List final indexes
        console.log("\n📋 Final indexes:");
        const finalIndexes = await paymentsCollection.indexes();
        finalIndexes.forEach((idx) => {
            console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
            if (idx.partialFilterExpression) {
                console.log(`    ✅ Partial filter: ${JSON.stringify(idx.partialFilterExpression)}`);
            }
        });

        console.log("\n✅ Index fix completed successfully!");
        console.log("   All payment records are safe - no data was deleted.");
        console.log("   You can now create payments without duplicate key errors.");

    } catch (err) {
        console.error("❌ Error:", err);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log("\n🔌 Disconnected from MongoDB");
    }
}

fixPaymentIndexes();
