import mongoose from "mongoose";
import { DB_NAME } from "../Constents.js";

const ConnectDB = async () => {
  try {
    if (!process.env.DB_URL) {
      throw new Error("DB_URL is required to connect to MongoDB");
    }
    const connectionInstance = await mongoose.connect(
      `${process.env.DB_URL}/${DB_NAME}`
    );
    console.log(`✅ MongoDB connected: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};

export default ConnectDB;
