import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";
import { Platform } from "react-native";
import { jwtDecode } from "jwt-decode";
import sendRequest, { RequestError } from "../../utils/sendrequest";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const AuthContext = createContext(null);

type AuthContextType = {
  user: any;
  isLoadingUser: boolean;
  loginMutation: any;
  registerMutation: any;
  logoutMutation: any;
  isOnline: boolean;
};

export type CredentialsType = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};

export type LoginCredentaialsType = Pick<CredentialsType, "email" | "password">;

type UserResponseType = {
  user: User | null;
  access_token: string | null;
  refresh_token: string | null;
};

type User = {
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected as boolean);
    });

    return () => unsubscribe();
  }, []);

  const { isLoading: isLoadingUser, error: userError } = useQuery({
    queryKey: ["user"],
    retry: 0,

    queryFn: async () => {
      let accessToken: string | null = null;
      let refreshToken: string | null = null;

      let user = null;
      try {
        const userData = await AsyncStorage.getItem("user");

        if (userData !== null) {
          user = JSON.parse(userData);
        }
      } catch (err) {}

      if (user) {
        setUser(user);
      }
      if (!isOnline) return;

      if (Platform.OS === "web") {
        accessToken = localStorage.getItem("access_token");
        refreshToken = localStorage.getItem("refresh_token");
      } else {
        accessToken = SecureStore.getItem("access_token");
        refreshToken = SecureStore.getItem("refresh_token");
      }

      if (!accessToken && !refreshToken) {
        setUser(null);
        await AsyncStorage.removeItem("user");

        throw {
          message: "No access token or refresh token found",
        } as RequestError;
      }

      if (!accessToken) return;

      const decodedAccessToken = jwtDecode(accessToken);

      if (
        decodedAccessToken.exp &&
        decodedAccessToken.exp * 1000 < Date.now() &&
        refreshToken
      ) {
        try {
          const newTokenData = await sendRequest<UserResponseType>(
            "/auth/refresh",
            {
              method: "POST",
              body: JSON.stringify({
                refresh_token: refreshToken,
              }),
            },
          );
          if (!newTokenData.access_token || !newTokenData.refresh_token) return;
          if (Platform.OS === "web") {
            localStorage.setItem("access_token", newTokenData.access_token);
            localStorage.setItem("refresh_token", newTokenData.refresh_token);
          } else {
            SecureStore.setItem("access_token", newTokenData.access_token);
            SecureStore.setItem("refresh_token", newTokenData.refresh_token);
          }
        } catch (err) {
          setUser(null);
          await AsyncStorage.removeItem("user");

          if (Platform.OS === "web") {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
          } else {
            await SecureStore.deleteItemAsync("access_token");
            await SecureStore.deleteItemAsync("refresh_token");
          }
          throw {
            message: "No access token or refresh token found",
          } as RequestError;
        }
      }

      const data = await sendRequest<UserResponseType>("/auth/me", {
        method: "POST",
        body: JSON.stringify({ token: accessToken }),
      });

      AsyncStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    },
  });

  const loginMutation = useMutation({
    mutationKey: ["user"],

    mutationFn: async (requset: LoginCredentaialsType) => {
      const data = await sendRequest<UserResponseType>("/auth/login", {
        method: "POST",
        body: JSON.stringify(requset),
      });

      setUser(data.user);
      AsyncStorage.setItem("user", JSON.stringify(data.user));

      if (data.access_token && data.refresh_token) {
        if (Platform.OS === "web") {
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
        } else {
          SecureStore.setItem("access_token", data.access_token);
          SecureStore.setItem("refresh_token", data.refresh_token);
        }
      }

      return data.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });

  const registerMutation = useMutation({
    mutationKey: ["user"],
    mutationFn: async (requset: CredentialsType) => {
      const data = await sendRequest<UserResponseType>("/auth/register", {
        method: "POST",
        body: JSON.stringify(requset),
      });

      setUser(data.user as User);
      AsyncStorage.setItem("user", JSON.stringify(data.user));
      if (data.access_token && data.refresh_token) {
        if (Platform.OS === "web") {
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
        } else {
          SecureStore.setItem("access_token", data.access_token);
          SecureStore.setItem("refresh_token", data.refresh_token);
        }
      }
      return data.user;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });

  const logoutMutation = useMutation({
    mutationKey: ["user"],
    mutationFn: async () => {
      let accessToken: string | null;
      if (Platform.OS === "web") {
        accessToken = localStorage.getItem("access_token");
      } else {
        accessToken = SecureStore.getItem("access_token");
      }
      if (!accessToken) null;
      await sendRequest("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ token: accessToken }),
      });
      return null;
    },

    onSuccess: async () => {
      setUser(null);
      if (Platform.OS === "web") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      } else {
        await SecureStore.deleteItemAsync("acces_token");
        await SecureStore.deleteItemAsync("refresh_token");
      }
      queryClient.clear();
    },
  });

  const value = {
    user,
    isLoadingUser,
    loginMutation,
    registerMutation,
    logoutMutation,
    isOnline,
  } as AuthContextType;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext<AuthContextType | null>(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
