<template>
  <div class="dfd-account-lock-balances-panel">
    <div v-show="step==='list'">
      <div class="dfd-panel" style="padding-top: 10px;">
        <div class="-panel-title">{{$t('account_lock_balances.pledge_information')}}</div>
        <div v-if="myself" class="-top-control-panel" style="text-align: center;">
          <el-button
            type="primary"
            @click="toMortgageToMiner(null, '1.3.0')"
            class="-ctrl-btn dfdwallet-form-btn"
            style="width: 80pt;"
          >{{$t('account_lock_balances.append')}}</el-button>
          <!-- TODO: 赎回全部按钮 -->
        </div>
        <div>
          <el-row style="margin-bottom: 20pt;" class="-table-header-row">
            <el-col :span="5">
              <div class="grid-content">
                <div class="label-font">{{$t('account_lock_balances.pledge_miner')}}</div>
              </div>
            </el-col>
            <el-col :span="5">
              <div class="grid-content">
                <div class="label-font">{{$t('account_lock_balances.pledge_currency')}}</div>
              </div>
            </el-col>
            <el-col :span="5">
              <div class="grid-content">
                <div class="label-font">{{$t('account_lock_balances.pledge_amount')}}</div>
              </div>
            </el-col>
            <el-col :span="9">
              <div class="grid-content">
                <div class="label-font" v-if="myself">{{$t('account_lock_balances.operations')}}</div>
              </div>
            </el-col>
          </el-row>
          <el-row class="-table-body-row" v-for="balance in accountLockBalances" :key="balance.id">
            <el-col :span="5">
              <div class="grid-content">
                <div
                  class="label-font"
                >{{minerById(balance.lockto_miner_account, balance.lockto_miner_account).name}}</div>
              </div>
            </el-col>
            <el-col :span="5">
              <div class="grid-content">
                <div class="label-font">{{assetById(balance.lock_asset_id).symbol}}</div>
              </div>
            </el-col>
            <el-col :span="5">
              <div class="grid-content">
                <div class="label-font">{{balance.lock_asset_amount_str.toString()}}</div>
              </div>
            </el-col>
            <el-col :span="9">
              <div class="grid-content">
                <div class="label-font" v-if="myself">
                  <el-button
                    type="primary"
                    @click="toMortgageToMiner(balance.lockto_miner_account, balance.lock_asset_id)"
                    class="-ctrl-btn dfdwallet-form-btn"
                  >{{$t('account_lock_balances.append')}}</el-button>
                  <el-button
                    type="primary"
                    @click="toCancelLockBalance(balance.lockto_miner_account, balance.lock_asset_id)"
                    class="-ctrl-btn dfdwallet-form-btn"
                  >{{$t('account_lock_balances.redeem')}}</el-button>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
      <!-- 质押收益和领取收益 -->
      <div class="dfd-panel" style="padding-top: 10px;">
        <div class="-panel-title">{{$t('account_lock_balances.pledge_income')}}</div>
        <div v-if="myself" class="-top-control-panel" style="text-align: center;">
          <el-button
            type="primary"
            @click="receivePayBack(accountPayBacks)"
            class="-ctrl-btn dfdwallet-form-btn"
            style="width: 80pt;"
          >{{$t('account_lock_balances.receive_all')}}</el-button>
        </div>
        <div>
          <el-row style="margin-bottom: 20pt;" class="-table-header-row">
            <el-col :span="5">
              <div class="grid-content">
                <div class="label-font">{{$t('account_lock_balances.pledge_miner')}}</div>
              </div>
            </el-col>
            <el-col :span="5">
              <div class="grid-content">
                <div class="label-font">{{$t('account_lock_balances.currency')}}</div>
              </div>
            </el-col>
            <el-col :span="5">
              <div class="grid-content">
                <div class="label-font">{{$t('account_lock_balances.income')}}</div>
              </div>
            </el-col>
            <el-col :span="9">
              <div class="grid-content">
                <div class="label-font" v-if="myself">{{$t('account_lock_balances.operations')}}</div>
              </div>
            </el-col>
          </el-row>
          <el-row
            class="-table-body-row"
            v-for="payBack in accountPayBacks"
            :key="payBack.minerName"
          >
            <el-col :span="5">
              <div class="grid-content">
                <div class="label-font">{{payBack.minerName}}</div>
              </div>
            </el-col>
            <el-col :span="5">
              <div class="grid-content">
                <div class="label-font">{{payBack.asset.symbol}}</div>
              </div>
            </el-col>
            <el-col :span="5">
              <div class="grid-content">
                <div class="label-font">{{payBack.amountBnStr}}</div>
              </div>
            </el-col>
            <el-col :span="9">
              <div class="grid-content">
                <div class="label-font" v-if="myself">
                  <el-button
                    type="primary"
                    @click="receivePayBack([payBack])"
                    class="-ctrl-btn dfdwallet-form-btn"
                  >{{$t('account_lock_balances.receive')}}</el-button>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </div>
    <div v-if="step==='mortgage'">
      <div class="dfd-panel" style="padding-top: 10px;">
        <div class="-panel-title">{{$t('account_lock_balances.pledge')}}</div>
        <div class="-simple-form-panel">
          <el-form label-width="90pt" :model="mortgageForm">
            <el-form-item
              v-bind:label="$t('account_lock_balances.pledge_miner')"
              prop="minerId"
            >
              <el-select
                class="-miner-select"
                filterable
                v-model="mortgageForm.minerId"
                v-bind:placeholder="$t('account_lock_balances.pledge_miner')"
              >
                <el-option
                  v-for="minerBase in systemMiners"
                  :key="minerBase[1]"
                  :label="minerBase[0]"
                  :value="minerBase[1]"
                ></el-option>
              </el-select>
            </el-form-item>
            <el-form-item v-bind:label="$t('account_lock_balances.pledge_currency')" prop="assetId">
              <AssetInput
                v-model="mortgageFormAmount"
                :precision="getAssetPrecisionByAssetId(mortgageForm.assetId)"
                style="width: 167pt;"
              ></AssetInput>
              <el-select
                class="-asset-select -transfer-asset-select"
                v-model="mortgageForm.assetId"
                v-bind:placeholder="$t('account_lock_balances.pledge_currency')"
              >
                <el-option
                  v-for="asset in systemAssets"
                  :key="asset.id"
                  :label="asset.symbol"
                  :value="asset.id"
                ></el-option>
              </el-select>
            </el-form-item>
            <el-form-item class="-control-panel">
              <el-button
                type="primary"
                class="dfdwallet-form-btn"
                @click="mortageToMiner"
                style="width: 100px;"
              >{{$t('account_lock_balances.pledge')}}</el-button>
              <el-button
                type="primary"
                class="dfdwallet-form-btn"
                @click="backToList"
                style="width: 100px;"
              >{{$t('account_lock_balances.back')}}</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
    <div v-if="step==='redeem'">
      <div class="dfd-panel" style="padding-top: 10px;">
        <div class="-panel-title">{{$t('account_lock_balances.redeem')}}</div>
        <div class="-simple-form-panel">
          <el-form label-width="90pt" :model="redeemForm">
            <el-form-item
              v-bind:label="$t('account_lock_balances.pledge_miner')"
              prop="minerId"
            >
              <el-select
                class="-miner-select"
                filterable
                v-model="redeemForm.minerId"
                v-bind:placeholder="$t('account_lock_balances.pledge_miner')"
              >
                <el-option
                  v-for="minerBase in systemMiners"
                  :key="minerBase[1]"
                  :label="minerBase[0]"
                  :value="minerBase[1]"
                ></el-option>
              </el-select>
            </el-form-item>
            <el-form-item v-bind:label="$t('account_lock_balances.pledge_currency')" prop="assetId">
              <AssetInput
                v-model="redeemFormAmount"
                :precision="getAssetPrecisionByAssetId(redeemForm.assetId)"
                style="width: 167pt;"
              ></AssetInput>
              <el-select
                class="-asset-select -transfer-asset-select"
                v-model="redeemForm.assetId"
                v-bind:placeholder="$t('account_lock_balances.pledge_currency')"
              >
                <el-option
                  v-for="asset in systemAssets"
                  :key="asset.id"
                  :label="asset.symbol"
                  :value="asset.id"
                ></el-option>
              </el-select>
            </el-form-item>
            <el-form-item class="-control-panel">
              <el-button
                type="primary"
                class="dfdwallet-form-btn"
                @click="redeemFromMiner"
                style="width: 100px;"
              >{{$t('account_lock_balances.redeem')}}</el-button>
              <el-button
                type="primary"
                class="dfdwallet-form-btn"
                @click="backToList"
                style="width: 100px;"
              >{{$t('account_lock_balances.back')}}</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import _ from "lodash";
