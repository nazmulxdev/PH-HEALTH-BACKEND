import express, { Application, Request, Response } from "express";

const app: Application = express();

app.use(express.json());

// root routes
app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to the ph health care.");
});

export default app;
