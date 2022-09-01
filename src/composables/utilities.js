import { Capacitor } from '@capacitor/core';

export default function() {
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

  return { UppercaseFirstLetterOfWords, checkPlatform }
}