<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Start Menu</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-menu side="start" menu-id="first" content-id="main">
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>Start Menu</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-list>
          <ion-item>Menu Item</ion-item>
          <ion-item>Menu Item</ion-item>
          <ion-item>Menu Item</ion-item>
          <ion-item>Menu Item</ion-item>
          <ion-item>Menu Item</ion-item>
        </ion-list>
      </ion-content>
    </ion-menu>

    <ion-menu side="start" menu-id="custom" class="my-custom-menu" content-id="main">
      <ion-header>
        <ion-toolbar color="tertiary">
          <ion-title>Custom Menu</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-list>
          <ion-item>Menu Item</ion-item>
          <ion-item>Menu Item</ion-item>
          <ion-item>Menu Item</ion-item>
          <ion-item>Menu Item</ion-item>
          <ion-item>Menu Item</ion-item>
        </ion-list>
      </ion-content>
    </ion-menu>

    <ion-menu side="end" type="push" content-id="main">
      <ion-header>
        <ion-toolbar color="danger">
          <ion-title>End Menu</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-list>
          <ion-item>Menu Item</ion-item>
          <ion-item>Menu Item</ion-item>
          <ion-item>Menu Item</ion-item>
          <ion-item>Menu Item</ion-item>
          <ion-item>Menu Item</ion-item>
        </ion-list>
      </ion-content>
    </ion-menu>

    <ion-router-outlet id="main"></ion-router-outlet>

    <ion-content>
      <!-- <ion-item> -->
        <div class="d-flex flex-column justify-content-center ion-padding-top">
          <ion-button @click="openFirst()">Open First Menu</ion-button>
          <ion-button class="" @click="openEnd()">Open End Menu</ion-button>
          <ion-button class="" @click="openCustom()">Open Custom Menu</ion-button>
        </div>
      <!-- </ion-item> -->
    </ion-content>
  </ion-page>
</template>
<style>
.my-custom-menu {
  --width: 500px;
}
</style>

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