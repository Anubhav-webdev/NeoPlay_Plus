import "./config/env.js";
import connectDB from "./db/Connect.js";
import { app } from "./App.js";
import { assertAuthConfig } from "./services/authService.js";

const PORT = Number(process.env.PORT) || 5000;

// Start accepting requests only after the database connection succeeds.
assertAuthConfig();
await connectDB();

app.listen(PORT, () => {
  console.log(`NeoPlay+ API listening on port ${PORT}`);
});
