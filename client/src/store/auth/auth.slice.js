import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../requestMethod";

// ─── Keys ─────────────────────────────────────────────────────────────────────
export const authKeys = {
  all: ["auth"],
  me: () => [...authKeys.all, "me"],
};

// ─── API calls ────────────────────────────────────────────────────────────────

// ✅ Strip confirmPassword — backend doesn't expect it
const register = ({ confirmPassword, ...body }) =>
  axiosInstance.post("auth/register", body);

const login = (body) => axiosInstance.post("auth/login", body);
const logout = () => axiosInstance.post("auth/logout");
const refreshToken = () => axiosInstance.post("auth/refresh");

// ─── Hooks ────────────────────────────────────────────────────────────────────
export const useRegister = () => {
  return useMutation({
    mutationFn: register,
    onSuccess: ({ data }) => {
      if (data?.data?.token) localStorage.setItem("token", data.data.token);
    },
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: login,
    onSuccess: ({ data }) => {
      if (data?.data?.token) localStorage.setItem("token", data.data.token);
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      localStorage.removeItem("token");
      queryClient.clear();
    },
  });
};

export const useRefreshToken = () => {
  return useMutation({
    mutationFn: refreshToken,
    onSuccess: ({ data }) => {
      if (data?.data?.token) localStorage.setItem("token", data.data.token);
    },
  });
};
