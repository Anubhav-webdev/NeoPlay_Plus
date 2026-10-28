import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

// Load the backend's .env relative to this file, regardless of process cwd.
dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });
