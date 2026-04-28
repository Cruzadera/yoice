import { Platform } from 'react-native';

const TOKEN_KEY = 'yoice_auth_token';
let secureStoreModule: {
  getItemAsync?: (key: string) => Promise<string | null>;
  setItemAsync?: (key: string, value: string) => Promise<void>;
  deleteItemAsync?: (key: string) => Promise<void>;
} | null | undefined;

const getSecureStore = async () => {
  if (Platform.OS === 'web') {
    return null;
  }

  if (secureStoreModule !== undefined) {
    return secureStoreModule;
  }

  try {
    secureStoreModule = eval('require')('expo-secure-store');
  } catch {
    secureStoreModule = null;
  }

  return secureStoreModule;
};

export const saveToken = async (token: string): Promise<void> => {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
    return;
  }

  const secureStore = await getSecureStore();
  if (secureStore?.setItemAsync) {
    await secureStore.setItemAsync(TOKEN_KEY, token);
  }
};

export const loadToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }

  const secureStore = await getSecureStore();
  if (secureStore?.getItemAsync) {
    return secureStore.getItemAsync(TOKEN_KEY);
  }

  return null;
};

export const clearToken = async (): Promise<void> => {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }

  const secureStore = await getSecureStore();
  if (secureStore?.deleteItemAsync) {
    await secureStore.deleteItemAsync(TOKEN_KEY);
  }
};
