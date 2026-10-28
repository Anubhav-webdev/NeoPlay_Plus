import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nodemonPath = path.join(backendRoot, "node_modules", "nodemon", "bin", "nodemon.js");
let stopping = false;

function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = exitCode;
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) child.kill();
  }
}

const children = [
  ["API", "Server.js"],
  ["Media worker", "MediaWorker.js"],
].map(([name, entry]) => {
  const child = spawn(process.execPath, [nodemonPath, entry], {
    cwd: backendRoot,
    env: process.env,
    stdio: "inherit",
  });
  child.once("error", (error) => {
    console.error("Could not start " + name + ":", error);
    stop(1);
  });
  child.once("exit", (code, signal) => {
    if (stopping) return;
    if (code !== 0) {
      console.error(name + " stopped (code " + code + ", signal " + signal + ").");
    }
    stop(code === 0 ? 0 : code || 1);
  });
  return child;
});

process.once("SIGINT", () => stop(0));
process.once("SIGTERM", () => stop(0));
