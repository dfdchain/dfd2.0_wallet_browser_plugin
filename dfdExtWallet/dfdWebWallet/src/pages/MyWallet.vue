<template>
  <div>
    <!-- when need to unlock account -->
    <div v-if="!opened">
      <div class="dfd-main-container dfd-my-wallet-container">
        <el-form
          :model="unlockWalletForm"
          status-icon
          ref="unlockWalletForm"
          label-width="100pt"
          class="dfd-my-wallet-inner-container"
        >
          <el-form-item v-bind:label="$t('myWalletPage.select_wallet')" prop="keystoreFile">
            <KeystoreInput
              @select-file="onSelectKeystoreFile"
              :filename="unlockWalletForm.keystoreFile"
            ></KeystoreInput>
          </el-form-item>
          <el-form-item
            v-bind:label="$t('myWalletPage.please_input_wallet_password')"
            prop="password"
          >
            <el-input
              v-bind:placeholder="$t('myWalletPage.please_input_wallet_password')"
              type="password"
              v-model="unlockWalletForm.password"
              style="width: 100pt;"
            ></el-input>
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              class="-unlock-keystore-file-btn"
              v-on:click="toUnlockKeystoreFile"
            >{{$t('myWalletPage.unlock_right_now')}}</el-button>
          </el-form-item>
          <el-form-item
            v-if="walletJsonAccounts && unlockWalletForm.walletAccountsToSelect"
            label="Account"
          >
            <el-select
              v-model="unlockWalletForm.selectedWalletAccount"
              placeholder="Select Account"
            >
              <el-option
                v-for="item in walletJsonAccounts"
                :key="item.addr"
                :label="item.address"
                :value="item"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item
            v-if="walletJsonAccounts && unlockWalletForm.walletAccountsToSelect && unlockWalletForm.selectedWalletAccount"
          >
            <el-button
              type="primary"
              class="-unlock-keystore-file-btn"
              v-on:click="toOpenWalletAfterSelectWalletAccount"
            >Open</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- TODO: use AccountInfo component -->
    <!-- when account opened -->
    <div v-if="opened">
      <div class="dfd-main-container dfd-my-opened-wallet-container1">
        <el-row class="-address-row">
          <el-col :span="4">
            <div class="grid-content label-font">{{$t('myWalletPage.my_address')}}</div>
          </el-col>
          <el-col :span="8" class="-current-address-panel">
            <div class="grid-content label-font">
              <div>{{currentAddress}}</div>
            </div>
          </el-col>
          <el-col :span="4" class="-current-account-name-label-panel">
            <div class="grid-content label-font" v-if="false">{{$t('myWalletPage.account_name')}}</div>
          </el-col>
          <el-col :span="8" class="-account-name-and-change-wallet-panel">
            <div class="grid-content label-font" style="text-align: left;" v-if="false">
              <div v-if="currentAccountInfo.name">{{currentAccountInfo.name}}</div>
              <div
                v-if="!currentAccountInfo.name"
                class="-not-registered-account-btn"
                v-on:click="toRegisterAccount()"
              >{{$t('myWalletPage.not_registered')}}</div>
              <span
                style="color: #A64EB5; float: right; margin-top: -18px; margin-right: 30px;"
                v-on:click="opened=false"
              >{{$t('myWalletPage.change_wallet')}}</span>
            </div>
          </el-col>
        </el-row>
        <AccountBalancesSidebar
          style="margin-top: 20px;"
          :accountBalances="currentAccountBalances"
          :accountTokenBalances="currentAccountTokenBalances"
          :defaultLimit="showAccountBalancesLimit"
          :isMyWallet="true"
        ></AccountBalancesSidebar>
      </div>
      <AccountLockBalancesPanel
        v-if="currentAccountInfo && currentAccountInfo.name"
        :currentAccount="currentAccount"
        :accountName="currentAccountInfo.name"
        :myself="true"
        @balance-update="toUpdateAccountBalances"
      ></AccountLockBalancesPanel>
      <div class="dfd-main-container dfd-my-opened-wallet-container2" style="display: none;">TODO</div>
      <div class="dfd-panel" style="height: 60px; padding: 10px; margin-bottom: 50px;">
        <el-button
          type="primary"
          class="-ctrl-btn dfdwallet-form-btn"
          @click="logoutMyWallet"
          size="small"
        >{{$t('Logout')}}</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import _ from "lodash";
import { mapState } from "vuex";
import appState from "../appState";
import KeystoreInput from "../components/KeystoreInput.vue";
import AccountBalancesSidebar from "../components/AccountBalancesSidebar.vue";
import AccountLockBalancesPanel from "../components/AccountLockBalancesPanel.vue";
import utils from "../utils";
import tokenRpc from "../rpc/token";

let {
  PrivateKey,
  key,
  TransactionBuilder,
  TransactionHelper,
  WalletAccountUtil
} = dfd_js;

