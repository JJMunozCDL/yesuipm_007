/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"es.cdl.yesui5pm007/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});