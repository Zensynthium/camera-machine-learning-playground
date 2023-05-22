<template>
    <ion-page>
      <ion-header>
        <ion-toolbar>
          <ion-title>Segment Anything Model (SAM)</ion-title>
        </ion-toolbar>
      </ion-header>
  
      <ion-content id="content" class="camera-preview-content" :fullscreen="true">
  
        <!-- <ion-grid>
          <ion-row>
            <ion-col size="6" :key="photo" v-for="photo in photos">
              <ion-img :src="photo.webviewPath" @click="showActionSheet(photo)"></ion-img>
            </ion-col>
          </ion-row>
        </ion-grid> -->
        
        <!-- <ion-title id="entities" class="ion-padding-top ion-text-center">Entities Detected: {{ entitiesCount }}
        </ion-title> -->
        <!-- <ion-title id="detected-text" class="ion-padding-top ion-text-center">Detected Text: {{ detectedText.join(", ") }}
        </ion-title> -->
  
        <ion-fab v-if="checkPlatform() != 'web'" vertical="bottom" horizontal="start" slot="fixed">
          <ion-fab-button @click="CameraPreview.stop()">
            <ion-icon :icon="closeOutline"></ion-icon>
          </ion-fab-button>
        </ion-fab>
  
        <ion-fab vertical="bottom" horizontal="center" slot="fixed">
          <ion-fab-button @click="startCamera()">
            <ion-icon :icon="camera"></ion-icon>
          </ion-fab-button>
        </ion-fab>
  
        <ion-fab v-if="checkPlatform() != 'web'" vertical="bottom" horizontal="end" slot="fixed">
          <ion-fab-button @click="CameraPreview.flip()">
            <ion-icon :icon="repeat"></ion-icon>
          </ion-fab-button>
        </ion-fab>
  
        <ion-img id="videoFrame" :src="videoFrame"></ion-img>
      </ion-content>
    </ion-page>
  </template>
  
  <script lang="ts">
  import utilities from '@/composables/utilities';
  
  import { camera, trash, close, repeat, closeOutline } from 'ionicons/icons';
  import {
    actionSheetController,
    IonCol,
    IonContent,
    IonFab,
    IonFabButton,
    IonGrid,
    IonHeader,
    IonIcon,
    IonImg,
    IonItem,
    IonPage,
    IonRow,
    IonTitle,
    IonToolbar,
  } from '@ionic/vue';
  
  import { usePhotoGallery, UserPhoto } from '@/composables/usePhotoGallery';
  import { CameraPreview, CameraPreviewOptions } from '@capacitor-community/camera-preview';
  
  import { computed, defineComponent, onMounted, Ref, ref } from 'vue';
  
  // Register one of the TF.js backends.
  import '@tensorflow/tfjs-backend-webgl';
  import '@tensorflow/tfjs-backend-cpu';
  // import '@tensorflow/tfjs-backend-wasm';
  
  import * as cocoSsd from '@tensorflow-models/coco-ssd';
  // import { conditionalExpression } from '@babel/types';
  
  import { createWorker, PSM, OEM } from 'tesseract.js';
  
  export default defineComponent({
    name: 'Tab3',
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
      const { isMobile, checkPlatform, UppercaseFirstLetterOfWords } = utilities();
  
      const { photos, takePhoto, deletePhoto } = usePhotoGallery();
  
      const CameraPreviewOptions = {
        toBack: true,
        position: 'rear',
        parent: "content",
      }
  
      const startCamera = async () => {
        if (checkPlatform() == 'web') {
          //detectVideoWeb()
          await takePhoto();
        } else {
          // Mobile
          await CameraPreview.start(CameraPreviewOptions);
          //await detectVideoMobile();
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
  
      const cameraShadowRoot = ref();
      const videoElement = ref();
      const imageElement = ref();
      const videoFrame = ref();
  
      const entities: any = ref([]);
      const entitiesCount: any = computed(() => entities.value.length);
  
      // Text Parsing with Tesseract OCR
      const detectedText: Ref<string[]> = ref([]);
  
      const worker = createWorker({
        logger: (m: any) => console.log(m),
      });
  
      const initWorker = async () => {
        await worker.load();
        await worker.loadLanguage('eng');
        await worker.initialize('eng', OEM.LSTM_ONLY);
        await worker.setParameters({
          // user_defined_dpi: "300",
          tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
          // tessjs_create_osd: '1',
        });
      }
  
      const detectVideoWeb = () => {
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
  
                    const offscreenRender = cameraShadowRoot.value?.querySelector('.offscreen-image-render') as HTMLElement || null;
                    if (offscreenRender) {
                      offscreenRender.style.display = 'none';
                    }
  
                    const flashContainer = cameraShadowRoot.value?.querySelector('.items .flash');
  
                    flashContainer.innerText = "Entities Detected: 0";
  
                    observer.disconnect();
  
                    if (videoElement.value) {
                      // Overlay canvas on top of video so we can draw accurately
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
  
                      videoElement.value.parentNode.appendChild(canvas);
  
                      const canvasContext = canvas.getContext("2d");
  
                      if (canvasContext) {
                        canvasContext.translate(canvasWidth, 0);
                        canvasContext.scale(-1, 1);
                      }
  
                      videoElement.value.addEventListener('loadeddata', async (event: any) => {
                        const videoWidth = videoElement.value.videoWidth;
                        const videoHeight = videoElement.value.videoHeight;
  
                        canvas.width = videoWidth;
                        canvas.height = videoHeight;
  
                        const model = await cocoSsd.load();
                        
                        // Load Tesseract OCR
                        await initWorker();
  
                        // Keep a reference of all the child elements we create
                        // so we can remove them easilly on each render.
                        var children: any[] = [];
  
                        // Prediction loop!
                        const predictWebcam = async () => {
                          var predictions = null;
  
                          try {
                            // Acceptable Parameter Formats: tf.Tensor3D, ImageData, HTMLVideoElement, HTMLImageElement, HTMLCanvasElement
                            predictions = await model.detect(videoElement.value);
  
                            if (predictions?.length != entities.value.length) {
                              flashContainer.innerText = "Entities Detected: " + predictions.length;
                            }
  
                            entities.value = predictions;
                          } catch (err) {
                            // NOTE: model.detect fails when the video element in the parameter no longer exists due to DOM Manipulation from the camera state changing
                            setTimeout(() => {
                              console.log(err)
  
                              const actionIcons = cameraShadowRoot.value.querySelectorAll(".item.accept-use, .item.accept-cancel");
  
                              actionIcons.forEach((icon: HTMLElement) => {
                                icon.addEventListener("click", () => {
                                  setTimeout(() => {
                                    videoElement.value = cameraShadowRoot.value.querySelector('video');
  
                                    videoElement.value?.addEventListener('loadeddata', async (event: any) => {
                                      await predictWebcam();
                                    });
                                  }, 0);
                                });
                              });
                            }, 0);
  
                            return
                          }
                          
                          // Clear canvas and detected text
                          if (canvasContext) {
                            canvasContext.clearRect(0, 0, canvas.width, canvas.height);
                            canvasContext.drawImage(videoElement.value, 0, 0);
                          }
                          
                          if (predictions?.length) {
                            // console.log(predictions);
  
                            // Now let's start classifying the stream.
                            model.detect(videoElement.value).then(function (predictions: any) {
                              // Now lets loop through predictions and draw them to the live view if
                              // they have a high confidence score.
  
                              // NOTE: We run the main loop twice to ensure that we grab the images before we draw over any of the detected objects so we can get a clearer image.
                              // TODO: See if we can make it so that we only need to run the loop once but can get a clear image without any canvas bounding boxes drawn on it (for performance optimization)
                              for (let n = 0; n < predictions.length; n++) {
                                // Attempt to use OCR from either Tesseract or EAST to determine the text on the book. This may or may not be included in the main app depending on how reliable it is
                                if (predictions[n].class == 'book') {
                                  (async () => {
                                    // This may be slow but the OSR function worker.detect() doesnt offer a crop parameter like recognize does.
                                    const bookCanvasData = canvasContext?.getImageData(predictions[n].bbox[0], predictions[n].bbox[1], predictions[n].bbox[2], predictions[n].bbox[3]);
        
                                    const bookCanvas = document.createElement("canvas")
                                    if (bookCanvasData) {
                                      bookCanvas.width = bookCanvasData?.width;
                                      bookCanvas.height = bookCanvasData?.height;
                                      const bookCanvasContext = bookCanvas.getContext("2d");
                                      bookCanvasContext?.putImageData(bookCanvasData, 0, 0);
                                    }
                                    
                                    // TODO: Find out with OSD isn't working, why DPI is 0 even though it's explicitly set to 70 in worker.config, and how to catch errors in the worker
                                    // Attempt to recognize any text available in the image using OSD
                                    try {
                                      // const { data } = await worker.detect(bookCanvas);
                                      
                                      const { data: { text } } = await worker.recognize(bookCanvas);
                                      console.log(text)
                                      const bookDataUrl = bookCanvas.toDataURL().split('data:image/png;base64,')[1];
                                      
                                      // console.log(bookDataUrl)
                                    // const { data: { text } } = await worker.recognize(canvas, {
                                    //   rectangle: {
                                    //     top: predictions[n].bbox[1], 
                                    //     left: predictions[n].bbox[0], 
                                    //     width: predictions[n].bbox[2], 
                                    //     height: predictions[n].bbox[3]
                                    //   },
                                    // });
                                    
                                      detectedText.value.push(text);
                                      console.log(`Object ${n}: \n${text}`);
                                      // NOTE: Where should we update the text in the appplication to show the text of the book that is being recognized? Possibly overlay it over the bounding box of the book itself?
                                      // flashContainer.innerText = text;
                                    } catch(err) {
                                      console.log(err)
                                    }
                                  })();
                                }
                              }
  
                              for (let n = 0; n < predictions.length; n++) {
                                // If we are over 66% sure we are sure we classified it right, draw it!
                                if (predictions[n].score > 0.66) {
                                  if (canvasContext) {
                                    // Bounding Box - Body Outline
                                    canvasContext.beginPath();
                                    canvasContext.strokeStyle = "rgba(27, 140, 254, 0.30)"; //"rgba(255, 255, 255, 0.7)";
                                    canvasContext.rect(predictions[n].bbox[0], predictions[n].bbox[1], predictions[n].bbox[2], predictions[n].bbox[3])
                                    canvasContext.stroke();
  
                                    // Bounding Box - Body
                                    canvasContext.fillStyle = "rgba(27, 140, 254, 0.15)";
                                    canvasContext.fillRect(predictions[n].bbox[0], predictions[n].bbox[1], predictions[n].bbox[2], predictions[n].bbox[3]);
  
                                    // Bounding Box - Title Outline
                                    canvasContext.beginPath();
                                    canvasContext.strokeStyle = "rgba(27, 140, 254, 0.30)"; //"rgba(255, 255, 255, 0.7)";
                                    canvasContext.rect(predictions[n].bbox[0], predictions[n].bbox[1], predictions[n].bbox[2], 25)
                                    canvasContext.stroke();
  
                                    // Bounding Box - Title
                                    canvasContext.fillStyle = "rgba(27, 140, 254, 0.15)";
                                    canvasContext.fillRect(predictions[n].bbox[0], predictions[n].bbox[1], predictions[n].bbox[2], 25);
  
                                    // Bounding Box - Title Text
                                    canvasContext.font = "12px Arial";
                                    canvasContext.fillStyle = "rgb(255, 255, 255)";
                                    canvasContext.fillText(predictions[n].class
                                      // + ' - with '
                                      // + Math.round(parseFloat(predictions[n].score.toString()) * 100)
                                      // + '% confidence.'
                                      , predictions[n].bbox[0] + 5, predictions[n].bbox[1] + 15);
                                  }
                                }
                              }
                            });
                          }
                          // Call this function again to keep predicting when the browser is ready.
                          window.requestAnimationFrame(predictWebcam);
                        }
                        await predictWebcam();
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
  
      // RIP: capacitor-camera-preview not exposing a <video> element to allow processing of the feed and making snapchat clones & beyond
      const detectVideoMobile = async () => {
        console.log('Starting model!')
        const model = await cocoSsd.load();
  
        const imgShadowRoot = document.getElementById("videoFrame")?.shadowRoot
        imageElement.value = imgShadowRoot?.querySelector('img');
  
        const liveView = document.getElementById("content");
        imageElement.value.width = liveView?.offsetWidth;
        imageElement.value.height = liveView?.offsetHeight;
  
        const predictionStyles = document.createElement('style');
  
        // Getting styling into shadow-root instead of modifying highlight element's css with javascript every frame
        predictionStyles.textContent = `
                        .highlighter {
                          background: rgba(0, 255, 0, 0.25);
                          border: 1px dashed #fff;
                          z-index: 1;
                          position: absolute;
                        }
  
                        .highlighter-title {
                          position: absolute;
                          padding: 5px;
                          background-color: rgba(255, 111, 0, 0.85);
                          color: #FFF;
                          border: 1px dashed rgba(255, 255, 255, 0.7);
                          z-index: 2;
                          font-size: 12px;
                          margin: 0;
                        }`;
  
        liveView?.append(predictionStyles);
  
        // Keep a reference of all the child elements we create
        // so we can remove them easilly on each render.
        var children: any[] = [];
  
        // Prediction loop!
        const predictWebcam = async () => {
          console.log('prediction loop!')
  
          const result = await CameraPreview.captureSample({ quality: 0.85 });
          const base64PictureData = result.value;
  
          videoFrame.value = 'data:image/png;base64,' + base64PictureData;
  
          console.log(videoFrame.value);
          console.log(imageElement.value);
  
          // Acceptable Parameter Formats: tf.Tensor3D, ImageData, HTMLVideoElement, HTMLImageElement, HTMLCanvasElement
          const predictions = await model.detect(imageElement.value);
  
          entities.value = predictions;
  
          if (predictions.length) {
            console.log(predictions);
  
            // Now let's start classifying the stream.
            model.detect(imageElement.value).then(function (predictions: any) {
              // Remove any highlighting we did previous frame.
              for (let i = 0; i < children.length; i++) {
                liveView?.removeChild(children[i]);
              }
              children.splice(0);
  
              // Now lets loop through predictions and draw them to the live view if
              // they have a high confidence score.
              for (let n = 0; n < predictions.length; n++) {
                // If we are over 66% sure we are sure we classified it right, draw it!
                if (predictions[n].score > 0.66) {
                  const p = document.createElement('p')
                  p.innerText = predictions[n].class + ' - with '
                    + Math.round(parseFloat(predictions[n].score.toString()) * 100)
                    + '% confidence.';
  
                  // Draw in top left of bounding box outline.
                  p.setAttribute('class', 'highlighter-title');
                  p.style.left = predictions[n].bbox[0] + 'px';
                  p.style.top = predictions[n].bbox[1] + 'px';
                  p.style.width = (predictions[n].bbox[2] - 10) + 'px';
  
                  // Draw the actual bounding box.
                  const highlighter = document.createElement('div');
                  highlighter.setAttribute('class', 'highlighter');
                  highlighter.style.left = predictions[n].bbox[0] + 'px';
                  highlighter.style.top = predictions[n].bbox[1] + 'px';
                  highlighter.style.width = predictions[n].bbox[2] + 'px';
                  highlighter.style.height = predictions[n].bbox[3] + 'px';
  
                  liveView?.appendChild(highlighter);
                  liveView?.appendChild(p);
  
                  // Store drawn objects in memory so we can delete them next time around.
                  children.push(highlighter);
                  children.push(p);
                }
              }
            });
          }
          // Call this function again to keep predicting when the browser is ready.
          window.requestAnimationFrame(predictWebcam);
        }
        await predictWebcam();
      }
  
      // onMounted(async () => {
      //   // NOTE: Setup Model
      // })
  
      return {
        checkPlatform,
        photos,
        takePhoto,
        showActionSheet,
        camera,
        trash,
        close,
        closeOutline,
        repeat,
        entitiesCount,
        CameraPreview,
        CameraPreviewOptions,
        startCamera,
        videoFrame,
        initWorker,
        detectedText
      };
    },
  });
  </script>
  
  <style scoped>
  #entities.ios {
    margin-top: 44px;
    height: 40px;
  }
  </style>
  