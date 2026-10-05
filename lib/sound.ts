import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AudioPlayer,
  createAudioPlayer,
  setAudioModeAsync,
} from 'expo-audio';

const SOUND_KEY = 'savewise.sound.enabled.v1';

let player: AudioPlayer | null = null;
let modeSet = false;

export async function isSoundEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(SOUND_KEY);
    if (raw === null) return true;
    return raw === '1';
  } catch {
    return true;
  }
}

export async function setSoundEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(SOUND_KEY, enabled ? '1' : '0');
}

async function getPlayer(): Promise<AudioPlayer | null> {
  if (player) return player;
  try {
    if (!modeSet) {
      await setAudioModeAsync({ playsInSilentMode: true });
      modeSet = true;
    }
    player = createAudioPlayer(require('../assets/sounds/tap.wav'));
    return player;
  } catch {
    return null;
  }
}

/**
 * Plays a short tap click. Best effort: never throws, and stays
 * silent when the user muted sounds in Settings.
 */
export async function playTap(): Promise<void> {
  try {
    if (!(await isSoundEnabled())) return;
    const p = await getPlayer();
    if (!p) return;
    await p.seekTo(0);
    p.play();
  } catch {
    // Sound is best effort; the app works without it.
  }
}