import { format, distanceInWordsToNow } from "date-fns";
import appState from "../appState";
import utils from "../utils";
import AssetInput from "./AssetInput.vue";
let { PrivateKey, key, TransactionBuilder, TransactionHelper } = dfd_js;
window.datefns = require("date-fns");

export default {
  name: "AccountLockBalancesPanel",
  props: ["accountName", "currentAccount", "myself"],
  components: { AssetInput },
  data() {
    return {
      accountLockBalances: [],
      accountPayBacks: [],
      accountInfo: null,
      minersAccountCache: {},
      systemAssets: [],
      systemMiners: [],
      mortgageForm: {},
      redeemForm: {},
      step: "list" // list, mortgage, redeem
    };
  },
  created() {},
  watch: {
    accountName(newVal, oldVal) {
      this.loadLockBalances();
    }
  },
  mounted() {
    this.loadLockBalances();

    const currentTabParams = appState.getCurrentTabParams();
    if (currentTabParams && currentTabParams.length > 0) {
      if (
        currentTabParams.length >= 2 &&
        currentTabParams[0] === "locktominer"
      ) {
        const lockToMinerName = currentTabParams[1];
        const nodeClient = appState.getNodeClient();
        if (lockToMinerName) {
          appState
            .withApis()
            .then(() => {
              return nodeClient.getMiner(lockToMinerName);
            })
            .then(miner => {
              this.toMortgageToMiner(miner.id, null);
            })
            .catch(this.showError);
        } else {
          this.toMortgageToMiner(null, null);
        }
        appState.clearCurrentTabParams();
      }
    }
  },
  beforeDestroy() {},
  methods: {
    minerById(minerId, defaultName) {
      return this.minersAccountCache[minerId] || { name: defaultName };
    },
    assetById(assetId) {
      for (const asset of this.systemAssets) {
        if (asset.id === assetId) {
          return asset;
        }
      }
      return {};
    },
    getAssetPrecisionByAssetId(assetId) {
      return appState.getAssetPrecisionByAssetId(assetId);
    },
    loadSystemMiners() {
      const nodeClient = appState.getNodeClient();
      appState
        .withApis()
        .then(() => {
          return nodeClient.getMinersCount();
        })
        .then(minersCount => {
          return nodeClient.listMiners("", minersCount);
        })
        .then(miners => {
          this.systemMiners = miners;
        })
        .catch(this.showError);
    },
    toMortgageToMiner(selectedMinerId, assetId) {
      if (this.systemMiners.length < 1) {
        this.loadSystemMiners();
      }
      this.mortgageForm = {
        amount: "",
        minerId: selectedMinerId,
        assetId: assetId
      };
      this.mortgageFormAmount = "";
      this.step = "mortgage";
    },
    receivePayBack(payBacks) {
      if (!this.currentAccount || !this.accountInfo) {
        this.showError("you can only control your own wallet");
        return;
      }
      if (!payBacks) {
        this.showError("Please select at least one pay back");
        return;
      }
      const pkey = PrivateKey.fromBuffer(this.currentAccount.getPrivateKey());
      const pubkey = pkey.toPublicKey();
      const callerAddress = this.currentAccount.address;
      const nodeClient = appState.getNodeClient();
      const takePayBackItems = [];
      for (const item of payBacks) {
        if (item.amount < 100) {
          continue;
        }
        takePayBackItems.push([
          item.minerName,
          { amount: item.amount, asset_id: item.assetId }
        ]);
      }
      if (takePayBackItems.length < 1) {
        this.showError(
          "at least take pay back with amount >= " +
            new BigNumber(100)
              .div(Math.pow(10, appState.dfdPrecision))
              .toFixed(appState.dfdPrecision)
        );
        return;
      }

      appState
        .withApis()
        .then(() => {
          let tr = new TransactionBuilder();
          let op = TransactionHelper.new_take_payback_from_miner_operation(
            callerAddress,
            takePayBackItems
          );
          tr.add_type_operation("pay_back", op);
          tr.set_expire_seconds(500);
          return tr.set_required_fees().then(() => {
            return tr.finalize().then(() => tr);
          });
        })
        .then(tr => {
          tr.add_signer(pkey, pubkey);
          tr.sign();
          let txid = tr
            .sha256(tr.tr_buffer)
            .toString("hex")
            .substr(0, 40);
          this.lastSentTxId = txid;
          console.log("tx hash:", txid);
          this.showSuccess("Transaction sent, please wait for seconds");
          if (typeof messageToBackground !== "undefined") {
            messageToBackground("txhash", txid);
          }
          tr.broadcast(function() {})
            .then(() => {
              setTimeout(() => {
                this.getTransaction(txid)
                  .then(tx => {
                    console.log("tx: ", tx);
                    this.step = "list";
                    this.showSuccess("take paybacks successfully");
                    this.loadLockBalances();
                    this.notifyAccountBalancesUpdate();
                  })
                  .catch(e => {
                    console.log("take paybacks error", e);
                    this.showError(
                      "take paybacks failed, maybe too little to receive once"
                    );
                  });
              }, 6000);
            })
            .catch(e => {
              console.log("take paybacks error", e);
              this.showError(
                "take paybacks failed, maybe too little to receive once"
              );
            });
        })
        .catch(this.showError);
    },
    mortageToMiner() {
      if (!this.currentAccount || !this.accountInfo) {
        this.showError("you can only control your own wallet");
        return;
      }
      const minerId = this.mortgageForm.minerId;
      const assetId = this.mortgageForm.assetId;
      const amount = this.mortgageFormAmount;
      const amountBn = new BigNumber(amount);
      if (!minerId || !assetId) {
        this.showError("Invalid miner or asset");
        return;
      }
      const asset = this.assetById(assetId);
      if (!asset || !asset.id) {
        this.showError("Can't find this asset");
        return;
      }
      if (!amountBn || amountBn.isNaN() || amountBn.lte(0)) {
        this.showError("Invalid amount format");
        return;
      }
      const amountFull = parseInt(
        amountBn.multipliedBy(Math.pow(10, asset.precision)).toFixed(0)
      );
      const pkey = PrivateKey.fromBuffer(this.currentAccount.getPrivateKey());
      const pubkey = pkey.toPublicKey();
      const callerAddress = this.currentAccount.address;
      const nodeClient = appState.getNodeClient();

      appState
        .withApis()
        .then(() => {
          let tr = new TransactionBuilder();
          let op = TransactionHelper.new_lockbalance_to_miner_operation(
            callerAddress,
            this.accountInfo.id,
            minerId,
            assetId,
            amountFull
          );
          tr.add_type_operation("lockbalance", op);
          tr.set_expire_seconds(500);
          return tr.set_required_fees().then(() => {
            return tr.finalize().then(() => tr);
          });
        })
        .then(tr => {
          tr.add_signer(pkey, pubkey);
          tr.sign();
          let txid = tr
            .sha256(tr.tr_buffer)
            .toString("hex")
            .substr(0, 40);
          this.lastSentTxId = txid;
          console.log("tx hash:", txid);
          this.showSuccess("Transaction sent, please wait for seconds");
          if (typeof messageToBackground !== "undefined") {
            messageToBackground("txhash", txid);
          }
          tr.broadcast(function() {})
            .then(() => {
              setTimeout(() => {
                this.getTransaction(txid)
                  .then(tx => {
                    console.log("tx: ", tx);
                    this.step = "list";
                    this.showSuccess("Mortgage successfully");
                    this.loadLockBalances();
                    this.notifyAccountBalancesUpdate();
                  })
                  .catch(e => {
                    console.log("mortgage error", e);
                    this.showError("Mortgage failed " + e.toString());
                  });
              }, 6000);
            })
            .catch(e => {
              console.log("mortgage error", e);
              this.showError("Mortgage failed " + e.toString());
            });
        })
        .catch(this.showError);
    },
    redeemFromMiner() {
      if (!this.currentAccount || !this.accountInfo) {
        this.showError("you can only control your own wallet");
        return;
      }
      const minerId = this.redeemForm.minerId;
      const assetId = this.redeemForm.assetId;
      const amount = this.redeemFormAmount;
      const amountBn = new BigNumber(amount);
      if (!minerId || !assetId) {
        this.showError("Invalid miner or asset");
        return;
      }
      const asset = this.assetById(assetId);
      if (!asset || !asset.id) {
        this.showError("Can't find this asset");
        return;
      }
      if (!amountBn || amountBn.isNaN() || amountBn.lte(0)) {
        this.showError("Invalid amount format");
        return;
      }
      const amountFull = parseInt(
        amountBn.multipliedBy(Math.pow(10, asset.precision)).toFixed(0)
      );
      const pkey = PrivateKey.fromBuffer(this.currentAccount.getPrivateKey());
      const pubkey = pkey.toPublicKey();
      const callerAddress = this.currentAccount.address;
      const nodeClient = appState.getNodeClient();

      appState
        .withApis()
        .then(() => {
          let tr = new TransactionBuilder();
          let op = TransactionHelper.new_forclose_balance_from_miner_operation(
            callerAddress,
            this.accountInfo.id,
            minerId,
            assetId,
            amountFull
          );
          tr.add_type_operation("foreclose_balance", op);
          tr.set_expire_seconds(500);
          return tr.set_required_fees().then(() => {
            return tr.finalize().then(() => tr);
          });
        })
        .then(tr => {
          tr.add_signer(pkey, pubkey);
          tr.sign();
          let txid = tr
            .sha256(tr.tr_buffer)
            .toString("hex")
            .substr(0, 40);
          this.lastSentTxId = txid;
          console.log("tx hash:", txid);
          this.showSuccess("Transaction sent, please wait for seconds");
          if (typeof messageToBackground !== "undefined") {
            messageToBackground("txhash", txid);
          }
          tr.broadcast(function() {})
            .then(() => {
              setTimeout(() => {
                this.getTransaction(txid)
                  .then(tx => {
                    console.log("tx: ", tx);
                    this.step = "list";
                    this.showSuccess("Redeem successfully");
                    this.loadLockBalances();
                    this.notifyAccountBalancesUpdate();
                  })
                  .catch(e => {
                    console.log("redeem error", e);
                    this.showError("Redeem failed " + e.toString());
                  });
              }, 6000);
            })
            .catch(e => {
              console.log("redeem error", e);
              this.showError("Redeem failed " + e.toString());
            });
        })
        .catch(this.showError);
    },
    toCancelLockBalance(minerId, assetId) {
      if (this.systemMiners.length < 1) {
        this.loadSystemMiners();
      }
      this.redeemForm = {
        amount: null,
        minerId: minerId,
        assetId: assetId
      };
      this.redeemFormAmount = "";
      this.step = "redeem";
    },
    getTransaction(txid) {
      const nodeClient = appState.getNodeClient();
      return appState.withApis().then(() => {
        return nodeClient.getTransactionById(txid);
      });
    },
    notifyAccountBalancesUpdate() {
      this.$emit("balance-update");
    },
    loadLockBalances() {
      if (!this.accountName) {
        return;
      }

      this.$store
        .dispatch("account/getAccountByName", this.accountName)
        .then(account => {
          console.log(
            `get account of name ${this.accountName} from vuex`,
            account
          );
          this.accountInfo = account;
          this.$nextTick(() => {
            this.accountInfo = account;
          });
          return account;
        })
        .then(account => {
          this.$store
            .dispatch("account/getAccountLockBalances", account.id)
            .then(lockBalances => {
              console.log(`lock balances from vuex is`, lockBalances);
              this.accountLockBalances = lockBalances;
              const usingMinerIds = [];
              for (const item of lockBalances) {
                if (usingMinerIds.indexOf(item.lockto_miner_account) < 0) {
                  usingMinerIds.push(item.lockto_miner_account);
                }
              }
              this.$nextTick(() => {
                this.accountLockBalances = lockBalances;
              });
              return usingMinerIds;
            })
            .then(usingMinerIds => {
              for (const minerId of usingMinerIds) {
                if (this.minersAccountCache[minerId]) {
                  continue;
                }
                this.$store
                  .dispatch("account/getMinerInfo", minerId)
                  .then(miner => {
                    return this.$store.dispatch(
                      "account/getAccountById",
                      miner.miner_account
                    );
                  })
                  .then(account => {
                    this.$set(this.minersAccountCache, minerId, account);
                  })
                  .catch(e => {
                    console.log("load miner error ", e);
                  });
              }
            })
            .catch(this.showError);
          this.$store
            .dispatch("account/getAddressPayBackBalances", account.addr)
            .then(payBacks => {
              console.log("payBacks from vuex", payBacks);
              this.accountPayBacks = payBacks;
            })
            .catch(e => {
              console.error('getAddressPayBackBalances error', e);
            });
        })
        .catch(this.showError);

      // TODO: move assets to vuex and offline mode
      appState.withSystemAssets().then(assets => {
        this.systemAssets = assets;
      });
    },
    backToList() {
      this.step = "list";
    },
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
    }
  }
};
</script>

