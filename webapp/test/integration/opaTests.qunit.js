/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"es.cdl.yesui5pm003/test/integration/AllJourneys"
	], function () {
		QUnit.start();
	});
});