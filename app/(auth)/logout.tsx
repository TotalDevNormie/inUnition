import { Redirect } from "expo-router";
import { useAuth } from "../../components/auth/AuthContext";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Text, View } from "react-native";

export default function Logout() {
    const { logoutMutation } = useAuth();
    const queryClient = useQueryClient();
    useEffect(() => {
        logoutMutation.mutate();
        queryClient.invalidateQueries({ queryKey: ['user'] });
        console.log('works');
    }, []);
    if (logoutMutation.isSuccess) {
        return <Redirect href="/" />;
    }

    return (
        <View>
            <Text>Logging out...</Text>
        </View>
    );
}