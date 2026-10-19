export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      name: string;
      email: string;
      role: "CANDIDATE" | "COMPANY" | "ADMIN";
      status: "ACTIVE" | "BLOCKED";
    };
    accessToken: string;
    refreshToken: string;
  };
}

export interface GoogleLoginPayload {
  idToken: string;
}
