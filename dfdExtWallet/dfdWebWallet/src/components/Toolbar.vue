<template>
  <div class="toolbar-wrapper">
    <el-menu
      default-active="1"
      class="el-menu-vertical-demo"
      mode="horizontal"
      @select="handleSelect"
      style="max-width: 660px; margin: 0 auto"
    >
      <el-menu-item v-for="tab in tabs" :key="tab.key" :index="tab.key">
        <i class="el-icon-menu"></i>
        <span slot="title" v-on:click="changeToolbarTab(tab.key)">{{
          $t(tab.label)
        }}</span>
      </el-menu-item>
      <el-submenu
        v-for="tab in childrenTabs"
        :index="tab.key"
        :key="tab.key"
        v-on:click="changeToolbarTab(tab.key)"
      >
        <template slot="title">{{ $t(tab.label) }}</template>
        <el-menu-item
          v-for="subTab in tab.children"
          :key="subTab.key"
          :index="subTab.key"
          v-on:click="changeToolbarTab(subTab.key)"
        >
          {{ $t(subTab.label) }}
        </el-menu-item>
      </el-submenu>
    </el-menu>

    <!-- <el-row style="max-width: 1000px; margin: 0 auto">
      <el-col v-for="tab in tabs" :key="tab.key" :span="tab.span">
        <div
          class="dfd-toolbar-item"
          v-on:click="changeToolbarTab(tab.key)"
          v-bind:class="{ selected: selectedTab === tab.key }"
        >
          {{ $t(tab.label) }}
          <div
            class="dfd-toolbar-item-border"
            :style="{ background: 'images/toolbar-border.png' }"
          ></div>
        </div>
      </el-col>
    </el-row> -->
  </div>
</template>

<script>
import EventEmitter from "eventemitter3";
import appState from "../appState.js";

export default {
  name: "DfdToolbar",
  data() {
    return {
      selectedTab: appState.getCurrentTab(),
      tabs: [
        { label: "toolbar.my_wallet", key: "my_wallet", span: 4 },
        { label: "toolbar.create_wallet", key: "create_wallet", span: 4 },
        { label: "toolbar.transfer", key: "transfer", span: 4 },
        {
          label: "toolbar.contract",
          key: "contract",
          span: 4,
        },
        { label: "toolbar.check_tx", key: "check_tx", span: 4 },
        // {label: 'toolbar.sign_raw', key: 'sign_raw', span: 4},
      ],
      childrenTabs: [
        // {
        //   label: "toolbar.contract",
        //   key: "contract",
        //   span: 4,
        //   children: [
        //     { label: "toolbar.contract_deploy", key: "contract_deploy" },
        //     { label: "toolbar.contract_invoke", key: "contract_invoke" },
        //     { label: "toolbar.contract_transfer", key: "contract_transfer" },
        //   ],
        // },
      ],
    };
  },
  methods: {
    changeToolbarTab(tabKey) {
      this.selectedTab = tabKey;
      appState.changeCurrentTab(this.selectedTab);
      if (tabKey.indexOf("contract_") === 0) {
        appState.changeCurrentTab("contract", [
          tabKey.substring("contract_".length),
        ]);
      }
    },
    handleSelect(tabKey) {
      this.changeToolbarTab(tabKey);
    },
  },
};
</script>

<style lang="less" scoped>
.toolbar-wrapper {
  height: 58pt;
  line-height: 56pt;
  font-size: 8pt;
  background: white;

  // position: absolute;
  // left: 0;
  // bottom: 0;
  // right: 0;
  // margin-bottom: 0;

  .dfd-toolbar-item {
    margin: 0 auto;
  }
  .dfd-toolbar-item:hover {
    cursor: pointer;
    background: #ecf6ff;
  }
  .dfd-toolbar-item.selected {
    .dfd-toolbar-item-border {
      width: 20pt;
      height: 2pt;
      background-repeat: no-repeat;
      margin: 0 auto;
    }
  }
}
</style>
