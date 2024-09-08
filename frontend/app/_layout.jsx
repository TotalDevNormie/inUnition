import { Stack } from 'expo-router/stack';
import '../global.css';
import { SafeAreaView } from 'react-native-safe-area-context';

export default Layout = () => {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="(tabs)" />
        </Stack>
    );
}