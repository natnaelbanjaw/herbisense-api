import app from "./app.js";
import env from "./config/env.js";
import { connectDB } from "./database/db.js";

const startServer = async () => {
  try {
    await connectDB();

    app.listen(env.PORT, () => {
      console.log(`🚀 Server running on port: localhost://${env.PORT}`);
    });

  } catch (error) {
    console.error("Server failed to start:", error);
    process.exit(1);
  }
};

startServer();