export default {
  name: "DfdMyWallet",
  components: {
    KeystoreInput,
    AccountBalancesSidebar,
    AccountLockBalancesPanel
  },
  data() {
    return {
      opened: false,
      currentAddress: "",
      currentAccount: "",
      hideZeroAssets: false,
      showAccountBalancesLimit: 5,
      currentAccountBalances: [
        {
          assetId: "1.3.0",
          assetSymbol: "DFD",
          amountNu: new BigNumber(0),
          amount: 0
        }
      ],
      currentAccountTokenBalances: [],
      currentAccountInfo: {},

      unlockWalletForm: {
        keystoreFile: null,
        keystoreFileInput: null,
        keystoreFileJson: null,
        password: "",
        walletAccountsToSelect: false
      },
      walletJsonAccounts: []
    };
  },
  created() {
    let account = appState.getCurrentAccount();
    this.currentAccount = account;
    if (account) {
      this.opened = true;
      this.currentAddress = account.address;
      this.loadCurrentAccountInfo();
    } else {
      this.opened = false;
    }
  },
  computed: {},
  mounted() {
    appState.onChangeCurrentAccount(this.onChangeCurrentAccount);
  },
  beforeDestroy() {
    appState.offChangeCurrentAccount(this.onChangeCurrentAccount);
  },
  methods: {
    showError(e) {
      e = utils.getShowErrorMessage(e, this.$t.bind(this));
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
    showWarning(info) {
      this.$message({
        showClose: true,
        message: (info || "warning").toString(),
        type: "warning"
      });
    },
    showAllBalances() {
      this.showAccountBalancesLimit = null;
    },
    toUpdateAccountBalances() {
      this.loadCurrentAccountInfo();
    },
    loadCurrentAccountInfo() {
      if (!this.currentAccount) {
        return;
      }

      this.$store
        .dispatch("account/getAccountInfo", this.currentAccount.address)
        .then(accountInfo => {
          console.log("accountInfo from vuex is", accountInfo);
          this.$nextTick(() => {
            if (accountInfo) {
              this.currentAccountInfo = accountInfo;
            } else {
              this.currentAccountInfo = {};
            }
          });
        })
        .catch(this.showError);

      this.$store
        .dispatch("account/getAddressBalances", this.currentAccount.address)
        .then(accountBalances => {
          console.log("accountBalances from vuex is", accountBalances);
          this.$nextTick(() => {
            this.currentAccountBalances = accountBalances;
          });
        })
        .catch(this.showError);

      // load user token balances
      if (appState.getCurrentNetwork() === "mainnet") {
        this.$store
          .dispatch("account/getAddressTokenBalances", this.currentAddress)
          .then(tokenBalances => {
            console.log("listUserTokenBalances", tokenBalances);
            this.currentAccountTokenBalances = tokenBalances;
          })
          .catch(this.showError);
      }
    },
    onChangeCurrentAccount(account) {
      this.currentAccount = account;
      this.currentAddress = account.address;
    },
    updateCurrentAccountBalances(balances) {
      this.currentAccountBalances = balances;
    },
    filterBalances(balances, skipZero = false, limit = null) {
      let filtered = balances;
      if (skipZero) {
        filtered = balances.filter(item => item.amount > 0);
      }
      if (limit) {
        filtered = filtered.slice(0, limit);
      }
      return filtered;
    },
    toRegisterAccount() {
      appState.changeCurrentTab("register_account");
    },
    onSelectKeystoreFile(fileJson, filename, isWalletJson) {
      this.unlockWalletForm.keystoreFileJson = fileJson;
      this.unlockWalletForm.keystoreFile = filename;
      this.unlockWalletForm.isWalletJson = isWalletJson;
    },
    logoutMyWallet() {
      appState.changeCurrentAccount(null);
      this.currentAccount = "";
      this.currentAccountInfo = {};
      try {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("keyInfo", "");
          localStorage.setItem("keyPassword", "");
        }
      } catch (e) {
        console.log(e);
      }
      try {
        if (typeof chrome !== "undefined" && chrome.storage) {
          chrome.storage.local.set({ keyInfo: null }, function() {
            console.log("Value is set to " + keyInfo);
          });
          messageToBackground("newWallet", "false");
        }
      } catch (e) {
        console.log(e);
      }
    },
    toOpenWalletAfterSelectWalletAccount() {
      const account = this.unlockWalletForm.selectedWalletAccount;
      if (!account) {
        this.showError("please select account");
        return;
      }
      try {
        const password = this.unlockWalletForm.password || "";
        const keyInfo = account.toKey(password);
        appState.changeCurrentAccount(account);
        this.currentAccount = account;
        this.loadCurrentAccountInfo();
        // save to storage
        try {
          if (typeof localStorage !== "undefined") {
            localStorage.setItem("keyInfo", JSON.stringify(keyInfo));
            localStorage.setItem("keyPassword", password);
          }
        } catch (e) {
          console.log(e);
        }
        try {
          if (typeof chrome !== "undefined" && chrome.storage) {
            chrome.storage.local.set({ keyInfo: keyInfo }, function() {
              console.log("Value is set to " + keyInfo);
            });
            messageToBackground("newWallet", "false");
          }
        } catch (e) {
          console.log(e);
        }
        this.showSuccess(this.$t("dialogs.unlock_successfully"));
        this.opened = true;
      } catch (e) {
        this.showError(e);
      }
    },
    toUnlockKeystoreFile() {
      if (!this.unlockWalletForm.keystoreFileJson) {
        this.showError(this.$t("keystoreInput.please_open_locked_file"));
        return;
      }
      this.unlockWalletForm.password = this.unlockWalletForm.password.trim();
      if (
        this.unlockWalletForm.password.length < 8 ||
        this.unlockWalletForm.password.length > 30
      ) {
        this.showError(this.$t("keystoreInput.wallet_password_length_invalid"));
        return;
      }
      let fileJson = this.unlockWalletForm.keystoreFileJson;
      let password = this.unlockWalletForm.password;
      try {
        let account;
        if (this.unlockWalletForm.isWalletJson) {
          const wallet = WalletAccountUtil.decodeWalletJson(fileJson, password);
          if (!wallet.my_accounts || wallet.my_accounts.length < 1) {
            throw new Error("Can't find dfd account");
          }
          this.walletJsonAccounts.length = 0;
          for (const walletAccount of wallet.my_accounts) {
            if (!walletAccount.privateKey) {
              continue;
            }
            let account = account_utils.NewAccount();
            account.setPrivateKey(walletAccount.privateKey.toBuffer());
            account.address = null;
            let address = account.getAddressString(appState.getAddressPrefix());
            account.address = address;
            this.walletJsonAccounts.push(account);
          }
          if (wallet.my_accounts.length < 1) {
            throw new Error("Can't find dfd account");
          }
          if (this.walletJsonAccounts.length > 0) {
            this.unlockWalletForm.walletAccountsToSelect = true;
            // then select from wallet.json accounts
            return;
          } else {
            account = this.walletJsonAccounts[0];
          }
        } else {
          account = account_utils.NewAccount();
          account.fromKey(fileJson, password);
          account.address = null;
          let address = account.getAddressString(appState.getAddressPrefix());
          account.address = address;
        }
        appState.changeCurrentAccount(account);
        this.currentAccount = account;
        this.loadCurrentAccountInfo();
        // save to storage
        try {
          if (typeof localStorage !== "undefined") {
            localStorage.setItem("keyInfo", JSON.stringify(fileJson));
            localStorage.setItem("keyPassword", password);
          }
        } catch (e) {
          console.log(e);
        }
        try {
          if (typeof chrome !== "undefined" && chrome.storage) {
            chrome.storage.local.set({ keyInfo: fileJson }, function() {
              console.log("Value is set to " + valueJson);
            });
            messageToBackground("newWallet", "false");
          }
        } catch (e) {
          console.log(e);
        }
        this.showSuccess(this.$t("dialogs.unlock_successfully"));
        this.opened = true;
      } catch (e) {
        this.showError(e);
      }
    }
  }
};
</script>

