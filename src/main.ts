import { createApp } from 'vue'
import App from './App.vue'
import router from './router';

/* Bootstrap for utility claseses */
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';

// NOTE: For Web Testing of the mobile camera view. Optional NODE_ENV Check is possible to maybe save resources.
import '@capacitor-community/camera-preview';

import { IonicVue } from '@ionic/vue';

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/* Theme variables */
import './theme/variables.css';
import './theme/style.css';

import { defineCustomElements } from '@ionic/pwa-elements/loader';
defineCustomElements(window);

const app = createApp(App)
  .use(IonicVue)
  .use(router);
  
router.isReady().then(() => {
  app.mount('#app');
});

// // Option to disable logging in production
// if (process.env.NODE_ENV === 'production') {
//   console.log = function () { return };
// }
