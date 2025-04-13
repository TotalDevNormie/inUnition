import { Platform, Text, View } from 'react-native';
import DarkLogoFull from '../assets/darkLogoFull.svg';
import { Link } from 'expo-router';
import { useMMKVBoolean } from 'react-native-mmkv';
import { useEffect } from 'react';

const Landing = () => {
  const [_, setAlreadyLaunched] = useMMKVBoolean('alreadyLaunched');
  useEffect(() => setAlreadyLaunched(true), []);
  return (
    <View className="flex flex-col justify-center items-center min-h-screen p-4 bg-background">
      <View className="mx-auto max-w-[44rem] w-full flex flex-col gap-8">
        <DarkLogoFull className="" />
        <Text className="text-4xl text-text">
          inUnition is a productivity app for the web and mobile devices.
        </Text>
        <Text className="text-xl text-text">
          It features note taking, task managment, and seamless syncing across
          devices.
        </Text>
        <Text className="text-xl text-text">
          There is no need to register or log in, just get started. Login is
          only required for syncing notes and tasks across devices.
        </Text>

        {Platform.OS === 'web' ? (
          <View className="flex flex-row gap-4">
            <Link
              target="_blank"
              href={'https://github.com/TotoalNormie/inUnition/releases'}
              className="text-text bg-secondary p-4 rounded-md text-xl"
            >
              Mobile releases
            </Link>
            <Link
              href="/"
              className="text-background text-xl bg-primary p-4 rounded-md"
            >
              Get started on web
            </Link>
          </View>
        ) : (
          <>
            <View className="flex flex-row gap-4">
              <Link
                href={'https://inunition.vercel.app'}
                target="_blank"
                className="text-text bg-secondary p-2 rounded-md text-xl"
              >
                Try the Web app
              </Link>
              <Link
                href="/"
                className="text-background bg-primary p-2 rounded-md text-xl"
              >
                Get started
              </Link>
            </View>

            <Link
              target="_blank"
              href={'https://github.com/TotoalNormie/inUnition/releases'}
              className="text-text text-xl"
            >
              Other releases
            </Link>
          </>
        )}
      </View>
    </View>
  );
};

export default Landing;
