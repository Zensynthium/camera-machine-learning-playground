import { Capacitor } from '@capacitor/core';

export default function() {
  const checkPlatform = () => {
    return Capacitor.getPlatform()
  }

  return { checkPlatform }
}