<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Start Menu</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-grid>
        <ion-row>
          <ion-col size="6" :key="photo" v-for="photo in photos">
            <ion-img :src="photo.webviewPath" @click="showActionSheet(photo)"></ion-img>
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonContent,
  IonHeader,
  IonItem,
  IonList,
  IonMenu,
  IonRouterOutlet,
  IonTitle,
  IonToolbar,
  IonButton,
  IonPage,
  IonGrid,
  IonRow,
  IonCol,
  IonImg,
  menuController
} from '@ionic/vue';
import { defineComponent } from 'vue';

export default defineComponent({
  components: {
    IonContent,
    IonHeader,
    IonItem,
    IonList,
    IonMenu,
    IonRouterOutlet,
    IonTitle,
    IonButton,
    IonPage,
    IonGrid,
    IonRow,
    IonCol,
    IonImg,
    IonToolbar
  },
  setup() {
    const openFirst = () => {
      menuController.enable(true, 'first');
      menuController.open('first');
    }

    const openEnd = () => {
      menuController.open('end');
    }

    const openCustom = () => {
      menuController.enable(true, 'custom');
      menuController.open('custom');
    }

    return { openFirst, openEnd, openCustom }
  }
});
</script>

<style>
  .my-custom-menu {
    --width: 500px;
  }
</style>