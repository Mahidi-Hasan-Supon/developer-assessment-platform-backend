import apiClient from "@/lib/apiClient";
import { GoogleLoginPayload, LoginPayload } from "@/types";

export const loginUser = async (payload: LoginPayload) => {
  return apiClient("/auth/login", {
    method: "POST",
    body: payload,
  });
};

export const getMeUser = async () => {
  return apiClient("/auth/getMe", {
    method: "GET",
  });
};

export const googleLoginUser = async (payload:GoogleLoginPayload) => {
  return apiClient("/auth/google-login", {
    method: "POST",
    body:payload
  });
};
export const userLogOut = async () => {
  return apiClient("/auth/logOut", {
    method: "POST",
  });
};
