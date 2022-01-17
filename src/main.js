import { createApp, nextTick } from "vue";
import App from "./App.vue";
import router from "./router";
import wasm from "./plugins/wasm";

let app = createApp(App);
app.use(router);
app.use(wasm)
app.mount("#app");

