"use strict";

var QRCode = require('qrcode');
var Utils = require("./Utils");

var createDeaultQRContainer = function(options) {
	var canvas = document.createElement("canvas");
	canvas.className = "qrcode";
	/*jshint multistr: true */
	var canvasStyle = "//box-shadow: 2px 2px 12px lightgray;";
	Utils.addCssRule(".qrcode", canvasStyle);

	var qrcontainer = document.createElement("div");
	qrcontainer.className = "qrcode-container";
	var style = ("text-align: center;\
    //background-color: #fff0;\
    background-color: white;\
    //border-radius: 20px;\
    width: min-content; //300px;\
    height: min-content; //300px;\
    position: absolute;\
    left: 50%;\
    top: 50%;\
    transform: translate(-50%,-50%);");
	Utils.addCssRule(".qrcode-container", style);
	qrcontainer.appendChild(canvas);

	var newLine = document.createElement('br');
	qrcontainer.appendChild(newLine);

    var textInfo = document.createElement('label');
    textInfo.innerHTML = 'Please use <a href= "https://nano.dfd.io/" target="_blank" >NasNano</a> to scan this QR-Code.';
    textInfo.className = "qrcode-text";
    style = "background-color: white;\
    	width: 300px";
    Utils.addCssRule(".qrcode-text", style);
    qrcontainer.appendChild(textInfo);

    newLine = document.createElement('br');
    qrcontainer.appendChild(newLine);

	var completeBtn = document.createElement("BUTTON");
	completeBtn.className = "complete";
	completeBtn.innerHTML =  options.qrcode.completeTip || "COMPLETE/完成支付";
	style = "background-color: #000;\
	border-radius: 4px;\
	width: 295px; // 300px;\
	height: 40px;\
	// padding: 20px;\
	margin-top: 20px;\
	color: #fff;\
	";
	Utils.addCssRule(".complete", style);
	qrcontainer.appendChild(completeBtn);

    newLine = document.createElement('br');
    qrcontainer.appendChild(newLine);

	var cancelBtn = document.createElement("BUTTON");
	cancelBtn.className = "cancel";
	cancelBtn.innerHTML = options.qrcode.cancelTip || "CANCEL/取消支付";
	style = "background-color: #666;\
	border-radius: 4px;\
	width: 295px; // 300px;\
	height: 40px;\
	// padding: 20px;\
	margin-top: 10px;\
	margin-bottom: 20px;\
	color: #fff;\
	";
	Utils.addCssRule(".cancel", style);
	qrcontainer.appendChild(cancelBtn);

	var background = document.createElement("div");
	background.className = "qrcode-background";
	style = "position:absolute;\
	left:0;\
	top:0;\
	z-index:100;\
	height:100%;\
	width:100%;\
	background-color: rgba(0, 0, 0, 0.4);";
	Utils.addCssRule(".qrcode-background", style);
	background.appendChild(qrcontainer);

	var bodys = document.getElementsByTagName("body");
	var body = bodys[0];
	body.appendChild(background);

    qrcontainer.onclick = function(){	//if clicked on qr-container, qr-code should not be removed
        event.cancelBubble = true;
    };
	background.onclick = function () {
		// if (background !== null) {   //change: qrcode should be cancelled when click background
		// 	body.removeChild(background);
		// 	dismiss(false, options);
		// }
	};
	cancelBtn.onclick = function () {
		body.removeChild(background);
		background = null;
		dismiss(false, options);
	};
	completeBtn.onclick = function () {
		body.removeChild(background);
		background = null;
		dismiss(true, options);
	};

	return canvas;
};

var dismiss = function(complete, options) {
	if (typeof options.listener !== "undefined") {
		options.listener(options.serialNumber, complete);
	}
};

var showQRCode = function (content, options) {
	if (typeof window === "undefined") {
		return;
	}
	var container = options.qrcode.container;
	if (typeof container === "undefined") {
		container = createDeaultQRContainer(options);
	}
	QRCode.toCanvas(container, content, function (error) {
		if (error) {
			console.error(error);
		}
	  });
};

module.exports = {
	showQRCode: showQRCode
};
