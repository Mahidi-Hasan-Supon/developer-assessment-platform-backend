import express, { Application, Request, Response } from "express";
import config from "./app/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import httpStatus from "http-status";
import { notFound } from "./app/middleware/notFoun";
import { globalErrorHandler } from "./app/middleware/globalError";
import { authRouter } from "./app/module/auth/auth.route";

const app: Application = express();

app.use(
  cors({
    origin: config.backend_url,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use("/api/v1/auth",authRouter);



app.get("/", async (req: Request, res: Response) => {
  res.status(httpStatus.OK).json({
    success: true,
    message: "Welcome to our developer assessment platform project",
  });
});

app.use(notFound);
app.use(globalErrorHandler);

export default app;
