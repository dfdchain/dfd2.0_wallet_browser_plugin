<template>
  <div>
    <div class="dfd-main-container dfd-transfer-container">
      <!-- transfer panel -->
      <div class="-left-side" v-if="step==='transfer'">
        <el-form
          :model="transferForm"
          status-icon
          ref="transferForm"
          label-width="60pt"
          class="dfd-transfer-inner-container"
        >
          <AddressOrSelectWalletInput
            :currentAddress="currentAccount && currentAccount.address"
            @change-current-account="onChangeSelectedAccount"
          ></AddressOrSelectWalletInput>
          <el-form-item
            v-bind:label="$t('transferPage.account_name')"
            prop="currentAccountName"
            style="text-align: left;"
            v-if="false"
          >
            <span
              class="label-font"
              style="padding-left: 60pt;"
            >{{currentAccountInfo.name || $t('transferPage.not_registered')}}</span>
          </el-form-item>
          <el-form-item v-bind:label="$t('transferPage.send_to_address')" prop="toAddress">
            <el-input
              class="-input-to-address"
              v-bind:placeholder="$t('transferPage.please_input_to_address_or_account_name')"
              type="text"
              v-model="transferForm.toAddress"
              style
            ></el-input>
          </el-form-item>
          <el-form-item v-bind:label="$t('transferPage.transfer_amount')" prop="amount">
            <AssetInput
              v-model="transferForm.amount"
              :precision="getAssetPrecisionByAssetId(transferForm.transferAssetId)"
              style="width: 170pt;"
            ></AssetInput>
            <el-select
              class="transfer-asset-select"
              v-model="transferForm.transferAssetId"
              v-bind:placeholder="$t('transferPage.please_select')"
            >
              <el-option
                v-for="item in currentAccountBalances"
                :key="item.assetSymbol"
                :label="item.assetSymbol"
                :value="item.assetId"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item v-bind:label="$t('transferPage.memo_info')" prop="memo">
            <el-input
              class="-input-memo"
              placeholder
              type="text"
              v-model="transferForm.memo"
              style="width: 100pt;"
            ></el-input>
          </el-form-item>
          <el-form-item v-bind:label="$t('transferPage.fee')" prop="feeAmount">
            <span class="label-font">0.001DFD</span>
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              class="dfdwallet-form-btn"
              v-on:click="transfer"
              style="margin-left: -80pt;"
            >{{$t('transferPage.transfer_right_now')}}</el-button>
          </el-form-item>
        </el-form>
        <el-dialog
          v-bind:title="$t('dialogs.please_confirm_tx_info')"
          :visible.sync="showConfirmDialog"
          width="300pt"
          height="187pt"
          :show-close="true"
          :before-close="closeConfirmDialog"
          center
        >
          <div>
            <el-row style="margin-bottom: 15pt;">
              <el-col :span="8">
                <div class="grid-content label-font">{{$t('transferPage.to_address')}}</div>
              </el-col>
              <el-col :span="16">
                <div class="grid-content label-font value-label">{{transferForm.toAddress}}</div>
              </el-col>
            </el-row>
            <el-row style="margin-bottom: 15pt;">
              <el-col :span="8">
                <div
                  class="grid-content label-font"
                >{{$t('transferPage.transfer_amount_in_dialog')}}</div>
              </el-col>
              <el-col :span="16">
                <div class="grid-content label-font value-label">{{transferForm.amount}}</div>
              </el-col>
            </el-row>
            <el-row style="margin-bottom: 15pt;">
              <el-col :span="8">
                <div class="grid-content label-font">{{$t('transferPage.fee')}}</div>
              </el-col>
              <el-col :span="16">
                <div class="grid-content label-font value-label">0.001DFD</div>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="8">
                <div class="grid-content label-font">{{$t('transferPage.memo_info')}}</div>
              </el-col>
              <el-col :span="16">
                <div
                  class="grid-content label-font value-label"
                  style="text-overflow: ellipsis; overflow-x: hidden;"
                >{{transferForm.memo}}</div>
              </el-col>
            </el-row>
          </div>
          <span slot="footer" class="dialog-footer">
            <el-button
              class="dfdwallet-form-btn"
              type="primary"
              @click="doTransfer"
            >{{$t('dialogs.confirm')}}</el-button>
          </span>
        </el-dialog>
      </div>

      <!-- transfer_sent panel -->
      <div class="-left-side" v-if="step==='transfer_sent'">
        <div
          style="color: #261932; font-size: 12pt; margin-top: 30pt;"
        >{{$t('transferPage.tx_making')}}</div>
        <div style="margin-top: 10pt; font-size: 35pt; color: #308ce5;">
          <i class="el-icon-loading"></i>
        </div>
        <div style="margin-top: 10pt; font-size: 10pt; color: #261932;">
          <p>{{$t('transferPage.tx_making_and_will_refresh_after_done')}}</p>
          <p>{{$t('transferPage.you_can_also_query_tx_by_tx_hash')}}</p>
        </div>
        <div>
          <el-button
            type="text"
            style="color: #308ce5; font-size: 10pt;"
            @click="toViewTx(lastSentTxId)"
          >{{lastSentTxId}}</el-button>
        </div>
        <div style="margin-top: 15pt;">
          <el-button class="dfdwallet-form-btn" @click="backToTransfer">{{$t('transferPage.back')}}</el-button>
        </div>
      </div>

      <!-- transfer_fail panel -->
      <div class="-left-side" v-if="step==='transfer_fail'">
        <div
          style="color: #261932; font-size: 12pt; margin-top: 30pt;"
        >{{$t('transferPage.tx_failed')}}</div>
        <div style="margin-top: 10pt; font-size: 35pt; color: #FF0000;">
          <i class="el-icon-error"></i>
        </div>
        <div style="margin-top: 10pt; font-size: 10pt; color: red;">
          <p
            style="overflow: hidden; text-overflow: ellipsis; margin: 0 auto; max-width: 80%; max-height: 131pt;"
          >{{transferFailError}}</p>
        </div>
        <div style="margin-top: 20pt;">
          <el-button
            type="text"
            style="color: #308ce5; font-size: 10pt;"
            @click="toViewTx(lastSentTxId)"
          >{{lastSentTxId}}</el-button>
        </div>
        <div style="margin-top: 15pt;">
          <el-button class="dfdwallet-form-btn" @click="backToTransfer">{{$t('transferPage.back')}}</el-button>
        </div>
      </div>

      <!-- transfer_success panel -->
      <div class="-left-side" v-if="step==='transfer_success'">
        <div
          style="color: #261932; font-size: 12pt; margin-top: 30pt;"
        >{{$t('transferPage.tx_success')}}</div>
        <div style="margin-top: 10pt; font-size: 35pt; color: #00DD00;">
          <i class="el-icon-success"></i>
        </div>
        <div style="margin-top: 10pt; font-size: 10pt; color: #261932;">
          <p>{{$t('transferPage.tx_on_chain_success')}}</p>
          <p>{{$t('transferPage.you_can_query_tx_status_on_chain')}}</p>
        </div>
        <div>
          <el-button
            type="text"
            style="color: #308ce5; font-size: 10pt;"
            @click="toViewTx(lastSentTxId)"
          >{{lastSentTxId}}</el-button>
        </div>
        <div style="margin-top: 15pt;">
          <el-button class="dfdwallet-form-btn" @click="backToTransfer">{{$t('transferPage.back')}}</el-button>
        </div>
      </div>

      <div class="-right-side" v-if="false">
        <!-- TODO: wrap to component -->
        <el-row style="margin-bottom: 20pt;">
          <el-col :span="8">
            <div class="grid-content">
              <div class="label-font">{{$t('accountBalances.wallet_balance')}}</div>
            </div>
          </el-col>
          <el-col :span="16">
            <div class="grid-content">
              <el-switch v-model="hideZeroAssets"></el-switch>
              <span class="label-font">{{$t('accountBalances.hide_zero_balances')}}</span>
            </div>
          </el-col>
        </el-row>
        <div class="-account-balances-panel">
          <div
            v-for="balance in filterBalances(currentAccountBalances, hideZeroAssets, null)"
            class="-account-balance"
            :key="balance.assetSymbol"
          >
            <div class="-asset-symbol-label">{{balance.assetSymbol}}</div>
            <div class="-asset-amount-label">{{balance.amountNu.toFixed(balance.precision)}}</div>
          </div>
          <div class="clearfix"></div>
        </div>
      </div>

      <div class="clearfix"></div>
    </div>
  </div>
