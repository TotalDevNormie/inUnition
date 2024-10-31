import { Stack } from "expo-router/stack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../components/auth/AuthContext";
import "../global.css";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as NavigationBar from "expo-navigation-bar";
import { MD3DarkTheme, Provider as PaperProvider } from "react-native-paper";
import { sendFromBuffer } from "../utils/manageNotes";
import { useEffect } from "react";

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			networkMode: "always",
			throwOnError: false,
		},
		mutations: {
			networkMode: "always",
			throwOnError: false,
		},
	},
});

console.log(MD3DarkTheme.colors);

const theme = {
	...MD3DarkTheme,
	colors: {
		...MD3DarkTheme.colors,
		primary: "#2CC3A5",
		onPrimary: "#121517",
		primaryContainer: "#121517",
		surface: "#121517",
		surfaceVariant: "#1f222e",
		onSurface: "#E9F1EF",
		onSurfaceVariant: "#E9F1EF",
	},
	dark: true,
};

export default function Layout() {
	useEffect(() => {
		NavigationBar.setPositionAsync("absolute");
		NavigationBar.setBackgroundColorAsync("#000000");
		NavigationBar.setBehaviorAsync("overlay-swipe");
		sendFromBuffer();
	}, []);
	return (
		<QueryClientProvider client={queryClient}>
			<GestureHandlerRootView>
				<PaperProvider theme={theme}>
					<AuthProvider>
						<Stack
							screenOptions={{
								headerShown: false,
							}}
						>
							<Stack.Screen name="(tabs)" />
							<Stack.Screen name="(auth)" />
							<Stack.Screen name="note" />
						</Stack>
					</AuthProvider>
				</PaperProvider>
			</GestureHandlerRootView>
		</QueryClientProvider>
	);
}
