import {Platform} from 'react-native';
import Sound, {
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  AVEncoderAudioQualityIOSType,
  OutputFormatAndroidType,
  type RecordBackType,
} from 'react-native-nitro-sound';

export type RecorderState = 'idle' | 'listening' | 'processing';

export async function startRecording(
  onMeter?: (event: RecordBackType) => void,
): Promise<string> {
  const path = Platform.select({
    ios: 'cutlog.m4a',
    android: `${Date.now()}.mp4`,
    default: 'cutlog.m4a',
  });
  const uri = await Sound.startRecorder(path, {
    AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
    AudioSourceAndroid: AudioSourceAndroidType.MIC,
    OutputFormatAndroid: OutputFormatAndroidType.MPEG_4,
    AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
    AVNumberOfChannelsKeyIOS: 1,
    AVFormatIDKeyIOS: 'aac',
  });
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
