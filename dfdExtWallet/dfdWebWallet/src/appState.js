import EventEmitter from "eventemitter3";

const EE = new EventEmitter();

const networkList = [
    {
        chainId: 'e7d71ca6f5140b3bcb91b44a992eebd55594fe0e980366d60b688c32f53539d3', key: 'mainnet', name: "Mainnet1",
        url: "ws://node2.dfdtw.com:60017"
    },
    {
        chainId: 'e7d71ca6f5140b3bcb91b44a992eebd55594fe0e980366d60b688c32f53539d3', key: 'mainnet2', name: "Mainnet2",
        url: "ws://node3.dfdtw.com:60017"
    },
    { 
        chainId: '68a46fbb5048e5bc0586d38f560e50014f9f34f23679a3fb6ceba63255ba1b1b', 
        key: 'testnet', 
        name: "Testnet", 
        url: "ws://192.168.110.15:8888" },
    {
        chainId: 'e7d71ca6f5140b3bcb91b44a992eebd55594fe0e980366d60b688c32f53539d3', // local mainnet
        key: 'localhost', name: "localhost:8090", url: "ws://localhost:8090"
    }
];

mergeNetworkListWithLocalNetwork();

function setLocalNetwork(url, chainId) {
    setStorage("local_network", JSON.stringify({
        chainId: chainId,
        key: 'local',
        name: 'Local',
        url: url
    }));
}

function getLocalNetwork() {
    const info = getStorage("local_network");
    if (!info) {
        return null;
    }
    try {
        return JSON.parse(info);
    } catch (e) {
        return null;
    }
}

function mergeNetworkListWithLocalNetwork() {
    const network = getLocalNetwork();
    if (!network) {
        return networkList;
    }
    let found = false;
    for (let item of networkList) {
        if (item.key === network.key && item.url !== network.url) {
            item.url = network.url;
            item.chainId = network.chainId;
            item.name = network.name;
            found = true;
            break;
        }
    }
    if (!found) {
        networkList.push(network);
    }
    return networkList;
}

function getNetworkByKey(networkKey) {
    for (let n of networkList) {
        if (n.key === networkKey) {
            return n;
        }
    }
    return null;
}

const state = {
    currentTab: 'my_wallet',
    currentTabParams: null,
    currentNetwork: null,
    currentLanguage: 'english',
    currentKeystoreFileJson: null,
    currentKeystorePassword: '',
    currentAccount: null,
    currentAddress: null,
    apisInstance: null,
    nodeClient: null,

    systemAssets: [], // [{id: ..., symbol: ..., precision: ..., issuer: ..., options: ..., current_feed: ...}]

    flashTxMessage: null, // received tx message from postMessage 

    dfdPayCallback: null,
    lastSerialNumber: null,

    tokenExplorerApiUrl: '',
};

// TODO: read current account from chrome.storage

let { PrivateKey, key, TransactionBuilder, TransactionHelper, NodeClient } = dfd_js;
let { Apis, ChainConfig } = dfd_js.bitshares_ws;

// TODO: read last used chainId or default
ChainConfig.setChainId(
    "e7d71ca6f5140b3bcb91b44a992eebd55594fe0e980366d60b688c32f53539d3"
);

function setStorage(key, value) {
    if (typeof localStorage !== "undefined") {
        try {
            return localStorage.setItem(key, value);
        } catch (e) {

        }
    }
}

function getStorage(key) {
    if (typeof localStorage !== "undefined") {
        try {
            return localStorage.getItem(key);
        } catch (e) {

        }
    }
}

function setCurrentAccount() {
    if (typeof localStorage !== "undefined") {
        try {
            let fileJson = localStorage.getItem("keyInfo");
            let password = localStorage.getItem("keyPassword");
            if (fileJson && fileJson !== 'null' && password) {
                fileJson = JSON.parse(fileJson);
                let account = account_utils.NewAccount();
                account.fromKey(fileJson, password);
                account.address = null;
                let address = account.getAddressString("DFD");
                account.address = address;
                state.currentAccount = account;
                state.currentAddress = address;
            }
        } catch (e) {
            console.log(e);
        }
    }
}

setCurrentAccount();


const changeCurrentTabEventName = "changeCurrentTab";
const changeCurrentNetworkEventName = "changeCurrentNetwork";
const changeCurrentLanguageEventName = "changeCurrentLanguage";
const changeCurrentAccountEventName = "changeCurrentAccount";
const changeCurrentAddressEventName = "changeCurrentAddress";
const pushFlashTxMessageEventName = "pushFlashTxMessage";
const connectionCloseEventName = "connectionClose";

