

var webExtensionWallet = "for dfd";

console.log("webExtensionWallet is defined:" + webExtensionWallet);

var _DfdExtWallet = function () {
    this.getUserAddressCallback ;

    this.getUserAddress = function(callback, data) {
        //console.log("********* get account ************")
        getUserAddressCallback = callback
        window.postMessage({
            "target": "contentscript",
            "data": data || {},
            "method": "dfd_getUserAddress",
        }, "*");
    };

    this.getConfigCallback ;

    this.getConfig = function(callback, data) {
        getConfigCallback = callback
        window.postMessage({
            "target": "contentscript",
            "data":data || {},
            "method": "dfd_getConfig",
        }, "*");
    };

    this.setConfigCallback ;

    this.setConfig = function(callback, data) {
        setConfigCallback = callback
        window.postMessage({
            "target": "contentscript",
            "data":data || {},
            "method": "dfd_setConfig",
        }, "*");
    };

    var sourceName = 'DfdExtWallet';

// listen message from contentscript
    window.addEventListener('message', function(e) {
        // e.detail contains the transferred data (can
        if (e.data.src ==="content" && e.data.dst === "inpage" && !!e.data.data && !!e.data.data.account && e.data.data.source===sourceName) {
            userAddrerss = e.data.data.account;
            var accountPubKey = e.data.data.accountPubKey;
            var accountPubKeyString = e.data.data.accountPubKeyString
            if(typeof getUserAddressCallback === 'function'){
                getUserAddressCallback({address: userAddrerss, pubKey: accountPubKey, pubKeyString: accountPubKeyString})
            }
        }
        if (e.data.src ==="content" && e.data.dst === "inpage" && !!e.data.data && !!e.data.data.config && e.data.data.source===sourceName) {
            let config = e.data.data.config;
            if(typeof getConfigCallback === 'function'){
                getConfigCallback(config)
            }
        }
        if (e.data.src ==="content" && e.data.dst === "inpage" && !!e.data.data && !!e.data.data.setConfigCallback && e.data.data.source===sourceName) {
            let d = e.data.data.setConfigCallback;
            if(typeof setConfigCallback === 'function'){
                setConfigCallback(d)
            }
        }
    })
}

var DfdExtWallet = new _DfdExtWallet()



