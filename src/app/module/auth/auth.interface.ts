export interface IRegisterPayload {
  name: string;
  email: string;
  password: string;
  role: "CANDIDATE" | "COMPANY";
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
