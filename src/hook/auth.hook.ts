import { getMeUser, googleLoginUser, loginUser, userLogOut } from "@/api";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useLogin = () => {
  return useMutation({
    mutationFn: loginUser,
  });
};

export const useGetMe = () => {
  return useQuery({
    queryKey: ["user"],
    queryFn: getMeUser,
    retry: false,
    refetchOnWindowFocus: false,
  });
};
export const useGoogleLogin = () => {
  return useMutation({
    mutationFn: googleLoginUser,
  });
};
export const useLogOut = () => {
  return useMutation({
    mutationFn: userLogOut,
  });
};
