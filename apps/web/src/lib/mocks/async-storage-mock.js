// Mock for @react-native-async-storage/async-storage
// This is needed because MetaMask SDK tries to import React Native modules
// but we're running in a browser environment where these aren't available

const asyncStorageMock = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
  clear: async () => {},
  getAllKeys: async () => [],
  multiGet: async () => [],
  multiSet: async () => {},
  multiRemove: async () => {},
};

export default asyncStorageMock;

