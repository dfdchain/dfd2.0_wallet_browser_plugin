"use strict";
/* jshint strict: false */

var BigNumber = require("bignumber.js");

var Utils = require("./Utils");
var QRCode = require("./qrcode");

var openExtension = require("./extensionHandler");
var openApp = require("./appHandler");
var openMobileDapp = require("./mobileHandler");
var config = require("./config");

var Pay = function (appKey, appSecret) {
	// TODO: currently not use
	this.appKey = appKey;
	this.appSecret = appSecret;
};
var TransactionMaxGasPrice = "1000000000000";
var TransactionMaxGas = "50000000000";

var defaultDfdPayPushApiUrl = "http://wallet.dfd.cash/api";

function submitPayId(options) {
	// push serialNumber to dfdpaypush
	try {
		var dfdPayPushApiUrl = options.callback || defaultDfdPayPushApiUrl;
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function () {

		};
		xhr.open('POST', dfdPayPushApiUrl, true);
		xhr.send(JSON.stringify({
			jsonrpc: '2.0',
			id: 1,
			method: 'SendPayId',
			params: [options.serialNumber]
		}));
		xhr.onerror = function(err) {
			console.log("submit payId error", err);
		};
	} catch (e) {
		console.log(e);
	}
}

Pay.prototype = {
	/*jshint maxcomplexity:18 */
	submitParamsToWallet: function (params, des, options) {
		setTimeout(function() {
			submitPayId(options);
		});

		if (Utils.isMobileMobile()) {
			if (des === 'confirmSignText' || des === 'confirmSignHex') {
				params.method = 'confirmSign';
			}
			openMobileDapp(params, options);
			return;
		}

		if (Utils.isChrome() && !Utils.isMobileMobile() && options.extension.openExtension) {
			if (Utils.isExtInstalled())
				openExtension(params);
			else {
				//window.alert("DfdExtWallet is not installed.");
				if (window.confirm('DfdExtWallet is not installed. Click "ok" to install it.')) {
					var installUrl = "https://chrome.google.com/webstore/detail/dfdextwallet/eboifcnkiocbamnhekeoembpmmcnebii";
					window.open(installUrl);
				}
			}
		}

		var appParams = {
			category: "jump",
			des: des || "confirmTransfer",
			pageParams: params
		};

		if (Utils.isMobileMobile()) {
			openApp(appParams, options);
		}

		if (options.qrcode.showQRCode && !Utils.isNano()) {
			QRCode.showQRCode(JSON.stringify(appParams), options);
		}

		return options.serialNumber;
	},
	requestSignText: function (text, options) {
		options.serialNumber = Utils.randomCode(32);
		var params = {
			serialNumber: options.serialNumber,
			goods: options.goods,
			signBufferText: text,
			callback: options.callback || config.payUrl(options.debug),
			listener: options.listener,
			isSignBufferText: true,
		};
		return this.submitParamsToWallet(params, "confirmSignText", options);
	},
	requestSign: function (bufferHex, options) {
		options.serialNumber = Utils.randomCode(32);
		var params = {
			serialNumber: options.serialNumber,
			goods: options.goods,
			signBufferHex: bufferHex,
			callback: options.callback || config.payUrl(options.debug),
			listener: options.listener,
			isSignBufferHex: true,
		};
		return this.submitParamsToWallet(params, "confirmSignHex", options);
	},
	/*jshint maxcomplexity:18 */
	submit: function (currency, to, valueRaw, payload, options) {
		options.serialNumber = Utils.randomCode(32);
		valueRaw = valueRaw || "0";
		// var amount = new BigNumber(valueRaw).times("100000");//10^5 DFD's asset precision = 100000

		var gasLimitBN, gasPriceBN;
		if (!!options.gasLimit) {
			gasLimitBN = new BigNumber(options.gasLimit);  //check validity of gasPrice & gasLimit
			if (gasLimitBN.lt(0)) throw new Error("gas limit should not be minus");
			if (gasLimitBN.gt(TransactionMaxGas)) throw new Error("gas limit should smaller than " + TransactionMaxGas);
			if (!gasLimitBN.isInteger()) throw new Error("gas limit should be integer");
		}

		if (!!options.gasPrice) {
			gasPriceBN = new BigNumber(options.gasPrice);
			if (gasPriceBN.lt(0)) throw new Error("gas price should not be minus");
			if (gasPriceBN.gt(TransactionMaxGasPrice)) throw new Error("gas price should smaller than " + TransactionMaxGasPrice);
			// if (!gasPriceBN.isInteger()) throw new Error("gas price should be integer");
		}

		var params = {
			serialNumber: options.serialNumber,
			goods: options.goods,
			pay: {
				currency: currency,
				to: to,
				// value: amount.toString(10),
				valueRaw: valueRaw,
				memo: payload.memo,
				payload: payload,
				gasLimit: !!gasLimitBN ? gasLimitBN.toString(10) : undefined,
				gasPrice: !!gasPriceBN ? gasPriceBN.toString(10) : undefined,
				contractApi: payload.function,
				contractArg: payload.args
			},
			callback: options.callback || config.payUrl(options.debug),
			listener: options.listener,
			hrc20: options.hrc20
		};

		return this.submitParamsToWallet(params, "confirmTransfer", options);
	}
};

module.exports = Pay;