<template>
  <ion-page>
    <ion-content>
      <ion-tabs>
        <ion-router-outlet></ion-router-outlet>
        <ion-tab-bar slot="bottom">
          <ion-tab-button tab="tab1" href="/tabs/tab1">
            <ion-icon :icon="textOutline" />
            <ion-label>Text</ion-label>
          </ion-tab-button>
            
          <ion-tab-button tab="tab2" href="/tabs/tab2">
            <ion-icon :icon="bodyOutline" />
            <ion-label>Pose</ion-label>
          </ion-tab-button>
          
          <ion-tab-button tab="tab3" href="/tabs/tab3">
            <ion-icon :icon="shapesOutline" />
            <ion-label>Object Detection</ion-label>
          </ion-tab-button>

          <ion-tab-button tab="tab4" href="/tabs/tab4">
            <ion-icon :icon="imagesOutline" />
            <ion-label>Segmentation</ion-label>
          </ion-tab-button>

          <!-- <ion-tab-button tab="tab4" href="/tabs/tab4">
            <ion-icon :icon="menuOutline" />
            <ion-label>Menu</ion-label>
          </ion-tab-button> -->
        </ion-tab-bar>
      </ion-tabs>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { IonTabBar, IonTabButton, IonTabs, IonContent, IonLabel, IonIcon, IonPage, IonRouterOutlet } from '@ionic/vue';
import { images, square, triangle, textOutline, bodyOutline, shapesOutline, menuOutline, imagesOutline } from 'ionicons/icons';

export default {
  name: 'Tabs',
  components: { IonContent, IonLabel, IonTabs, IonTabBar, IonTabButton, IonIcon, IonPage, IonRouterOutlet },
  setup() {
    return {
      images, 
      square, 
      triangle,
      textOutline,
      bodyOutline,
      shapesOutline,
      menuOutline,
      imagesOutline
    }
  }
}
</script>
