import { Tabs } from 'expo-router';

export default TabsLayout = () => {
    return (
        <Tabs screenOptions={{ tabBarActiveTintColor: 'red' }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                }}
            />
            <Tabs.Screen
                name="test"
                options={{
                    title: 'Settings',
                }}
            />
        </Tabs>
    );
}
