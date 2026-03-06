import app from "./app.js";
import { config } from "./config/env";

const port = config.PORT;

const bootStrap = () => {
  try {
    app.listen(port, () => {
      console.log("This server is running on the port :", port);
    });
  } catch (error) {
    console.error(error);
  }
};

bootStrap();
