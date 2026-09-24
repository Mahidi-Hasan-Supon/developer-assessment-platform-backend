import express, { Application, Request, Response } from "express";
import config from "./app/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import httpStatus from "http-status";
import { notFound } from "./app/middleware/notFoun";
import { globalErrorHandler } from "./app/middleware/globalError";
import { authRouter } from "./app/module/auth/auth.route";
import { problemRouter } from "./app/module/problem/problem.route";
import { assessmentRoutes } from "./app/module/assessment/assessment.route";
import { assessmentProblemRoute } from "./app/module/assessmentProblem/assessmentProblem.route";
import { invitationRoute } from "./app/module/inventation/invitation.route";
import { attemptRoute } from "./app/module/attempt/attempt.route";
import { submissionRoute } from "./app/module/submission/submission.route";
import { answerRoute } from "./app/module/answer/answer.route";

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
app.use("/api/v1/problem",problemRouter);
app.use("/api/v1/assessments",assessmentRoutes);
app.use("/api/v1/assessmentProblem",assessmentProblemRoute);
app.use("/api/v1/invitation", invitationRoute);
app.use("/api/v1/attempt", attemptRoute);
app.use("/api/v1/submission", submissionRoute);
app.use("/api/v1/answer", answerRoute);

app.get("/", async (req: Request, res: Response) => {
  res.status(httpStatus.OK).json({
    success: true,
    message: "Welcome to our developer assessment platform project",
  });
});

app.use(notFound);
app.use(globalErrorHandler);

export default app;
