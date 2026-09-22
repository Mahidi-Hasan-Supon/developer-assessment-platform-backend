import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../utiles/catchAsync";
import z from "zod";

export const validationRequest = (zodSchema: z.ZodObject) => {
  return catchAsync((req: Request, res: Response, next: NextFunction) => {
    const body = req.body ?? {};
    const result = zodSchema.safeParse(body);

    if (!result.success) {
      console.log(result.error);
      console.log(result.error.message);
      throw new Error(result.error.issues[0]?.message);
    }

    req.body = result.data;

    next();
  });
};
