import { Stack } from 'expo-router/stack';
import '../global.css';
import { View } from 'react-native-web';

export default Index = () => {
    return (
        <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
    );
}