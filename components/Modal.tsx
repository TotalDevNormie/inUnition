import { AntDesign } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Modal as RNModal, Pressable, Text, View } from 'react-native';

type Props = {
  children: ReactNode;
  open: boolean;
  setOpen: (open: boolean) => void;
  title?: string;
};

export default function Modal({ children, open, setOpen, title }: Props) {
  return (
    <RNModal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <Pressable
        className="flex-1 items-center justify-center bg-background-950/50"
        onPress={() => setOpen(false)}>
        <Pressable
          className="w-[90%] max-w-[600px] overflow-hidden rounded-xl bg-background"
          onPress={(e) => e.stopPropagation()}>
          {title && (
            <View className="flex-row items-center justify-between border-b border-secondary-850 p-4">
              <Text className="text-lg font-semibold text-text">{title} </Text>
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
