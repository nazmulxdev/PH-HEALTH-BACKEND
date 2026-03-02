import app from "./app.js";
import config from "./config/env.js";

const port = config.port;

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
