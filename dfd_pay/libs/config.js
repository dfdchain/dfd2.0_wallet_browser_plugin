"use strict";

var mainnetUrl = "http://wallet.dfd.cash/api";
var testnetUrl = "http://wallet.dfd.cash/testnet_api";

var payUrl = function(debug) {
    debug = debug || false;
    if (debug) {
        return testnetUrl;
    } else {
        return mainnetUrl;
    }
};

var nanoScheme = function(debug) {
    debug = debug || false;
    if (debug) {
        return "openapp.DFDnano.testnet";
    } else {
        return "openapp.DFDnano";
    }
};

module.exports = {
    payUrl: payUrl,
    nanoScheme: nanoScheme,
    mainnetUrl: mainnetUrl,
    testnetUrl: testnetUrl
};