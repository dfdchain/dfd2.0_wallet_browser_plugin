"use strict";

var extend = require('extend');
var http = require("./libs/http");
var config = require("./libs/config");
var Pay = require("./libs/pay");
var Utils = require('./libs/Utils');

var BigNumber = require("bignumber.js");

var DfdPay = function (appKey, appSecret) {
	this._pay = new Pay(appKey, appSecret);
};

DfdPay.config = config;

var defaultOptions = function () {
	return {
		goods: {
			name: "",
			desc: {},
			orderId: "",
			ext: ""
		},
		qrcode: {
			showQRCode: false,
			completeTip: undefined, // string of complete payment tip
			cancelTip: undefined, // string of cancel payment tip
			container: undefined
		},
		extension: {
			openExtension: true //set if need show extension payment mode
		},

		mobile: {
			showInstallTip: true,
			installTip: undefined // string of install NASNano tip
		},

		// callback is the return url after payment
		//callback: config.payUrl,
		callback: undefined,

		//listener：specify a listener function to handle payment feedback message(only valid for browser extension)
		listener: undefined,

		// if debug mode, should open testnet nano and reset the callback
		debug: false,

		gasPrice: undefined,// 1 ,
		gasLimit: undefined //10000
	};
};

var dfdChainConfigCacheInDfdPay = null;

