import "./config/env.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import apiRoutes from "./routes/index.js";
import notFound from "./middlewares/notFound.js";
import errorHandler from "./middlewares/errorHandler.js";
import ApiError from "./scripts/utils/ApiError.js"

const app = express();
const configuredOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
if (configuredOrigins.includes("*")) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Set CORS_ORIGIN to explicit frontend origin(s) in production"
    );
  }
  configuredOrigins.splice(
    0,
    configuredOrigins.length,
    "http://localhost:5173"
  );
  console.warn(
    "CORS_ORIGIN=* is not allowed with credentialed auth; using localhost:5173"
  );
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || configuredOrigins.includes(origin))
        return callback(null, true);
      return callback(new ApiError(403, "Origin is not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "500kb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Mount API routes before the not-found and error handlers.
app.use("/api", apiRoutes);
app.use(notFound);
app.use(errorHandler);

export { app };
