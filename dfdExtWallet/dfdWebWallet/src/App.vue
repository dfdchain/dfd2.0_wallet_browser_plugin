<template>
  <div id="app">
    <PageHeader></PageHeader>

    <el-row class="tac">
      <el-col :span="24">
        <DfdToolbar></DfdToolbar>
      </el-col>
    </el-row>
    <div>
      <DfdMyWallet v-if="currentTabKey === 'my_wallet'"></DfdMyWallet>
      <CreateWallet v-if="currentTabKey === 'create_wallet'"></CreateWallet>
      <RegisterAccount
        v-if="currentTabKey === 'register_account'"
      ></RegisterAccount>
      <Transfer v-if="currentTabKey === 'transfer'"></Transfer>
      <CheckTx v-if="currentTabKey === 'check_tx'"></CheckTx>
      <SignRaw v-if="currentTabKey === 'sign_raw'"></SignRaw>
      <Contract v-if="currentTabKey === 'contract'"></Contract>
      <CustomizeNetwork
        v-if="currentTabKey === 'customize_network'"
      ></CustomizeNetwork>
    </div>

    <!-- <div class="dfd-footer-bar">
      <div>@Copyright DFD chain</div>
    </div> -->
  </div>
</template>

<script>
import PageHeader from "./components/Header.vue";
import DfdToolbar from "./components/Toolbar.vue";
import DfdMyWallet from "./pages/MyWallet.vue";
import RegisterAccount from "./pages/RegisterAccount.vue";
import CreateWallet from "./pages/CreateWallet.vue";
import Transfer from "./pages/Transfer.vue";
import CheckTx from "./pages/CheckTx.vue";
import SignRaw from "./pages/SignRaw.vue";
import CustomizeNetwork from "./pages/CustomizeNetwork.vue";
import Contract from "./pages/Contract.vue";
import appState from "./appState.js";

export default {
  name: "app",
  components: {
    PageHeader,
    DfdToolbar,
    DfdMyWallet,
    CreateWallet,
    RegisterAccount,
    Transfer,
    CheckTx,
    SignRaw,
    CustomizeNetwork,
    Contract,
  },
  created() {
    const lastUsedNetwork = appState.getLastUsedNetwork();
    appState.changeCurrentNetwork(
      lastUsedNetwork ? lastUsedNetwork.key : "mainnet"
    );
    this.currentTabKey = appState.getCurrentTab();
  },
  mounted() {
    appState.onChangeCurrentTab(this.onChangeCurrentTab);
    appState.onConnectionClose(this.onConnectionClose);
  },
  beforeDestroy() {
    appState.offChangeCurrentTab(this.onChangeCurrentTab);
    appState.offConnectionClose(this.onConnectionClose);
  },
  data() {
    return {
      currentTabKey: appState.getCurrentTab(),
    };
  },
  methods: {
    onChangeCurrentTab(tabKey) {
      this.currentTabKey = tabKey;
    },
    onConnectionClose() {
      this.$message({
        showClose: true,
        message: "Connection Closed",
        type: "error",
      });
    },
  },
};
</script>

<style lang="less">
body::-webkit-scrollbar {
  display: none;
}

.dfd-main-container {
  max-width: 1000px;
  margin: 0 auto;
  margin-top: 8px;
  background: white;
  padding: 50px 20px;
}

.dfd-panel {
  min-width: 400px;
  max-width: 1000px;
  margin: 0 auto;
  margin-top: 8px;
  background: white;
  padding: 50px 20px;
}

#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  min-width: 400px;
  min-height: 500px;
}

.dfd-footer-bar {
  position: fixed;
  min-width: 200pt;
  text-align: center;
  color: #999999;
  font-size: 10pt;
  right: 40pt;
  padding-top: 20pt;
  bottom: 12pt;
}

h1,
h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}

.dfdwallet-form-cancel-btn {
  width: 150pt;
  height: 30pt;
  // color: white;
  font-size: 10pt;
  // background: linear-gradient(#F56C6C, #F56C60);
  border: 0;
  border-radius: 0;
}
li.el-select-dropdown__item.selected {
  background: #f56c6c !important;
}
.el-radio-button__orig-radio:checked + .el-radio-button__inner {
  background-color: #f56c6c !important;
  border-color: #f56c6c;
  -webkit-box-shadow: -1px 0 0 0 #f56c6c !important;
  box-shadow: -1px 0 0 0 #f56c6c !important;
}
.dfdwallet-form-btn {
  width: 150pt;
  height: 30pt;
  color: white;
  font-size: 10pt;
  background: linear-gradient(#f56c6c, #f56c60);
  border: 0;
  border-radius: 0;
}
.el-switch__core {
  width: 20px !important;
}
.el-switch .el-switch__core {
  border-color: #308ce5;
}
.el-switch.is-checked .el-switch__core {
  background-color: white;
  border-color: #308ce5;
}
.el-switch.is-checked .el-switch__core:after {
  background-color: #308ce5;
}

.grid-content {
  word-break: break-all;
}

.chrome-ext-app-container {
  .dfd-main-container {
    width: 500px;
  }
}
</style>