DfdPay.prototype = {
	pay: function (assetId, to, value, options) {
		var payload = {
			type: "binary"
		};
		options = extend(defaultOptions(), options);
		return this._pay.submit(assetId, to, value, payload, options);
	},
	signBufferHex: function (bufferHex, options) {
		options = extend(defaultOptions(), options);
		return this._pay.requestSign(bufferHex, options);
	},
	signBufferText: function (text, options) {
		options = extend(defaultOptions(), options);
		return this._pay.requestSignText(text, options);
	},

	defaultConfig: {
		chainId: '2e13ba07b457f2e284dcfcbd3d4a3e4d78a6ed89a61006cdb7fdad6d67ef0b12',
		network: 'ws://nodeapi.dfdtw.com:6090' // 'wss://nodeapi.dfdtw.com'
	},

	postMessageRequest: function (method, data, callbackRegisterMethod, timeout) {
		timeout = timeout || 10000;
		data = data || {};

		if (Utils.isMobileMobile()) {
			var fn = Utils.wrappedMobileMethod(method);
			return new Promise(function (resolve, reject) {
				var ended = false;

				dsBridge.call(fn, data, function(s) {
					var resp = JSON.parse(s);
					if (resp.code === 0) {
						resolve(resp);
					} else {
						reject(method + "failed: " + resp.errmsg);
					}
				});

				setTimeout(function () {
					if (ended) {
						return;
					}
					ended = true;
					reject(method + " timeout");
				}, timeout);
			});
		}

		return new Promise(function (resolve, reject) {
			var ended = false;
			if (typeof (DfdExtWallet) === 'undefined') {
				if (ended) {
					return;
				}
				ended = true;
				reject("DfdExtWallet not installed");
				return;
			}
			if(!DfdExtWallet[callbackRegisterMethod]) {
				console.log("method " + callbackRegisterMethod + " not found");
				reject("method " + callbackRegisterMethod + " not found in DfdExtWallet");
				return;
			}
			DfdExtWallet[callbackRegisterMethod](function (config) {
				if (ended) {
					return;
				}
				ended = true;
				resolve(config);
			}, data);
			setTimeout(function () {
				if (ended) {
					return;
				}
				ended = true;
				reject(method + " timeout");
			}, timeout);
		});
	},
	// chainId: if networkKey is mainnet, you can set it to ''; or else set to your chainId
	// networkKey: mainnet, testnet, regnet, etc...
	// optionalNodeRpcUrl: if networkKey is mainnet, set to ''; or else set to your node rpc endpoint, such as http://192.168.1.122:10046
	// optionalNodeClientRpcUrl: if networkKey is mainnet, set to ''; or else set to your node client rpc endpoint, such as ws://192.168.1.121:30000
	setConfig: function(chainId, networkKey, optionalNodeRpcUrl, optionalNodeClientRpcUrl) {
		// 通知钱包DAPP使用的网络配置和chainId
		return this.postMessageRequest('setConfig', {chainId: chainId, networkKey: networkKey, network: optionalNodeRpcUrl, clientNetwork: optionalNodeClientRpcUrl}, 'setConfig', 10000);
	},
	onConnectedWallet: function() {
		// 等待钱包注入的js执行完成
		function isConnected() {
			return typeof(DfdExtWallet) !== 'undefined' || Utils.isMobileMobile();
		}
		return new Promise(function(resolve, reject) {
			if(isConnected()) {
				resolve();
				return;
			}
			var count = 0;
			var timer = setInterval(function() {
				if(count > 10) {
					clearInterval(timer);
					reject("timeout");
					return;
				}
				count ++;
				if(isConnected()) {
					clearInterval(timer);
					resolve();
					return;
				}
			}, 500);
		});
	},
	getConfig: function () {
		return this.postMessageRequest('getConfig', {}, 'getConfig', 10000).then(function (config) {
			dfdChainConfigCacheInDfdPay = config;
			if(config) {
				if(config.network === 'ws://nodeapi.dfdtw.com:6090') {
					config.network = 'ws://nodeapi2.dfdtw.com:6090';
				}
			}
			return config;
		});
	},
	getConfigWithCache: function () {
		if (dfdChainConfigCacheInDfdPay) {
			return Promise.resolve(dfdChainConfigCacheInDfdPay);
		} else {
			return this.getConfig();
		}
	},
	getUserAddress: function () {
		return this.postMessageRequest('getUserAddress', {}, 'getUserAddress', 5000);
	},
	getChainConfigObject: function () {
		return dfd_js.ChainConfig;
	},
	getApis: function () {
		return dfd_js.Apis;
	},
	getAssets: function (apisInstance) {
		return apisInstance
			.init_promise.then(function () {
				return apisInstance
					.db_api()
					.exec("list_assets", ["", 100])
					.then(function (r) {
						var assets = r.sort(function (a, b) {
							if (a.id === b.id) {
								return 0;
							} else if (a.id < b.id) {
								return -1;
							} else {
								return 1;
							}
						});
						return assets;
					});
			});
	},
	getBalances: function (apisInstance, userAddress) {
		return apisInstance
			.init_promise.then(function () {
				return apisInstance
					.db_api()
					.exec("get_addr_balances", [userAddress])
					.then(function (r) {
						var coreCoinBalances = r.sort(function (a, b) {
							if (a.id === b.id) {
								return 0;
							} else if (a.id < b.id) {
								return -1;
							} else {
								return 1;
							}
						});
						return coreCoinBalances;
					});
			});
	},
	getTransaction: function (apisInstance, txid) {
		return apisInstance
			.init_promise.then(function () {
				return apisInstance
					.db_api()
					.exec("get_transaction_by_id", [txid]);
			});
	},
	waitTransaction: function (nodeClient, txid, timeout) {
		timeout = timeout || 8000;
		return new Promise(function (resolve, reject) {
			var executedTimeout = 0;
			var lastError = "transaction timeout, maybe transaction not successfully";
			var intervalFunc = function () {
				if (executedTimeout >= timeout) {
					clearInterval(intervalHandler);
					reject(lastError);
					return;
				}
				executedTimeout += 2000;
				nodeClient.getTransactionById(txid)
					.then(function (tx) {
						clearInterval(intervalHandler);
						resolve(tx);
					}).catch(function (err) {

					});
			};
			var intervalHandler = setInterval(intervalFunc, 2000);
		});
	},

	// TODO: get tx status by payId

	lockBalanceToMiner: function(minerIdOrName, assetId, amount, options) {
		var payload = {
			type: "lockBalanceToMiner",
			miner: minerIdOrName,
			assetId: assetId,
			amount: amount
		};
		options = extend(defaultOptions(), options);
		options.qrcode.showQRCode = false;
		options.mobile.showInstallTip = false;
		options.extension.openExtension = true;
		payload.memo = options.memo;

		return this._pay.submit(assetId, minerIdOrName, amount, payload, options);
	},
	simulateCall: function (assetId, to, value, func, args, options) {
		var payload = {
			type: "simulateCall",
			function: func,
			args: args
		};
		options = extend(defaultOptions(), options);
		options.qrcode.showQRCode = false;
		options.mobile.showInstallTip = false;
		options.extension.openExtension = true;
		payload.memo = options.memo;

		return this._pay.submit(assetId, to, value, payload, options);
	},
	invokeContract: function (assetId, to, value, func, args, options) {
		return this.simulateCall.apply(this, arguments);
	 },
	transferToContract: function (assetId, to, value, args, options) {
		var payload = {
			type: "transferToContract",
			args: args
		};
		options = extend(defaultOptions(), options);
		options.qrcode.showQRCode = false;
		options.mobile.showInstallTip = false;
		options.extension.openExtension = true;
		payload.memo = options.memo;

		return this._pay.submit(assetId, to, value, payload, options);
	},
	queryPayInfo: function (serialNumber, options) {
		options = extend(defaultOptions(), options);
		var url = options.callback || config.payUrl(options.debug);
		return http.post(url, JSON.stringify({
			jsonrpc: '2.0',
			id: 1,
			method: 'QueryPayId',
			params: [serialNumber]
		}));
	}
};

module.exports = DfdPay;

