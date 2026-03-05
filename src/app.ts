import express, { Application, Request, Response } from "express";

import { indexRoutes } from "./routes";
import globalErrorHandler from "./middlewares/globalErrorHandlers";
import notFoundErrorHandler from "./middlewares/notFoundErrorHandler";

const app: Application = express();

app.use(express.json());

// specialty routes

app.use("/api/v1/", indexRoutes);

// root routes
app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to the ph health care.");
});

// 404 handler

app.use(notFoundErrorHandler);

// global error

app.use(globalErrorHandler);

export default app;
