// Environment configuration
// Change USE_LOCAL_API to switch between local and production APIs

const USE_LOCAL_API = false; // Set to false to use production API

const LOCAL_IP = '192.168.1.4'; // Update with your computer's IP
const LOCAL_API_URL = `http://${LOCAL_IP}:5000`;
const PRODUCTION_API_URL = 'https://lifeimprove.vercel.app';

export const getApiUrl = () => {
  if (__DEV__) {
    return USE_LOCAL_API ? LOCAL_API_URL : PRODUCTION_API_URL;
  }
  return PRODUCTION_API_URL;
};

export const ENVIRONMENT = {
  isLocal: USE_LOCAL_API && __DEV__,
  apiUrl: getApiUrl(),
};