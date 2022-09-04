<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Pose Detection</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <!-- <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Photo Gallery</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-grid>
        <ion-row>
          <ion-col size="6" :key="photo" v-for="photo in photos">
            <ion-img :src="photo.webviewPath" @click="showActionSheet(photo)"></ion-img>
          </ion-col>
        </ion-row>
      </ion-grid> -->

      <ion-title id="conditions" class="ion-padding-top ion-text-center">Conditions: {{ showConditions }}</ion-title>

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

    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import utilities from '@/composables/utilities';

import { camera, trash, close } from 'ionicons/icons';

import {
  actionSheetController,
  IonPage,
  IonHeader,
  IonFab,
  IonFabButton,
  IonIcon,
  IonToolbar,
  IonTitle,
  IonContent,
  IonImg,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
} from '@ionic/vue';

import { usePhotoGallery, UserPhoto } from '@/composables/usePhotoGallery';
import { computed, defineComponent, onMounted, ref } from 'vue';

import * as tf from '@tensorflow/tfjs-core';
import * as poseDetection from '@tensorflow-models/pose-detection';

// Register one of the TF.js backends.
import '@tensorflow/tfjs-backend-webgl';
// import '@tensorflow/tfjs-backend-wasm';

import drawCanvas from '@/composables/drawCanvas';
import { setupModel } from '@/composables/optionsPanel';
import * as params from '@/composables/params'

import * as dat from 'dat.gui';

