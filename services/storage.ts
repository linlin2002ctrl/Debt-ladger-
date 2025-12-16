
const STORAGE_KEY = 'lendledger_data_v1';

// We now just save the encrypted string blob directly.
// The encryption/decryption logic happens in the App component to keep the PIN secure in memory only.

export const saveEncryptedData = (encryptedString: string): void => {
  try {
    localStorage.setItem(STORAGE_KEY, encryptedString);
  } catch (e) {
    console.error('Failed to save data', e);
  }
};

export const loadRawData = (): string | null => {
  return localStorage.getItem(STORAGE_KEY);
};

// Helper to check if data exists at all
export const hasData = (): boolean => {
  return !!localStorage.getItem(STORAGE_KEY);
};

export const clearData = (): void => {
  localStorage.removeItem(STORAGE_KEY);
}
