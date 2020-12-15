<template>
  <div class="header-wrapper">
    <el-row style="max-width: 1000px; margin: 0 auto;">
      <el-col :span="8">
        <div class="grid-content">
          <a href="#" target="_blank"><img :src="'images/logo.png'" class="header-logo" style="margin-left: 10px;" alt /></a>
        </div>
      </el-col>
      <el-col :span="16" style="text-align: right;">
        <div class="grid-content">
          <div class="el-select network-select dfd-select" style="font-size: 16px;">
            <span style="color: white;">Status &nbsp;</span>
            <span v-if="connected" class="el-icon-check" style="color: #67C23A;"></span>
            <span v-if="!connected" class="el-icon-close" style="color: #F56C6C;"></span>
          </div>
          <el-select
            v-model="network"
            @change="onChangeNetwork"
            placeholder="Network"
            class="network-select dfd-select"
          >
            <el-option
              v-for="item in getNetworkList()"
              :key="item.key"
              :label="item.name"
              :value="item.key"
            ></el-option>
            <el-option label="Customize" value="customize"></el-option>
          </el-select>
          <el-select
            v-model="language"
            @change="onChangeLang"
            placeholder="Language"
            class="language-select dfd-select"
          >
            <el-option label="English" value="english"></el-option>
            <el-option label="中文" value="chinese"></el-option>
            <el-option v-if="false" label="한국어" value="korea"></el-option>
            <el-option v-if="false" label="日本語" value="japan"></el-option>
          </el-select>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import EventEmitter from "eventemitter3";
import appState from "../appState.js";

export default {
  name: "PageHeader",
  data() {
    return {
      network: appState.getCurrentNetwork(),
      language: appState.getCurrentLanguage(),
      connected: false,
      connectCheckInterval: null
    };
  },
  mounted() {
    this.connectCheckInterval = setInterval(() => {
      const nodeClient = appState.getNodeClient();
      nodeClient.execDbApi("get_block", 1).then( // get_sync_mode_network_info
        data => {
          console.log(data); // show block height
          this.connected = true;
          
        },
        err => {
          console.log(err);
          this.connected = false;
        }
      );
    }, 3000);
  },
  beforeDestroy() {
    if (this.connectCheckInterval) {
      clearInterval(this.connectCheckInterval);
      this.connectCheckInterval = null;
    }
  },
  methods: {
    onChangeNetwork(network) {
      if (network === "customize") {
        console.log("customize");
        // 进入自定义network界面
        appState.changeCurrentTab("customize_network");
        return;
      }
      this.network = network;
      appState.changeCurrentNetwork(this.network);
    },
    onChangeLang(lang) {
      this.language = lang;
      appState.changeCurrentLanguage(this.language);
      if (this.$i18n) {
        this.$i18n.locale = lang;
      }
    },
    getNetworkList() {
      return appState.getNetworkList();
    }
  }
};
</script>

<style lang="less">
.header-wrapper {
  height: 29pt;
  line-height: 29pt;
  background: linear-gradient(#F56C6C, #F56C60);
  .header-logo {
    // width: 103pt;
    width: 20pt;
    height: 20pt;
    margin-top: 4pt;
    margin-right: 5px;
    display: inline-block;
    float: left;
  }
}
li.el-select-dropdown__item {
  display: block;
  height: 19pt;
  line-height: 19pt;
  margin: 0;
}
li.el-select-dropdown__item.selected {
  background: #308ce5;
  color: white;
}
.dfd-select {
  font-size: 8pt;
  .el-input__inner {
    padding: 0 10px;
    background: rgba(0, 0, 0, 0);
    border: 0;
    color: white;
  }
}
.network-select {
  width: 65pt;
}
.language-select {
  width: 65pt;
}
.el-select-dropdown {
  top: 32px;
}

.chrome-ext-app-container {
  .header-wrapper .header-logo {
    margin-left: 20px;
  }
}
</style>
