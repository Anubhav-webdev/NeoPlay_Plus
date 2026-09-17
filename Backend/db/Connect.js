import mongoose from "mongoose"
import { DB_NAME } from "../Constents.js"

const ConnectDB = async () => {
      try {
          const connectionInstance = await mongoose.connect(
               `${process.env.DB_URL}/${DB_NAME}` );
          console.log(`✅ MongoDB connected: ${connectionInstance.connection.host}`);
          
      } catch (error) {
           console.error("❌ MongoDB connection failed:", error && (error.stack || error));
          process.exit(1)
      }
}
export default ConnectDB;