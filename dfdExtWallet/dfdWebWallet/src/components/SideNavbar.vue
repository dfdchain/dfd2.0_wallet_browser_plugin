<template>
  <div class="dfd-nav-side">
    <div
      class="dfd-nav-item"
      v-if="items"
      v-for="item in items"
      :key="item.key"
      :class="{selected: item.key===selectedKey}"
      @click="onSelectItem(item)"
    >
      <div class="-item-text">{{$t(item.label)}}</div>
    </div>
    <div class="clearfix"></div>
  </div>
</template>

<script>
import _ from "lodash";
import { format, distanceInWordsToNow } from "date-fns";
import appState from "../appState";
import utils from "../utils";
let { PrivateKey, key, TransactionBuilder, TransactionHelper } = dfd_js;
window.datefns = require("date-fns");

export default {
  name: "SideNavbar",
  props: ["items", "selectedKey"],
  components: {},
  data() {
    return {};
  },
  created() {},
  watch: {},
  mounted() {},
  beforeDestroy() {},
  methods: {
      onSelectItem(item) {
          this.$emit('select-item', item);
      }
  }
};
</script>

<style lang="less" scoped>
.dfd-nav-side {
  background: white;
  .dfd-nav-item {
    border-top: solid 1px #f6f6f6;
    height: 24pt;
    line-height: 24pt;
    color: #333333;
    font-size: 8pt;
    text-align: left;
    .-item-text {
      height: 16pt;
      line-height: 16pt;
      padding-left: 15pt;
      margin: 4pt 0;
      border-left: solid 2pt white;
    }
  }
  .dfd-nav-item:hover {
      cursor: pointer;
  }
  .dfd-nav-item:first {
    border-top: 0;
  }
  .dfd-nav-item.selected {
    .-item-text {
      border-left: solid 2pt #867afc;
    }
  }
}
</style>
