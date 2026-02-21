import app from "./app.js";
import env from "./config/env.js";
import { connectDB } from "./database/db.js";
import { ensureSuperAdminExists } from "./database/bootstrap.js";

const startServer = async () => {
  try {
    await connectDB();

    // 🔥 Create initial admin if not exists
    await ensureSuperAdminExists();

    app.listen(env.PORT, () => {
      console.log(`🚀 Server running on port ${env.PORT}`);
    });

  } catch (error) {
    console.error("Server failed to start:", error);
    process.exit(1);
  }
};

startServer();