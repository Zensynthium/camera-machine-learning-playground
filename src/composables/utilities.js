import { Capacitor } from '@capacitor/core';

export default function() {
  const isMobile = () => {
    // Desktop devices shouldn't trigger this, but if they do we can add additional checks
    if ("ontouchstart" in document.documentElement) {
      return true;
    } else {
      return false;
    }
  }

  const checkPlatform = () => {
    return Capacitor.getPlatform()
  }

  const UppercaseFirstLetterOfWords = (sentence) => {
    const words = sentence.split(" ");

    const uppercasedSentence = words.map((word) => { 
        return word[0].toUpperCase() + word.substring(1); 
    }).join(" ");

    return uppercasedSentence
  }

  return { isMobile, checkPlatform, UppercaseFirstLetterOfWords }
}