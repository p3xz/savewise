import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import {
  ensurePermissionRequested,
  setupNotificationHandler,
} from '../lib/notifications';

export default function RootLayout() {
  useEffect(() => {
    setupNotificationHandler();
    ensurePermissionRequested();
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
