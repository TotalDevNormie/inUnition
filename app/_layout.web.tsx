import { Drawer } from 'expo-router/drawer';
import '../global.css'

export default function RootLayout() {
  return (
    <Drawer>
      <Drawer.Screen name="index" />
    </Drawer>
  );
}
