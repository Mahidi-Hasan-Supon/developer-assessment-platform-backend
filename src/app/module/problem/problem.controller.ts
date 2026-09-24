import { Request, Response } from "express";

import { problemService } from "./problem.service";
import { catchAsync } from "../../utiles/catchAsync";
import { sendResponse } from "../../utiles/sendResponse";
import httpStatus from "http-status";
import { UserRole } from "../../../../generated/prisma/enums";

const createProblem = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const userId = req.user?.userId;
  const result = await problemService.createProblem(payload, userId as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Problem created successfully",
    data: result,
  });
});

const getAllProblems = catchAsync(async (req: Request, res: Response) => {
  const {data , meta} = await problemService.getAllProblems(req.query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Problems retrieved successfully",
    data,
    meta
    
  });
});

const getProblemById = catchAsync(async (req: Request, res: Response) => {
  const result = await problemService.getProblemById(req.params.id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Problem retrieved successfully",
    data: result,
  });
});

const updateProblem = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const userId = req.user?.userId;
  const role = req.user?.role;
  const id = req.params.id;

  const result = await problemService.updateProblem(
    id as string,
    payload,
    userId as string,
    role as UserRole,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Problem updated successfully",
    data: result,
  });
});

const deleteProblem = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const role = req.user?.role;
  const id = req.params.id;

  await problemService.deleteProblem( 
    id as string,
    userId as string,
    role as UserRole);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Problem deleted successfully",
    data: null,
  });
});

export const problemController = {
  createProblem,
  getAllProblems,
  getProblemById,
  updateProblem,
  deleteProblem,
};
