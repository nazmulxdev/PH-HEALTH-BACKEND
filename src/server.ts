import app from "./app.js";
import { config } from "./config/env";
import { seedSuperAdmin } from "./utils/seed.js";

const port = config.PORT;

const bootStrap = async () => {
  try {
    await seedSuperAdmin();
    app.listen(port, () => {
      console.log("This server is running on the port :", port);
    });
  } catch (error) {
    console.error(error);
  }
};

bootStrap();
