import { createApp } from 'vue/dist/vue.esm-bundler';

import { createRouter, createWebHashHistory } from "vue-router";
import Home from "./views/Home.vue";
const About = { template: '<div>About</div>' }
const routes = [
    {
      path: "/",
      name: "Home",
      component: Home,
  
      children: []
    },
    { path: '/about', name: "About", component: About },
];


const router = createRouter({
    history: createWebHashHistory(),
    routes,
    linkActiveClass: "active",
});
  
export default router;
  