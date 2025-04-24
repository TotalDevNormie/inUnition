import { Platform, Text, View } from 'react-native';
import DarkLogoFull from '../assets/darkLogoFull.svg';
import { Link } from 'expo-router';
import { useMMKVBoolean } from 'react-native-mmkv';
import { useEffect } from 'react';

const Landing = () => {
  const [_, setAlreadyLaunched] = useMMKVBoolean('alreadyLaunched');
  useEffect(() => setAlreadyLaunched(true), []);
  return (
    <View className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <View className="mx-auto flex w-full max-w-[44rem] flex-col gap-8">
        <DarkLogoFull className="" />
        <Text className="text-4xl text-text">
          inUnition is a productivity app for the web and mobile devices.{' '}
        </Text>
        <Text className="text-xl text-text">
          It features note taking, task managment, and seamless syncing across devices.
        </Text>
        <Text className="text-xl text-text">
          There is no need to register or log in, just get started. Login is only required for
          syncing notes and tasks across devices.{' '}
        </Text>

        {Platform.OS === 'web' ? (
          <View className="flex flex-row gap-4">
            <Link
              target="_blank"
              href={'https://github.com/TotoalNormie/inUnition/releases'}
              className="rounded-md bg-secondary p-4 text-xl text-text">
              Mobile releases{' '}
            </Link>
            <Link href="/" className="rounded-md bg-primary p-4 text-xl text-background">
              Get started on web{' '}
            </Link>
          </View>
        ) : (
          <>
            <View className="flex flex-row gap-4">
              <Link
                href={'https://inunition.vercel.app'}
                target="_blank"
                className="rounded-md bg-secondary p-2 text-xl text-text">
                Try the Web app{' '}
              </Link>
              <Link href="/" className="rounded-md bg-primary p-2 text-xl text-background">
                Get started{' '}
              </Link>
            </View>

            <Link
              target="_blank"
              href={'https://github.com/TotoalNormie/inUnition/releases'}
              className="text-underline text-xl text-text">
              Other releases{' '}
            </Link>
          </>
        )}
      </View>
    </View>
  );
};

export default Landing;
