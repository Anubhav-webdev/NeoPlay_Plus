import "./config/env.js";
import connectDB from "./db/Connect.js";
import { app } from "./App.js";
import { assertAuthConfig } from "./services/authService.js";
import { assertAdminDataConfig } from "./services/adminDataService.js";
import { ensureDefaultCategories } from "./services/categorySeed.js";
import { initializeContentDeletionStorage } from "./services/contentDeletionService.js";
import User from "./models/users.js";

const PORT = Number(process.env.PORT) || 5000;

// Start accepting requests only after the database connection succeeds.
assertAuthConfig();
assertAdminDataConfig();
await connectDB();
if (await User.exists({ role: "admin" })) {
  throw new Error(
    "Legacy admin accounts must be migrated before the API starts. Run npm run admin:migrate from Backend.",
  );
}
await initializeContentDeletionStorage();
await ensureDefaultCategories();

app.listen(PORT, () => {
  console.log(`NeoPlay+ API listening on port ${PORT}`);
});