<style lang="less">
.dfd-my-opened-wallet-container1 {
  .label-font {
    color: #a99eb4;
    font-size: 8pt;
  }
  .-asset-symbol-label {
    color: #a99eb4;
    font-size: 7pt;
  }
  .-asset-amount-label {
    color: #261932;
    font-size: 12pt;
    padding-top: 4pt;
    overflow-x: hidden;
    padding-left: 2px;
    padding-right: 2px;
  }
  .-address-row {
    padding-bottom: 10px;
    border-bottom: solid 1px #f3f3f3;
  }
  .-balance-label-row {
    padding-top: 10px;
    padding-bottom: 20px;
  }
  .-account-balance {
    width: 20% !important;
  }
  .-not-registered-account-btn {
    color: #308ce5;
    font-size: 8pt;
    cursor: pointer;
  }
  .dfd-account-balances-side-bar {
    .-balance-title-panel {
      text-align: left;
      padding-left: 50pt;
    }
    .-switch-panel {
      text-align: right;
      padding-right: 50pt;
    }
  }
}
.dfd-my-opened-wallet-container2 {
  .label-font {
    color: #a99eb4;
    font-size: 8pt;
  }
}
.dfd-my-wallet-container {
  min-width: 400px;
  min-height: 266pt;
}
.dfd-my-wallet-inner-container {
  width: 400pt;
  margin: 0 auto;
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
  .-selectKeyStoreFile {
    cursor: pointer;
  }
  .-unlock-keystore-file-btn {
    width: 150pt;
    height: 30pt;
    color: white;
    font-size: 10pt;
    background: linear-gradient(#F56C6C, #F56C60);
    border: 0;
    border-radius: 0;
    margin-left: -80pt;
  }
}
@media (max-width: 600px) {
  .dfd-my-opened-wallet-container1 {
    .-current-address-panel {
      width: 60%;
    }
    .-current-account-name-label-panel {
      width: 30%;
      text-align: left;
      padding-left: 10pt;
      padding-top: 10pt;
    }
    .-account-name-and-change-wallet-panel {
      width: 55%;
      padding-top: 10pt;
    }
  }
  .dfd-my-opened-wallet-container2 {
  }
}

.chrome-ext-app-container {
  .dfd-my-wallet-inner-container {
    width: auto;
  }
}
</style>
