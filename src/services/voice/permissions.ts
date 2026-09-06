import {Linking, PermissionsAndroid, Platform} from 'react-native';

export async function requestMicrophonePermission(): Promise<
  'granted' | 'denied' | 'blocked'
> {
  if (Platform.OS !== 'android') {
    return 'granted';
  }
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    {
      title: 'Microphone',
      message:
        'CutLog uses the microphone so you can log food, workouts, and weight by voice.',
      buttonPositive: 'Allow',
      buttonNegative: 'Not now',
    },
  );
  if (result === PermissionsAndroid.RESULTS.GRANTED) {
    return 'granted';
  }
  if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
    return 'blocked';
  }
  return 'denied';
}

export function openAppSettings(): void {
  Linking.openSettings().catch(() => undefined);
}