</template>

<script>
import _ from "lodash";
import appState from "../appState";
import utils from "../utils";
import KeystoreInput from "../components/KeystoreInput.vue";
import AddressOrSelectWalletInput from "../components/AddressOrSelectWalletInput.vue";
import AssetInput from "../components/AssetInput.vue";
let { PrivateKey, key, TransactionBuilder, TransactionHelper } = dfd_js;

export default {
  name: "Transfer",
  components: { KeystoreInput, AddressOrSelectWalletInput, AssetInput },
  data() {
    return {
      lastSentTxId: null,
      transferFailError: null,
      showConfirmDialog: false,
      step: "transfer", // transfer, transfer_sent, transfer_success, transfer_fail
      walletUnlocked: false,
      hideZeroAssets: true,
      transferForm: {
        filename: appState.getCurrentAddress(),
        transferAssetId: "1.3.0"
      },
      currentAccountBalances: [],
      currentAccountInfo: {},
      closeTimeoutMilli: 5000
    };
  },
  created() {
    let account = appState.getCurrentAccount();
    this.currentAccount = account;
    if (account) {
      this.walletUnlocked = true;
      this.currentAddress = account.address;
      this.loadCurrentAccountInfo();
    } else {
      this.walletUnlocked = false;
    }
  },
  mounted() {
    appState.onChangeCurrentAccount(this.onChangeCurrentAccount);

    const flashTxMessage = appState.getFlashTxOnce();
    if (flashTxMessage) {
      this.onFlashTxMessage(flashTxMessage);
    }
    appState.onPushFlashTxMessage(this.onFlashTxMessage);
  },
  beforeDestroy() {
    appState.offChangeCurrentAccount(this.onChangeCurrentAccount);
    appState.offPushFlashTxMessage(this.onFlashTxMessage);
    this.destroyed = true;
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  },
  methods: {
    onFlashTxMessage(txMsg) {
      this.transferForm.transferAssetId = txMsg.currency || "1.3.0";
      this.transferForm.amount = txMsg.valueRaw;
      this.transferForm.toAddress = txMsg.to;
      this.transferForm.memo = txMsg.memo;
      this.serialNumber = txMsg.serialNumber;
    },
    getAssetPrecisionByAssetId(assetId) {
      return appState.getAssetPrecisionByAssetId(assetId);
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
    },
    onChangeSelectedAccount(account) {
      this.currentAccount = account;
      this.currentAddress = account.address;
      this.loadCurrentAccountInfo();
    },
    loadCurrentAccountInfo() {
      if (!this.currentAccount) {
        return;
      }
      const nodeClient = appState.getNodeClient();
      appState
        .withSystemAssets()
        .then(assets => {
          return nodeClient
            .getAddrBalances(this.currentAccount.address)
            .then(balances => {
              this.currentAccountBalances.length = 0;
              for (let asset of assets) {
                let balance = balances.filter(b => b.asset_id === asset.id)[0];
                let item = {
                  assetId: asset.id,
                  assetSymbol: asset.symbol,
                  amount: balance ? balance.amount : 0,
                  precision: asset.precision,
                  amountNu: balance
                    ? new BigNumber(balance.amount).div(
                        Math.pow(10, asset.precision)
                      )
                    : new BigNumber(0)
                };
                this.currentAccountBalances.push(item);
              }
              return balances;
            });
        })
        .then(() => {
          return nodeClient
            .getAccountByAddresss(this.currentAddress)
            .then(accountInfo => {
              if (accountInfo) {
                this.currentAccountInfo = accountInfo;
              } else {
                this.currentAccountInfo = {};
              }
            });
        })
        .catch(this.showError.bind(this));
    },
    onChangeCurrentAccount(account) {
      this.currentAccount = account;
      this.currentAddress = account.address;
    },
    updateCurrentAccountBalances(balances) {
      this.currentAccountBalances = balances;
    },
    backToTransfer() {
      this.transferForm.toAddress = "";
      this.transferForm.amount = 0;
      this.transferForm.memo = "";
      this.transferForm.transferAssetId = "1.3.0";
      this.step = "transfer";
    },
    toViewTx(txId) {
      appState.changeCurrentTab("check_tx", [txId]);
    },
    getAddressByAddressOrAccountName(addressOrAccountName) {
      if (!addressOrAccountName) {
        return Promise.reject("Empty address name");
      }
      if (
        !addressOrAccountName ||
        addressOrAccountName.length < 20
      ) {
        const nodeClient = appState.getNodeClient();
        return appState.withApis().then(() => {
          return nodeClient
            .getAccount(addressOrAccountName)
            .then(account => account.addr);
        });
      } else {
        return Promise.resolve(addressOrAccountName);
      }
    },
    transfer() {
      let form = this.transferForm;
      let toAddress = (form.toAddress || "").trim();
      let amount = form.amount;
      let amountNu = new BigNumber(amount);
      let assetId = form.transferAssetId;
      let asset = appState.getAssetLocal(assetId);
      let feeAsset = appState.getAssetLocal("1.3.0");
      let fee = new BigNumber("0.001");
      let memo = (form.memo || "").trim();
      if (amountNu.isNaN() || amountNu.lte(0)) {
        this.showError(this.$t("transferPage.invalid_transfer_amount_format"));
        return;
      }
      if (
        !utils.haveEnoughBalance(
          amountNu,
          assetId,
          fee,
          this.currentAccountBalances
        )
      ) {
        this.showError(this.$t("transferPage.not_enough_balance"));
        return;
      }
      if (!toAddress) {
        this.showError("Empty Address or account name");
        return;
      }
      this.getAddressByAddressOrAccountName(toAddress)
        .then(toAddress => {
          this.showConfirmDialog = true;
        })
        .catch(() => {
          this.showError(this.$t("transferPage.invalid_to_address_format"));
        });
    },
    closeConfirmDialog() {
      this.showConfirmDialog = false;
    },
    doTransfer: _.throttle(function() {
      this.showConfirmDialog = false;
      let form = this.transferForm;
      let toAddress = (form.toAddress || "").trim();
      let amount = form.amount;
      let amountNu = new BigNumber(amount);
      let assetId = form.transferAssetId;
      let asset = appState.getAssetLocal(assetId);
      let memo = (form.memo || "").trim();
      let amountFull = parseInt(
        amountNu.multipliedBy(Math.pow(10, asset.precision)).toFixed(0)
      );
      const pkey = PrivateKey.fromBuffer(this.currentAccount.getPrivateKey());
      const pubKey = pkey.toPublicKey();
      const nodeClient = appState.getNodeClient();

      this.getAddressByAddressOrAccountName(toAddress)
        .then(toAddress => {
          appState
            .withApis()
            .then(() => {
              let tr = new TransactionBuilder();
              let op = TransactionHelper.new_transfer_operation(
                this.currentAccount.address,
                toAddress,
                amountFull,
                assetId,
                memo
              );
              tr.add_type_operation("transfer", op);
              tr.set_expire_seconds(500);
              return tr.set_required_fees().then(() => {
                return tr.finalize().then(() => tr);
              });
            })
            .then(tr => {
              tr.add_signer(pkey, pubKey);
              tr.sign();
              let txid = tr
                .sha256(tr.tr_buffer)
                .toString("hex")
                .substr(0, 40);
              this.lastSentTxId = txid;
              console.log("tx hash:", txid);

              appState.bindPayId(txid);

              if (typeof messageToBackground !== "undefined") {
                messageToBackground("txhash", txid);
              }
              tr.broadcast(function() {})
                .then(() => {
                  setTimeout(() => {
                    this.getTransaction(txid)
                      .then(tx => {
                        console.log("tx: ", tx);
                        this.step = "transfer_success";
                        this.loadCurrentAccountInfo();
                        if (utils.isChromeExtension()) {
                          this.closeTimer = setTimeout(() => {
                            if (!this.destroyed) {
                              window.close();
                            }
                            this.closeTimer = null;
                          }, this.closeTimeoutMilli);
                        }
                      })
                      .catch(e => {
                        this.step = "transfer_fail";
                        this.transferFailError = this.$t(
                          "contractPage.tx_not_on_chain_please_query_later"
                        );
                      });
                  }, 6000);
                })
                .catch(e => {
                  this.step = "transfer_fail";
                  this.transferFailError = e.toString();
                });

              this.step = "transfer_sent";
            })
            .catch(this.showError);
        })
        .catch(this.showError);
    }, 1000),
    getTransaction(txid) {
      const nodeClient = appState.getNodeClient();
      return appState.withApis().then(() => {
        return nodeClient.getTransactionById(txid);
      });
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
    }
  }
};
</script>

