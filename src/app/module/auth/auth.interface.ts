import { int } from "zod";
import { UserRole } from "../../../../generated/prisma/enums";

export interface IRegisterPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface ILoginPayload {
  email: string;
  password: string;
}

export interface IResetPasswordPayload {
  otp: string;
  email: string;
  newPassword: string;
}

export interface IVerifyPayload {
  email: string;
  otp: string;
}
export interface IGooglePayload{
  idToken:string
}

