<template>
  <div>
    <div v-if="!created" class="dfd-main-container dfd-create-wallet-container">
      <div class="-create-wallet-title">{{$t('createWalletPage.title')}}</div>
      <el-form
        :model="createWalletForm"
        status-icon
        ref="createWalletForm"
        label-width="100pt"
        class="dfd-create-wallet-inner-container"
      >
        <el-form-item v-bind:label="$t('createWalletPage.set_wallet_password')" class="-password-panel" prop="password">
          <el-input
            class="-input-password"
            v-bind:placeholder="$t('createWalletPage.please_set_password')"
            type="password"
            v-model="createWalletForm.password"
            autocomplete="off"
            style="width: 100pt;"
          ></el-input>
          <div class="-wallet-password-rule-desc -rule-panel">
            <p style="height: auto;">{{$t('createWalletPage.please_save_wallet_file_line1')}}</p>
            <p>{{$t('createWalletPage.passworld_length_notice')}}</p>
          </div>
        </el-form-item>
        <el-form-item v-if="false" :label="$t('createWalletPage.import_mnemonic')">
          <el-input
            class="-input-password"
            v-bind:placeholder="$t('createWalletPage.import_mnemonic_placeholder')"
            type="textarea"
            v-model="createWalletForm.importMnemonic"
            autocomplete="off"
            style="width: 220pt;"
          ></el-input>
        </el-form-item>
        <el-form-item label="Export ETH private key"
          v-if="showExportEthPrivateKeyForm">
          <el-button 
            type="primary"
            class="dfdwallet-form-btn"
            v-on:click="exportEthPrivateKey"
            style="margin-left: -80pt;">Export ETH private key</el-button>
          <div v-if="exportedEthPrivateKey">
            <span>Exported ETH private key</span>
            <p>{{exportedEthPrivateKey}}</p>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            class="dfdwallet-form-btn"
            v-on:click="createWallet"
            style="margin-left: -80pt;"
          >{{$t('createWalletPage.next_step')}}</el-button>
        </el-form-item>
      </el-form>
    </div>
    <!-- when wallet created -->
    <div v-if="created" class="dfd-main-container dfd-create-wallet-container">
      <div class="-create-wallet-title">{{$t('createWalletPage.now_please_download_wallet_keystore_file')}}</div>
      <div>
        <div class="dfd-create-wallet-done-inner-container">
          <div style="margin-bottom: 5pt;">
            <el-button
              type="primary"
              class="dfdwallet-form-btn"
              v-on:click="downloadKeystoreFile"
            >{{$t('createWalletPage.download_wallet_keystore_file')}}</el-button>
          </div>
          <div class="-rule-panel" style="text-align: center; margin-bottom: 30pt;">
            <p>{{$t('createWalletPage.password_is_to_protect_your_private_keys_please_save_it')}}</p>
            <p>{{$t('createWalletPage.wallet_file_is_to_get_your_assets_please_save_it')}}</p>
          </div>
          <div v-if="false">
            <el-button
              type="primary"
              class="dfdwallet-form-btn"
              v-on:click="openKeystoreWallet"
            >{{$t('createWalletPage.open_wallet_right_now')}}</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import _ from "lodash";
import appState from "../appState";
import * as bip39 from 'bip39';
import { hdkey } from 'ethereumjs-wallet';
import utils from '../utils';
let { PrivateKey, key, TransactionBuilder, TransactionHelper } = dfd_js;

