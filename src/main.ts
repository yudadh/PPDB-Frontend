import { createApp } from 'vue'
// import './style.css'
import App from './App.vue'
import PrimeVue from "primevue/config"
import Aura from "@primevue/themes/aura"
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import { Tooltip } from 'primevue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import router from './router';

import '@/assets/styles.scss';
import '@/assets/tailwind.css';


const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.app-dark'
        }
    }
})
app.use(router)
app.use(pinia)
app.use(ToastService);
app.use(ConfirmationService);
app.directive('tooltip', Tooltip)
app.mount('#app')
