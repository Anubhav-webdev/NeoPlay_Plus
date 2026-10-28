import mongoose from "mongoose";
import "../config/env.js";
import { DB_NAME } from "../Constents.js";
import User from "../models/users.js";

const [emailArgument, confirmation] = process.argv.slice(2);
const email = String(emailArgument || "").trim().toLowerCase();

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || confirmation !== "--confirm") {
  console.error(
    "Usage: npm run admin:promote -- user@example.com --confirm"
  );
  process.exitCode = 1;
} else if (!process.env.DB_URL) {
  console.error("DB_URL is required in Backend/.env.");
  process.exitCode = 1;
} else {
  try {
    await mongoose.connect(`${process.env.DB_URL}/${DB_NAME}`);
    const user = await User.findOne({ email }).select("_id email role");
    if (!user) {
      console.error(`No account found for ${email}. Create the account first.`);
      process.exitCode = 1;
    } else if (user.role === "admin") {
      console.log(`${email} already has the admin role.`);
    } else {
      user.role = "admin";
      await user.save();
      console.log(`Admin role granted to ${email}.`);
    }
  } catch (error) {
    console.error("Could not update the account role:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