export default {
  name: "CreateWallet",
  data() {
    const showExportEthPrivateKeyForm = window.location.href.indexOf('export_eth')>=0
    return {
      created: false,
      createdAccount: null,
      createdAccountKeyString: null,
      createWalletForm: {},
      importMnemonic: null,
      showExportEthPrivateKeyForm,
      exportedEthPrivateKey: null,
    };
  },
  created() {},
  methods: {
    showError(e) {
      e = utils.getShowErrorMessage(e);
      this.$message({
        showClose: true,
        message: e,
        type: "error"
      });
    },
    showInfo(info) {
      this.$message({
        showClose: true,
        message: (info || "info").toString()
      });
    },
    showSuccess(info) {
      this.$message({
        showClose: true,
        message: (info || "success").toString(),
        type: "success"
      });
    },
    exportEthPrivateKey() {
      if(this.createWalletForm.importMnemonic && this.createWalletForm.importMnemonic.trim()) {
        // import from mnemonic
        const importMnemonic = this.createWalletForm.importMnemonic.trim();
        if(!bip39.validateMnemonic(importMnemonic)) {
          console.log('invalid mnemonic');
          this.showError('Invalid mnemonic');
          this.hasError = true;
          this.created = false;
          return;
        }
        const seed = bip39.mnemonicToSeedSync(importMnemonic); // .toString('hex');
        // console.log(`seed: ${seed.toString('hex')}`);
        // seed to private key
        const path = "m/5"; // eth path

        const hdwallet = hdkey.fromMasterSeed(seed);
        const wallet = hdwallet.derivePath(path).getWallet();
        let privKeyStr = wallet.getPrivateKeyString();
        this.exportedEthPrivateKey = privKeyStr
      }
    },
    createWallet() {
      this.hasError = false;
      let password = (this.createWalletForm.password || "").trim();
      if (password.length < 8 || password.length > 30) {
        this.showError(this.$t("createWalletPage.invalid_password_length"));
        this.hasError = true;
        this.created = false;
        return;
      }
      this.created = true;
      let account;
      if(this.createWalletForm.importMnemonic && this.createWalletForm.importMnemonic.trim()) {
        // import from mnemonic
        const importMnemonic = this.createWalletForm.importMnemonic.trim();
        if(!bip39.validateMnemonic(importMnemonic)) {
          console.log('invalid mnemonic');
          this.showError('Invalid mnemonic');
          this.hasError = true;
          this.created = false;
          return;
        }
        const seed = bip39.mnemonicToSeedSync(importMnemonic); // .toString('hex');
        // console.log(`seed: ${seed.toString('hex')}`);
        // seed to private key
        const path = "m/44'/999'/0/0/0"; // m / 44' / 999' / account / 0 / addrIndex

        const hdwallet = hdkey.fromMasterSeed(seed);
        const wallet = hdwallet.derivePath(path).getWallet();
        let privKeyStr = wallet.getPrivateKeyString();
        if(privKeyStr.indexOf('0x') === 0) {
          privKeyStr = privKeyStr.substring(2);
        }
        // console.log(`privKeyStr: ${privKeyStr}`);
        account = account_utils.NewAccount();
        account.setPrivateKey(privKeyStr);
      } else {
        account = account_utils.NewAccount();
      }
      this.createdAccount = account;
      account.address = null;
      let address = account.getAddressString(appState.getAddressPrefix());
      let keyStr = account.toKeyString(password);
      this.createdAccountKeyString = keyStr;
    },
    downloadKeystoreFile() {
      let account = this.createdAccount;
      let address = account.address;
      let keyStr = this.createdAccountKeyString;
      let blob = new Blob([keyStr], {
        type: "application/json; charset=utf-8"
      });
      //saveAs(blob, address);
      let i = window.document.createElement("a");
      (i.target = "_blank"), (i.href = window.URL.createObjectURL(blob));
      i.download = address;
      document.body.appendChild(i);
      i.click();
      document.body.removeChild(i);
      this.showInfo(this.$t("createWalletPage.find_wallet_file_in_download_directory"));
    },
    openKeystoreWallet() {
      appState.changeCurrentAccount(this.createdAccount);
      appState.changeCurrentTab("my_wallet");
    }
  }
};
</script>

<style lang="less">
.dfd-create-wallet-container1 {
  .label-font {
    color: #a99eb4;
    font-size: 8pt;
  }
}
.dfd-create-wallet-container2 {
  .label-font {
    color: #a99eb4;
    font-size: 8pt;
  }
}
.dfd-create-wallet-container {
  min-width: 400px;
  min-height: 266pt;
}
.dfd-create-wallet-inner-container,
.dfd-create-wallet-done-inner-container {
  width: 400pt;
  margin: 20pt auto 0 auto;
  label {
    font-size: 10pt;
    color: #261932;
  }
  .el-input {
    width: 220pt !important;
  }
  .el-input__inner {
    border: 0 !important;
    border-bottom: solid 1px #cccccc !important;
    border-radius: 0 !important;
  }
  .-create-wallet-title {
    font-size: 20pt;
    color: #261932;
  }
  .-wallet-password-rule-desc,
  .-rule-panel {
    font-size: 8pt;
    color: #ff0000;
    margin-top: 10pt;
    margin-left: 50pt;
    text-align: left;
    p {
      padding: 0;
      margin: 4px;
      line-height: 18px;
      height: 18px;
    }
  }
}
@media (max-width: 600px) {
  .dfd-create-wallet-container {
    .dfd-create-wallet-inner-container {
      width: 400px;
      .-password-panel {
        .el-form-item__label {
          width: 60pt;
        }
      }
      .-wallet-password-rule-desc {
        margin-left: 20px;
      }
    }
  }
}

.chrome-ext-app-container {
  .dfd-create-wallet-container {
  }
  .dfd-create-wallet-inner-container {
    width: auto;
  }
}
</style>
