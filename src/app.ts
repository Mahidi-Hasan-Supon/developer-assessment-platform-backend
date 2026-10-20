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
import { invitationRoute } from "./app/module/invitation/invitation.route";
import { attemptRoute } from "./app/module/attempt/attempt.route";
import { submissionRoute } from "./app/module/submission/submission.route";
import { answerRoute } from "./app/module/answer/answer.route";
import { resultRoute } from "./app/module/result/result.route";
import { paymentRoutes } from "./app/module/payment/payment.route";
import { analyticsRoutes } from "./app/module/analytics/analytics.route";
import { companyRouter } from "./app/module/company/company.route";
import { userRoute } from "./app/module/user/user.route";
import { candidateRouter } from "./app/module/candidate/candidate.route";
import { aiRouter } from "./app/module/ai/ai.route";

const app: Application = express();

// app.use(
//   cors({
//     origin: [config.frontend_url, config.backend_url],
//     credentials: true,
//   }),
// );

const allowedOrigins = [
  config.frontend_url,
  config.backend_url,
  "http://localhost:3000",
  "http://localhost:5000",
].filter(Boolean); // undefined ba null value gulo automatically bad diye dibe

app.use(
  cors({
    origin: (origin, callback) => {
      // Postman ba mobile app theke request asle origin undefined thake, tai allow korbo
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);   

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/ai", aiRouter);
app.use("/api/v1/company", companyRouter);
app.use("/api/v1/problem", problemRouter);
app.use("/api/v1/assessment", assessmentRoutes);
app.use("/api/v1/assessmentProblem", assessmentProblemRoute);
app.use("/api/v1/invitation", invitationRoute);
app.use("/api/v1/attempt", attemptRoute);
app.use("/api/v1/submission", submissionRoute);
app.use("/api/v1/answer", answerRoute);
app.use("/api/v1/result", resultRoute);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/user", userRoute);
app.use("/api/v1/candidate", candidateRouter);
// abadoto bad
// app.use("/api/v1/report", reportRoutes);
// app.use("/api/v1/notification", reportRoutes);

app.get("/", async (req: Request, res: Response) => {
  res.status(httpStatus.OK).json({
    success: true,
    message: "Welcome to our developer assessment platform project",
  });
});

app.use(notFound);
app.use(globalErrorHandler);

export default app;