<style lang="less">
.dfd-account-lock-balances-panel {
  .-table-header-row {
    .label-font {
      color: #a99eb4;
      font-size: 7pt;
    }
  }
  .-table-body-row {
    margin: 4px 0;
    .label-font {
      color: #a99eb4;
      font-size: 8pt;
    }
  }
  .-panel-title {
    padding: 5px 0;
    text-align: center;
    margin-bottom: 10px;
    color: #666666;
  }
  .-ctrl-btn {
    width: 60px;
    height: 24px;
    line-height: 24px;
    padding: 0;
  }
  .-transfer-asset-select {
    .el-input {
      width: 40pt !important;
      font-size: 8pt;
      margin-left: 10pt;
      input {
        font-size: 8pt;
        padding: 0;
        text-indent: 5pt;
      }
      .el-input__suffix {
        font-size: 8pt;
        width: 15pt;
      }
    }
  }
  .-miner-select {
    width: 222pt;
  }
  .el-form-item__label {
    color: #a99eb4;
    font-size: 8pt;
  }
  .-input-amount {
    width: 170pt !important;
  }
  .-simple-form-panel {
    max-width: 500px;
    margin: 0 auto;
  }
  .-top-control-panel {
    margin: 2px 0 10px 0;
    text-align: left;
    margin-left: 10px;
    padding-bottom: 10px;
  }
}
</style>
