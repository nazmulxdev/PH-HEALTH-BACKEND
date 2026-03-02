import express, { Application, Request, Response } from "express";

import { indexRoutes } from "./routes";

const app: Application = express();

app.use(express.json());

// specialty routes

app.use("/api/v1/", indexRoutes);

// root routes
app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to the ph health care.");
});

export default app;
