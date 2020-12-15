"use strict";

var isChrome = function() {
    if (typeof window !== "undefined") {
        var userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.match(/chrome\/([\d\.]+)/))  {
            return true;
        }
    } 
    return false;
};

var isExtInstalled = function() {
    return (typeof(XwcExtWallet) !== 'undefined');
};

var isMobile = function() {
    var userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.indexOf("mobile") > -1)  {
        return true;
    }
    return false;
};

var _isMobile = false;
var isMobileMobile = function() {
    if (window.isMobile === true) {
        _isMobile = window.isMobile;
        return true;
    }

    return _isMobile;
};

window.addEventListener('MobileLoaded', function () {
	console.log('MobileLoaded');
    _isMobile = true;
    window.isMobile = true;
    //delete callbackMap[key];
});

var mobileDappNamespace = "MobileDapp";
var wrappedMobileMethod = function (method) {
    if (method.startsWith(mobileDappNamespace)) {
        return method;
    }
    return mobileDappNamespace + "." + method;
};

var getOrigin = function() {
    var origin;
    var plugin = "";

    if(typeof location !== 'undefined') {
        if(location.hasOwnProperty('hostname') && location.hostname.length && location.hostname !== 'localhost') {
            origin = location.hostname;
        } else { origin = plugin; }
    } else { origin = plugin; }

    if(origin.substr(0, 4) === 'www.') origin = origin.replace('www.','');
    
    return origin;
};

var isNano = function() {
    var userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.indexOf("nasnanoapp") > -1)  {
        return true;
    }
    return false;
};

var isWechat = function () {
    var userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.indexOf("micromessenger") > -1)  {
        return true;
    }
    return false;
};

var randomCode = function (len) {
    var d,
        e,
        b = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        c = "";
        for (d = 0; len > d; d += 1){
            e = Math.random() * b.length;
            e = Math.floor(e);
            c += b.charAt(e);
        }
        return c;
};

var addCssRule = function() {
    function createStyleSheet() {
        var style = document.createElement('style');
        style.type = 'text/css';
        document.head.appendChild(style);
        return style.sheet;
    }
  
    var sheet = createStyleSheet();
  
    return function(selector, rules, index) {
        index = index || 0;
        sheet.insertRule(selector + "{" + rules + "}", index);
    };
}();

module.exports = {
    isExtInstalled: isExtInstalled,
    isChrome: isChrome,
    isMobile: isMobile,
    isNano: isNano,
    isWechat: isWechat,
    randomCode: randomCode,
    addCssRule: addCssRule,
    getOrigin: getOrigin,
    isMobileMobile: isMobileMobile,
    wrappedMobileMethod: wrappedMobileMethod,
};
