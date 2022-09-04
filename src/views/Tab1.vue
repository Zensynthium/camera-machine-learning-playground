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
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue';
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
    IonPage 
  },
  setup() {
    const detectedText = ref();
    return {
      detectedText
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