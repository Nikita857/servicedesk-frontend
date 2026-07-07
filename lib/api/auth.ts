import {AuthRequest, AuthResponse} from "@/types/auth";
import api from "./client";

export const authApi = {
  login: async (credentials: AuthRequest): Promise<AuthResponse> => {
    const response = await api.post<{ data: AuthResponse }>(
        "/auth/login",
        credentials
    );
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
  },
};
