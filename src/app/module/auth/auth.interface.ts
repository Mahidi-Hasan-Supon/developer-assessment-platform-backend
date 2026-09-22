

export interface TRegisterPayload  {
  name: string;
  email: string;
  password: string;
  role: "CANDIDATE" | "COMPANY";
};

export interface TLoginPayload {
  email: string;
  password: string;
};




