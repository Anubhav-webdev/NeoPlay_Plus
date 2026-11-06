import mongoose from "mongoose";
import "../config/env.js";
import { DB_NAME } from "../Constents.js";
import {
  assertAdminDataConfig,
  migrateLegacyAdmins,
} from "../services/adminDataService.js";

if (!process.env.DB_URL) {
  console.error("DB_URL is required in Backend/.env.");
  process.exitCode = 1;
} else {
  try {
    assertAdminDataConfig();
    await mongoose.connect(`${process.env.DB_URL}/${DB_NAME}`);
    const migrated = await migrateLegacyAdmins();
    console.log(`Migrated ${migrated} legacy admin account(s).`);
  } catch (error) {
    console.error("Could not migrate legacy admin accounts:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
