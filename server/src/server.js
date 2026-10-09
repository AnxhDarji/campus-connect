import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/db.js";
import { startScheduler } from "./services/social/socialSchedulingService.js";

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await connectDB();
    startScheduler();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Social mode: ${(process.env.META_SOCIAL_MODE || "mock").toUpperCase()}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

startServer();