export default defineComponent({
  name: 'Tab2',
  components: {
    IonHeader,
    IonFab,
    IonIcon,
    IonFabButton,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPage,
    IonGrid,
    IonRow,
    IonCol,
    IonImg,
    IonItem,
  },
  setup() {
    const { checkPlatform } = utilities();

    const { photos, takePhoto, deletePhoto } = usePhotoGallery();

    const startCamera = async () => {
      if (checkPlatform() == 'web') {
        detectVideoElement();
        await takePhoto();
      } else {
        // Mobile
        // await CameraPreview.start(CameraPreviewOptions);
        // await detectVideoMobile();
      }
    }

    const showActionSheet = async (photo: UserPhoto) => {
      const actionSheet = await actionSheetController.create({
        header: 'Photos',
        buttons: [
          {
            text: 'Delete',
            role: 'destructive',
            icon: trash,
            handler: () => {
              deletePhoto(photo);
            },
          },
          {
            text: 'Cancel',
            icon: close,
            role: 'cancel',
            handler: () => {
              // Nothing to do, action sheet is automatically closed
            },
          },
        ],
      });
      await actionSheet.present();
    };

    const videoElement = ref();

    const poseInterval = ref();

    const conditions: any = ref([]);
    const showConditions: any = computed(() => conditions.value.length != 0 ? conditions.value : 'None');

    const evaluateCondition = (keypoints: Array<any>) => {
      // clear conditions if not first run
      conditions.value = [];

      const scoreThreshold = params.STATE.modelConfig.scoreThreshold

      // Searching by name instead of index so it will work with MoveNet & BlazePose
      // TODO: How many points on the head need confidence for an accurate hunchback diagnosis
      const nose = keypoints.find(x => x.name == 'nose')
      const left_eye = keypoints.find(x => x.name == 'left_eye')
      const right_eye = keypoints.find(x => x.name == 'right_eye')
      const left_ear = keypoints.find(x => x.name == 'left_ear')
      const right_ear = keypoints.find(x => x.name == 'right_ear')

      const left_shoulder = keypoints.find(x => x.name == 'left_shoulder')
      const right_shoulder = keypoints.find(x => x.name == 'right_shoulder')

      const left_hip = keypoints.find(x => x.name == 'left_hip')
      const right_hip = keypoints.find(x => x.name == 'right_hip')

      const left_knee = keypoints.find(x => x.name == 'left_knee')
      const right_knee = keypoints.find(x => x.name == 'right_knee')

      const left_ankle = keypoints.find(x => x.name == 'left_ankle')
      const right_ankle = keypoints.find(x => x.name == 'right_ankle')

      // Checking for posture related conditions
      const eye_alignment = ((left_eye.x + right_eye.x) / 2);
      const shoulder_alignment = ((left_shoulder.x + right_shoulder.x) / 2);

      const eye_confidence = left_eye.score > scoreThreshold && right_eye.score > scoreThreshold == true ? true : false;
      const shoulder_confidence = left_shoulder.score > scoreThreshold && right_shoulder.score > scoreThreshold == true ? true : false;

      // Hunchback (Side View)
      if (eye_confidence && shoulder_confidence && Math.abs(eye_alignment - shoulder_alignment) > 50) {
        conditions.value.push('hunchback');
      }

      const lower_left_alignment = ((left_hip.x + left_ankle.x) / 2);
      const lower_right_alignment = ((right_hip.x + right_ankle.x) / 2);

      const left_leg_confidence = left_hip.score > scoreThreshold && left_knee.score > scoreThreshold && left_ankle.score > scoreThreshold == true ? true : false;
      const right_leg_confidence = right_hip.score > scoreThreshold && right_knee.score > scoreThreshold && right_ankle.score > scoreThreshold == true ? true : false;

      // Knee Issues (Front View)
      if (left_leg_confidence && right_leg_confidence && (Math.abs(left_knee.x - lower_left_alignment) > 20 || Math.abs(right_knee.x - lower_right_alignment) > 20)) {
        conditions.value.push('knee issues');
      }
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
                  const nestedShadowRoot = pwaCamera?.shadowRoot;
                  videoElement.value = nestedShadowRoot?.querySelector('video');
                  // const offscreenRender = nestedShadowRoot?.querySelector('.offscreen-image-render') as HTMLElement || null;

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
                    canvas.style.width = "100%";
                    canvas.style.height = "100%";
                    canvas.style.maxHeight = "100%";
                    canvas.style.minHeight = "100%";
                    canvas.style.objectFit = "cover";

                    canvas.style.position = "absolute";
                    canvas.style.top = "0";
                    canvas.style.left = "0";
                    
                    // canvas.style.bottom = ((videoHeight * 2) + 8) + 'px';

                    videoElement.value.parentNode.appendChild(canvas);
                    
                    // const canvasStyle = document.createElement('style');
                    // videoElement.value.parentNode.append(canvasStyle);

                    // Creating 3D Plot Container
                    // const scatterGL = document.createElement('div');
                    // scatterGL.setAttribute('id', 'scatter-gl-container');
                    // scatterGL.style.width = videoWidth;
                    // scatterGL.style.height = videoHeight;

                    // videoElement.value.parentNode.appendChild(scatterGL);

                    // Getting canvas ready for drawing

                    const canvasContext = canvas.getContext("2d");

                    canvasContext?.translate(canvasWidth, 0);
                    canvasContext?.scale(-1, 1);


                    // NOTE: canvasContext can be null, we should add a check here, though that may mess with the draw drawResults call further below
                    const { drawResults } = drawCanvas(canvasContext);

                    videoElement.value.addEventListener('loadeddata', async (event: any) => {
                      const videoWidth = videoElement.value.videoWidth;
                      const videoHeight = videoElement.value.videoHeight;

                      canvas.width = videoWidth;
                      canvas.height = videoHeight;

                      // Acceptable Parameter Formats: tf.Tensor3D, ImageData, HTMLVideoElement, HTMLImageElement, HTMLCanvasElement
                      const detectorConfig = {
                        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
                        enableTracking: true,
                        trackerType: poseDetection.TrackerType.BoundingBox
                      };

                      const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);

                      const processWebcamFeed = async () => {
                        canvasContext?.clearRect(0, 0, canvas.width, canvas.height);
                        canvasContext?.drawImage(videoElement.value, 0, 0);
                        const poses = await detector.estimatePoses(videoElement.value);

                        // Q: Should we timestamp the poses?
                        if (poses[0]) {
                          evaluateCondition(poses[0].keypoints)

                          drawResults(poses)

                          console.log(poses)
                        }

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

    onMounted(async () => {
      // use SINGLEPOSE_LIGHTNING for videos & SINGLEPOSE_THUNDER for images that are uploaded
      // MULTIPOSE_LIGHTNING is for when more than one person are in the frame.
      await setupModel({ model: 'movenet', type: 'lightning' });

      // detectVideoElement();
    })

    return {
      startCamera,
      photos,
      takePhoto,
      showActionSheet,
      camera,
      trash,
      close,
      showConditions,
    };
  },
});
</script>

<style>
.offscreen-image-render {
  display: none;
}

#conditions.ios {
  margin-top: 44px;
  height: 40px;
}
</style>
