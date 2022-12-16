import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import api from "./js/request/request";
import goApi from "./js/go-meedu/request";
import config from "./js/config";

import Message from "vue-m-message";
import VueAwesomeSwiper from "vue-awesome-swiper";
import "vue-m-message/dist/index.css";

import "swiper/css/swiper.css";

import utils from "./js/utils";
import VCharts from "v-charts";
import { highlight } from "vue-words-highlight";

import "@/js/remote-js.js";
// 注册指令
import "@/js/directives";
// 全局样式
import "./assets/commen/variable.less";
// 全局组件
import ThumbBar from "@/components/thumb-bar";

Vue.config.productionTip = false;

Vue.prototype.$api = api;
Vue.prototype.$goApi = new goApi(process.env.VUE_APP_GO_MEEDU_URL);
Vue.prototype.$config = config;
Vue.prototype.$utils = utils;
Vue.prototype.$message = Message;
Vue.use(VueAwesomeSwiper);
Vue.use(VCharts);
Vue.use(highlight, {
  name: "highlight",
  className: "red",
  style: "color: #ff4d4f",
  caseSensitive: false,
});
Vue.component("ThumbBar", ThumbBar);

utils.copyright();

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || "";
  if (
    // 开启强制登录
    typeof to.meta.auth !== "undefined" &&
    to.meta.auth &&
    // 本地没有token
    !utils.getToken() &&
    // URL地址中没有token
    !to.query.token
  ) {
    next({
      name: "login",
      query: {
        redirect: to.fullPath,
      },
    });
    return;
  }
  if (to.name === "login" && utils.getToken()) {
    next({
      name: "index",
    });
    return;
  }
  next();
});

router.afterEach(() => {
  window.scrollTo(0, 0);
});

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount("#app");