<style lang="less">
.dfd-transfer-container {
  min-width: 400px;
  min-height: 381pt;
  background: inherit;
  padding-top: 0;
  .label-font {
    color: #a99eb4;
    font-size: 8pt;
  }
  .-left-side {
    // width: 70%;
    width: 100%;
    float: left;
    background: white;
    min-height: 381pt;
  }
  .-right-side {
    width: calc(30% - 10px);
    min-width: 250px;
    float: right;
    text-align: left;
    background: white;
    min-height: 381pt;
    margin-left: 10px;
    padding: 20pt;
  }
  .-asset-symbol-label {
    color: #a99eb4;
    font-size: 7pt;
  }
  .-asset-amount-label {
    color: #261932;
    font-size: 8pt;
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
  .-account-balances-panel {
    position: relative;
  }
  .-account-balance {
    display: block;
    float: left;
    width: 55pt;
    padding-bottom: 15px;
    text-align: center;
  }
  .transfer-asset-select {
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
  .el-form-item__label {
    color: #a99eb4;
    font-size: 8pt;
  }
  .value-label {
    color: #261932;
    font-size: 8pt;
  }
}

@media (max-width: 960px) {
  .dfd-transfer-container {
    .-right-side {
      display: none;
    }
    .-left-side {
      width: 100%;
    }
  }
}

.dfd-transfer-inner-container,
.dfd-transfer-done-inner-container {
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
  .-transfer-title {
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
  .dfd-transfer-container {
  }
}

.chrome-ext-app-container {
  .dfd-transfer-container {
    .-change-wallet-btn {
      padding-left: 50pt;
    }
  }
}
</style>
