import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LoginBody, Me } from "../../types/Api";
import { request } from "../../lib/apiClient";

const ME_KEY = ["me"];

// Whether this browser is logged in. The whole app waits on this.
const useMe = () =>
  useQuery({
    queryKey: ME_KEY,
    queryFn: () => request<Me>("/api/auth/me"),
    staleTime: 5 * 60 * 1000,
  });

const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: LoginBody) =>
      request<null>("/api/auth/login", { method: "POST", body }),
    onSuccess: () => queryClient.setQueryData<Me>(ME_KEY, { loggedIn: true }),
  });
};

const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => request<null>("/api/auth/logout", { method: "POST" }),
    onSuccess: () => queryClient.setQueryData<Me>(ME_KEY, { loggedIn: false }),
  });
};

export { useMe, useLogin, useLogout };
