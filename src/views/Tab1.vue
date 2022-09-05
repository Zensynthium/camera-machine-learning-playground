<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Text Detection (OCR)</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <!-- <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Current Text: {{ detectedText }}</ion-title>
        </ion-toolbar>
      </ion-header>-->

      <ion-title id="detected-text" class="ion-padding-top ion-text-center">Detected Text: {{ detectedText }}</ion-title>

      <!-- <ion-fab v-if="checkPlatform() != 'web'" vertical="bottom" horizontal="start" slot="fixed">
        <ion-fab-button @click="CameraPreview.stop()">
          <ion-icon :icon="closeOutline"></ion-icon>
        </ion-fab-button>
      </ion-fab> -->

      <ion-fab vertical="bottom" horizontal="center" slot="fixed">
        <ion-fab-button @click="startCamera()">
          <ion-icon :icon="camera"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- <ion-fab v-if="checkPlatform() != 'web'" vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="CameraPreview.flip()">
          <ion-icon :icon="repeat"></ion-icon>
        </ion-fab-button>
      </ion-fab> -->

      <!-- <ExploreContainer name="Tab 1 page" /> -->

      <!-- TODO: Slap Camera in here and hook up Tesseract OCR stuff for testing -->
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import utilities from '@/composables/utilities';

import { createWorker, OEM, PSM } from 'tesseract.js';

import { usePhotoGallery, UserPhoto } from '@/composables/usePhotoGallery';

import { camera, trash, close } from 'ionicons/icons';

import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonFab, IonFabButton, IonIcon, } from '@ionic/vue';
import { ref } from 'vue';

import ExploreContainer from '@/components/ExploreContainer.vue';

export default  {
  name: 'Tab1',
  components: { 
    ExploreContainer, 
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonPage,
    IonFab,
    IonFabButton,
    IonIcon,
  },
  setup() {
    const { photos, takePhoto, deletePhoto } = usePhotoGallery();
    
    const cameraShadowRoot = ref();
    const videoElement = ref();
    const detectedText = ref();

    const startCamera = async () => {
        detectVideoElement()
        await takePhoto();
    }

    const detectVideoElement = () => {
      console.log('detectVideoElement called!');

      const observer = new MutationObserver(function (mutations_list) {
        mutations_list.forEach(function (mutation) {
          mutation.addedNodes.forEach(function (added_node) {
            // Are you happy TypeScript
            const node = added_node as HTMLElement;

            // NOTE: Timing issues may occur, see if we can make sure this works on all devices and refactor accordingly
            if (node.nodeName == 'PWA-CAMERA-MODAL-INSTANCE') {
              console.log(`Node ${node.nodeName} found!`);

              const shadowRoot = node.shadowRoot;

              if (shadowRoot) {
                setTimeout(() => {
                  const pwaCamera = shadowRoot?.querySelector('pwa-camera');
                  cameraShadowRoot.value = pwaCamera?.shadowRoot;
                  videoElement.value = cameraShadowRoot.value?.querySelector('video');

                  const flashContainer = cameraShadowRoot.value?.querySelector('.items .flash');

                  console.log(flashContainer)
                  flashContainer.innerText = "Loading Text Detection...";

                  observer.disconnect();

                  if (videoElement.value) {
                    // Overlay canvas on top of video so we can draw points
                    const canvas = document.createElement("canvas");
                    canvas.id = "canvas";

                    const canvasWidth = 600;
                    const canvasHeight = 600;

                    canvas.width = canvasWidth;
                    canvas.height = canvasHeight;

                    // Same inline styling as Video Element
                    // canvas.style.width = "100%";
                    // canvas.style.height = "100%";
                    // canvas.style.maxHeight = "100%";
                    // canvas.style.minHeight = "100%";
                    // canvas.style.objectFit = "cover";

                    // canvas.style.position = "absolute";
                    // canvas.style.top = "0";
                    // canvas.style.left = "0";
                    
                    // videoElement.value.parentNode.appendChild(canvas);

                    // Getting canvas ready for drawing

                    const canvasContext = canvas.getContext("2d");

                    canvasContext?.translate(canvasWidth, 0);
                    canvasContext?.scale(-1, 1);

                    videoElement.value.addEventListener('loadeddata', async (event: any) => {
                      const videoWidth = videoElement.value.videoWidth;
                      const videoHeight = videoElement.value.videoHeight;

                      canvas.width = videoWidth;
                      canvas.height = videoHeight;

                      // Setup Tesseract OCR worker before parse loop
                      await initWorker()

                      const processWebcamFeed = async () => {
                        // Clear canvas and then draw to it
                        canvasContext?.clearRect(0, 0, canvas.width, canvas.height);
                        canvasContext?.drawImage(videoElement.value, 0, 0);
                        
                        // Attempt to recognize any text available in the image
                        const { data: { text } } = await worker.recognize(canvas);
                        detectedText.value = text;
                        flashContainer.innerText = text;

                        console.log(text);

                        // Call this function again to keep predicting when the browser is ready.
                        window.requestAnimationFrame(processWebcamFeed);
                      }

                      await processWebcamFeed();
                    });
                  }
                }, 500);
              }
            } else {
              console.log(added_node.nodeName);
            }
          });
        });
      });

      const elementToWatch = document.querySelector('body');

      if (elementToWatch) {
        observer.observe(elementToWatch, { subtree: false, childList: true });
        console.log('Observing... ');
      } else {
        console.log('Element to watch not found.');
      }
    }

    const worker = createWorker({
      logger: (m: any) => console.log(m),
    });

    const initWorker = async () => {
      await worker.load();
      await worker.loadLanguage('eng');
      await worker.initialize('eng', OEM.LSTM_ONLY);
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      });
    }

    return {
      startCamera,
      photos,
      takePhoto,
      detectedText, 
      camera, 
      trash, 
      close
    }
  }
}
</script>

<style>
#detected-text.ios {
  margin-top: 44px;
  height: 40px;
}
</style>