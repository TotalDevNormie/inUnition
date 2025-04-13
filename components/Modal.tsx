import { ReactNode } from 'react';
import { Modal as RNModal, Pressable, Text, View } from 'react-native';
import { AntDesign } from '@expo/vector-icons';

type Props = {
  children: ReactNode;
  open: boolean;
  setOpen: (open: boolean) => void;
  title?: string;
};

export default function Modal({ children, open, setOpen, title }: Props) {
  return (
    <RNModal
      visible={open}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setOpen(false)}>
      <Pressable
        className="flex-1 items-center justify-center bg-background-950/50"
        onPress={() => setOpen(false)}>
        <Pressable 
          className="w-[90%] max-w-[600px] bg-background rounded-xl overflow-hidden"
          onPress={(e) => e.stopPropagation()}>
          {title && (
            <View className="flex-row justify-between items-center p-4 border-b border-secondary-850">
              <Text className="text-lg font-semibold text-text">{title}</Text>
              <Pressable onPress={() => setOpen(false)}>
                <AntDesign name="close" size={24} color="#fff" />
              </Pressable>
            </View>
          )}
          {children}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