const languageConfigStorageKey = "languageConfig";

state.currentLanguage = getStorage(languageConfigStorageKey) || "chinese";

function getLocationHash() {
    if (typeof (location) !== 'undefined') {
        return location.hash;
    } else {
        return '';
    }
}

function parseQuery(queryString) {
    var query = {};
    var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    return query;
}

// receive params
const locationHash = getLocationHash();
switch (locationHash) {
    case '#transfer': {
        state.currentTab = 'transfer';
    } break;
    case '#invoke_contract': {
        state.currentTab = 'contract';
    } break;
    case '#transfer_to_contract': {
        state.currentTab = 'contract';
        state.currentTabParams = ['transfer_to_contract'];
    } break;
    case '#check_tx': {
        state.currentTab = 'check_tx';
        state.currentTabParams = [];
    } break;
    case '#sign_raw': {
        state.currentTab = 'sign_raw';
        state.currentTabParams = [];
    } break;
    default: {
        if (locationHash && locationHash.indexOf('#locktominer=') === 0) {
            const lockToMinerName = locationHash.substr('#locktominer='.length);
            state.currentTab = 'my_wallet';
            state.currentTabParams = ['locktominer', lockToMinerName];
        }
    }
}
location.hash = '';

export default {
    EE,
    dfdPrecision: 5,
    mainnetChainId: 'e7d71ca6f5140b3bcb91b44a992eebd55594fe0e980366d60b688c32f53539d3',
    pushFlashTx(txMsg) {
        state.flashTxMessage = txMsg;
        console.log("receive flash tx message", txMsg);
        if (txMsg) {
            if (txMsg.callback) {
                state.dfdPayCallback = txMsg.callback;
            }
            if (txMsg.serialNumber) {
                state.lastSerialNumber = txMsg.serialNumber;
            }
        }
        EE.emit(pushFlashTxMessageEventName, txMsg);
    },
    getFlashTxOnce() {
        const msg = state.flashTxMessage;
        state.flashTxMessage = null;
        return msg;
    },
    onPushFlashTxMessage(listener) {
        EE.on(pushFlashTxMessageEventName, listener);
    },
    offPushFlashTxMessage(listener) {
        EE.off(pushFlashTxMessageEventName, listener);
    },
    changeCurrentTab(tabKey, params) {
        state.currentTab = tabKey;
        state.currentTabParams = params;
        EE.emit(changeCurrentTabEventName, state.currentTab, params);
    },
    onChangeCurrentTab(listener) {
        EE.on(changeCurrentTabEventName, listener);
    },
    offChangeCurrentTab(listener) {
        EE.off(changeCurrentTabEventName, listener);
    },
    getCurrentTab() {
        return state.currentTab;
    },
    getCurrentTabParams() {
        return state.currentTabParams;
    },
    clearCurrentTabParams() {
        state.currentTabParams.length = 0;
    },
    getNetworkList() {
        return networkList;
    },
    mergeNetworkListWithLocalNetwork() {
        mergeNetworkListWithLocalNetwork();
    },
    setLocalNetwork(url, chainId) {
        setLocalNetwork(url, chainId);
    },

    changeCurrentAccount(account) {
        state.currentAccount = account;
        if (account) {
            if (state.currentAddress !== account.address) {
                this.changeCurrentAddress(account.address);
            }
            EE.emit(changeCurrentAccountEventName, state.currentAccount);
        } else {
            this.changeCurrentAddress(null);
        }
    },
    getCurrentAccount() {
        return state.currentAccount;
    },
    onChangeCurrentAccount(listener) {
        EE.on(changeCurrentAccountEventName, listener);
    },
    offChangeCurrentAccount(listener) {
        EE.off(changeCurrentAccountEventName, listener);
    },

    changeCurrentAddress(address) {
        state.currentAddress = address;
        EE.emit(changeCurrentAddressEventName, state.currentAddress);
    },
    getCurrentAddress() {
        return state.currentAddress;
    },
    onChangeCurrentAddress(listener) {
        EE.on(changeCurrentAddressEventName, listener);
    },
    offChangeCurrentAddress(listener) {
        EE.off(changeCurrentAddressEventName, listener);
    },
    onConnectionClose(listener) {
        EE.on(connectionCloseEventName, listener);
    },
    offConnectionClose(listener) {
        EE.off(connectionCloseEventName, listener);
    },
    getLastUsedNetwork() {
        if (typeof (localSave) === 'undefined') {
            return null;
        }
        const key = localSave.getItem("networkKey");
        if (!key) {
            return null;
        }
        const networkObj = getNetworkByKey(key);
        return networkObj;
    },
    changeCurrentNetwork(network) {
        network = network || 'mainnet';
        if (state.currentNetwork === network) {
            return;
        }
        const oldNetwork = state.currentNetwork;
        state.currentNetwork = network;
        const networkObj = getNetworkByKey(network);
        if (networkObj) {
            const chainRpcUrl = networkObj.url;
            Apis.setAutoReconnect(true);
            state.apisInstance = Apis.instance(chainRpcUrl, true);
            state.apisInstance.closeCb = () => {
                EE.emit(connectionCloseEventName);
            };
            window.apisInstance = state.apisInstance;
            state.nodeClient = new NodeClient(state.apisInstance);
            if (typeof (localSave) !== 'undefined') {
                localSave.setItem("networkKey", networkObj.key);
                localSave.setItem("apiPrefix", chainRpcUrl);
                localSave.setItem("chainId", networkObj.chainId);
            }
            ChainConfig.setChainId(networkObj.chainId);
            ChainConfig.address_prefix = networkObj.address_prefix || "DFD";
            if (state.currentAccount) {
                let account = state.currentAccount;
                account.address = null;
                let address = account.getAddressString(ChainConfig.address_prefix);
                account.address = address;
            }
        }
        EE.emit(changeCurrentNetworkEventName, state.currentNetwork);
        if (oldNetwork && oldNetwork != network) {
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    },
    getApisInstance() {
        return state.apisInstance;
    },
    getNodeClient() {
        return state.nodeClient;
    },
    withApis() {
        const nodeClient = this.getNodeClient();
        if (!nodeClient) {
            return null;
        }
        return nodeClient.afterInited();
    },
    withSystemAssets() {
        const nodeClient = this.getNodeClient();
        if (!nodeClient) {
            return null;
        }
        if (state.systemAssets.length > 0) {
            return Promise.resolve(state.systemAssets);
        }
        return this.withApis().then(() => {
            return nodeClient.listAssets("", 100)
                .then((assets) => {
                    state.systemAssets = assets;
                    return assets;
                });
        });
    },
    getSystemAssets() {
        return state.systemAssets;
    },
    getAssetLocal(assetId) {
        if (!state.systemAssets) { return null; }
        for (let asset of state.systemAssets) {
            if (asset.id === assetId) {
                return asset;
            }
        }
        return null;
    },
    getAssetPrecisionByAssetId(assetId) {
        const asset = this.getAssetLocal(assetId);
        if (asset) {
            return asset.precision;
        } else {
            if (assetId === '1.3.0') {
                return 5; // DFD precision
            } else {
                return 5; // default precision
            }
        }
    },
    bindPayId(txid, payId, callback) {
        // bind txid with serial number to dfdpaypush
        let dfdPayPushApiUrl = callback || state.dfdPayCallback || "http://wallet.dfd.cash/api";
        payId = payId || state.lastSerialNumber;
        if (!payId || !txid) {
            return;
        }
        try {
            let xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () { };
            xhr.open("POST", dfdPayPushApiUrl, true);
            xhr.send(
                JSON.stringify({
                    jsonrpc: "2.0",
                    id: 1,
                    method: "BindPayId",
                    params: [payId, txid]
                })
            );
        } catch (e) {
            console.log("BindPayId request error", e);
        }
    },
    onChangeCurrentNetwork(listener) {
        EE.on(changeCurrentNetworkEventName, listener);
    },
    offChangeCurrentNetwork(listener) {
        EE.off(changeCurrentNetworkEventName, listener);
    },
    getCurrentNetwork() {
        return state.currentNetwork;
    },
    getCurrentNetworkObj() {
        const networkKey = this.getCurrentNetwork();
        return getNetworkByKey(networkKey);
    },
    changeCurrentLanguage(lang) {
        state.currentLanguage = lang;
        setStorage(languageConfigStorageKey, lang);
        EE.emit(changeCurrentLanguageEventName, state.currentLanguage);
    },
    onChangeCurrentLanguage(listener) {
        EE.on(changeCurrentLanguageEventName, listener);
    },
    offChangeCurrentLanguage(listener) {
        EE.off(changeCurrentLanguageEventName, listener);
    },
    getCurrentLanguage() {
        return state.currentLanguage;
    },
    getAddressPrefix() {
        return ChainConfig.address_prefix;
    },
    getTokenExplorerApiUrl() {
        return state.tokenExplorerApiUrl
    }
};
