import { createApp, nextTick } from "vue";
import App from "./App.vue";
import router from "./router";

let app = createApp(App);
app.use(router);
app.mount("#app");
