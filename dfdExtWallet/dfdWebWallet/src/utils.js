import operationTypes from "./operation_types";
import appState from "./appState";
let { PrivateKey, key, TransactionBuilder, TransactionHelper } = dfd_js;

export default {
    OperationTypes: operationTypes.types,
    haveEnoughBalance(spendAmountNu, spendAssetId, feeNu, accountBalances) {
        if (spendAmountNu.lte(0) && feeNu.lte(0)) {
            return true;
        }
        let feeMatched = false;
        let amountMatched = false;
        for (let balance of accountBalances) {
            if (balance.assetId === "1.3.0") {
                if (balance.amountNu.lte(feeNu)) {
                    return false;
                }
                feeMatched = true;
            }
            if (balance.assetId === spendAssetId) {
                let balanceToCal = balance.amountNu;
                if (balance.assetId === "1.3.0") {
                    balanceToCal = balanceToCal.minus(feeNu);
                }
                if (spendAmountNu.gt(balanceToCal)) {
                    return false;
                }
                amountMatched = true;
            }
        }
        return feeMatched && amountMatched;
    },
    getOperationTypeName(opType) {
        return operationTypes.types[opType];
    },
    getTxType(tx) {
        if (!tx) {
            return null;
        }
        const operations = tx.operations;
        if (!operations || !tx.operations.length) {
            return null;
        }
        const firstOpTuple = operations[0];
        const opType = firstOpTuple[0];
        return operationTypes.types[opType];
    },
    dfdAmountToString(val) {
        return new BigNumber(val)
            .div(Math.pow(10, appState.dfdPrecision))
            .toFixed(appState.dfdPrecision);
    },
    opTotalFee(opFeeAmount, gasCount, gasPrice) {
        return this.dfdAmountToString(opFeeAmount + gasCount * gasPrice);
    },
    assetAmountToString(assetAmount) {
        // {amount: xxx, asset_id: xxx}
        let asset = appState.getAssetLocal(assetAmount.asset_id);
        if (!asset && assetAmount.asset_id === "1.3.0") {
            asset = { id: "1.3.0", symbol: "DFD", precision: appState.dfdPrecision };
        }
        if (asset) {
            return (
                new BigNumber(assetAmount.amount)
                    .div(Math.pow(10, asset.precision))
                    .toFixed(asset.precision) +
                " " +
                asset.symbol
            );
        }
        return assetAmount.amount + " " + assetAmount.asset_id;
    },
    getTxReceiptStatus(nodeClient, tx) {
        const txType = this.getTxType(tx);
        if (["contract_register", "contract_invoke", "transfer_contract"].indexOf(txType) >= 0) {
            const txid = tx.trxid;
            return nodeClient.getContractTxReceipt(txid)
                .then((receipts) => {
                    const receipt = receipts[0]
                    if (receipt && receipt.exec_succeed) {
                        return "success";
                    } else {
                        return "fail";
                    }
                });
        } else {
            let success = tx.block_num && tx.block_num > 0;
            return Promise.resolve(success ? "success" : "fail");
        }
    },
    bytesToHex(bytes) {
        return TransactionHelper.bytes_to_hex(bytes);
    },
    hexToUtf8(s) {
        if (TransactionHelper.hexToUtf8WithoutMemoPrefix) {
            return TransactionHelper.hexToUtf8WithoutMemoPrefix(s);
        }
        return TransactionHelper.hexToUtf8(s);
    },
    hexToUnicodeString(s) {
        var escaped = "";
        var hex = "";
        if (s.length % 4 > 0) {
            for (i = 0; i < (4 - (s.length % 4)); i++) {
                hex += "0";
            }
        }
        hex += s;
        for (var i = 0; i < hex.length; i += 4) {
            escaped += "%u" + hex.charAt(i) + hex.charAt(i + 1) + hex.charAt(i + 2) + hex.charAt(i + 3);
        }
        return unescape(escaped).split(unescape("%00")).join("");
    },
    hexToString(hexStr) {
        const bytes = TransactionHelper.hex_to_bytes(hexStr);
        const str = String.fromCharCode.apply(null, bytes);
        return str;
    },
    formatTimezone(date) {
        const offset = date.getTimezoneOffset();
        const result = new Date(
            date.getTime() +
            (Math.sign(offset) !== -1
                ? -60000 * offset
                : 60000 * Math.abs(offset))
        );
        return result;
    },
    getShowErrorMessage(e, $t) {
        $t = $t || function(msg) {return msg;};
        console.log('show error', e);
        if (e && e.message) {
            e = e.message;
        }
        const originError = e;
        e = (e || "error").toString();
        if (!_.isString(originError)) {
            e = JSON.stringify(originError);
        }
        if (e === '{"isTrusted":true}') {
            if (originError && originError.type === 'error') {
                return $t("Connection failed");
            }
            return $t("Connected successfully");
        }
        e = e.replace(/bitshares/g, "dfd");
        if(e.indexOf('websocket state error')>=0) {
            return $t('websocket state error');
        }
        return $t(e);
    },
    isChromeExtension() {
        return typeof (chrome) !== 'undefined' && !!(chrome.windows);
    },
    emptyDfdBalance: {
        assetId: "1.3.0",
        assetSymbol: "DFD",
        amountNu: new BigNumber(0),
        amount: 0
    },
    localSetItem(key, value) {
        // TODO: 本地缓存记录存储时间，用于短期cache的时候太早数据不使用
        if (window.localStorage) {
            const network = appState.getCurrentNetwork()
            localStorage.setItem(`${network}.${key}`, JSON.stringify(value))
        }
    },
    localGetItem(key) {
        if (window.localStorage) {
            const network = appState.getCurrentNetwork()
            const resultStr = localStorage.getItem(`${network}.${key}`)
            if (!resultStr || resultStr === 'undefined') {
                return undefined
            }
            if (resultStr === 'null') {
                return null
            }
            try {
                return JSON.parse(resultStr)
            } catch (e) {
                return undefined
            }
        }
    }
};