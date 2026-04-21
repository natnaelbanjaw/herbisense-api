import app from "../app-firebase.js";
import env from "./config/env.js";
import "./config/firebase-admin.js";

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

const startServer = async () => {
  try {
    const server = app.listen(env.PORT, "0.0.0.0", () => {
      console.log(`Firebase server running on port ${env.PORT}`);
    });

    server.on("error", (error) => {
      console.error("HTTP server error:", error);
    });
  } catch (error) {
    console.error("Firebase server failed to start:", error);
    process.exit(1);
  }
};

startServer();
