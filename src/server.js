import app from "./app.js";
import env from "./config/env.js";
import { connectDB } from "./database/db.js";
import { ensureSuperAdminExists } from "./database/bootstrap.js";
// If your server.js has this line, comment it out:
// import "./database/db.js";

// Instead, just import firebase-admin:
import "./config/firebase-admin.js";

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

const startServer = async () => {
  try {
    await connectDB();

    // Create initial admin if not exists
    await ensureSuperAdminExists();

    const server = app.listen(env.PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${env.PORT}`);
    });

    server.on("error", (error) => {
      console.error("HTTP server error:", error);
    });
  } catch (error) {
    console.error("Server failed to start:", error);
    process.exit(1);
  }
};

startServer();
