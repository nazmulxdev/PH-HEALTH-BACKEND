import { Server } from "http";
import app from "./app.js";
import { config } from "./config/env";
import { seedSuperAdmin } from "./utils/seed.js";
import { redisService } from "./lib/redis.js";

const port = config.PORT;

let server: Server;

const bootStrap = async () => {
  try {
    await redisService.connect().catch(console.error);
    await seedSuperAdmin();
    server = app.listen(port, () => {
      console.log("This server is running on the port :", port);
    });
  } catch (error) {
    console.error(error);
  }
};

// sigterm signal handler error
process.on("SIGTERM", () => {
  console.log("SIGTERM is received....");
  if (server) {
    server.close();
  } else {
    process.exit(1);
  }
});

// sigint signal handler error

process.on("SIGINT", () => {
  console.log("SIGINT is received....");
  if (server) {
    server.close();
  } else {
    process.exit(1);
  }
});

// uncaught exception handler

process.on("uncaughtException", (error) => {
  console.error("uncaught exception error: ", error);

  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// unhandled rejection error

process.on("unhandledRejection", (error) => {
  console.error(
    "Unhandled rejection Detected.... Shutting down server.",
    error,
  );

  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

bootStrap();
