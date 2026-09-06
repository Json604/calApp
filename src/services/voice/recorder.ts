import Sound, {
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  OutputFormatAndroidType,
  type RecordBackType,
} from 'react-native-nitro-sound';

export type RecorderState = 'idle' | 'listening' | 'processing';

export async function startRecording(
  onMeter?: (event: RecordBackType) => void,
): Promise<string> {
  // Let nitro-sound pick an app-private absolute path.
  // A relative filename like "123.mp4" makes MediaRecorder fail on Android.
  const uri = await Sound.startRecorder(
    undefined,
    {
      AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
      AudioSourceAndroid: AudioSourceAndroidType.MIC,
      OutputFormatAndroid: OutputFormatAndroidType.MPEG_4,
      AudioSamplingRate: 16000,
      AudioEncodingBitRate: 128000,
      AudioChannels: 1,
    },
    true,
  );
  Sound.addRecordBackListener((event: RecordBackType) => {
    onMeter?.(event);
  });
  return uri;
}

export async function stopRecording(): Promise<string> {
  const uri = await Sound.stopRecorder();
  Sound.removeRecordBackListener();
  return uri;
}

export async function cancelRecording(): Promise<void> {
  try {
    await Sound.stopRecorder();
  } catch {
    // already stopped
  }
  Sound.removeRecordBackListener();
}
