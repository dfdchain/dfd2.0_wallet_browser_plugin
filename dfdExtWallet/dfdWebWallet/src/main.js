import Vue from 'vue'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';

window.Vue = Vue;
Vue.use(ElementUI);

import VueI18n from "vue-i18n";
import messages from "./translations";
import appState from "./appState";

const i18n = new VueI18n({
  locale: appState.getCurrentLanguage(),
  fallbackLocale: 'english',
  messages, // set locale messages
});

Vue.use(VueI18n);

// appState.onChangeCurrentLanguage((lang) => {
//   console.log("changed lang to ", lang);
//   i18n.locale = lang;
// });

window.dfdAppState = appState;

import App from './App.vue'
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-vue/dist/bootstrap-vue.css"

import store from './store'

const app = new Vue({
  i18n,
  store,
  el: '#app',
  render: h => h(App)
})

if (window.applicationCache) {
  window.addEventListener('load', function (e) {

    var appCache = window.applicationCache;

    appCache.update(); // Attempt to update the user's cache.

    if (appCache.status == window.applicationCache.UPDATEREADY) {
      appCache.swapCache();  // The fetch was successful, swap in the new cache.
    }

    window.applicationCache.addEventListener('updateready', function (e) {
      console.log('update ready')
      if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
        // Browser downloaded a new app cache.
        // Swap it in and reload the page to get the new hotness.
        window.applicationCache.swapCache();
        if (confirm('A new version of this site is available. Load it?')) {
          window.location.reload();
        }
      } else {
        // Manifest didn't changed. Nothing new to server.
      }
    }, false);

  }, false);
}
