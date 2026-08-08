import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import { pyrpc } from "./pyrpc";

const app = createApp(App);
app.use(pyrpc.plugin);
app.mount("#app");
