/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
/* global jQuery */
sap.ui.define([
	"sap/ui/core/Fragment",
	"sap/m/Dialog",
	"sap/m/Button"
], function (Fragment, Dialog, Button) {
	return {
		createDialogWithTextArea: function (oController, sDialogName, sId) {
			return Fragment.load({
				name: sDialogName,
				id: oController.getView().createId(sId),
				controller: oController
			});
		},

		createPopoverDialog: function (oController, sDialogName, sId) {
			return Fragment.load({
				name: sDialogName,
				id: oController.getView().createId(sId),
				controller: oController
			});
		},

		getDialogElement: function (oController, sDlgId, sElementId) {
			return sap.ui.core.Fragment.byId(oController.getView().getId() + "--" + sDlgId, sElementId);
		},

		openMessageDialog: function (oParams) {
			var oDialog = new Dialog({
				title: oParams.title,
				type: oParams.type,
				state: oParams.state,
				content: new sap.m.Text({
					text: oParams.content
				}),
				beginButton: new Button({
					type: "Emphasized",
					text: oParams.btnText,
					press: function () {
						oDialog.close();
					}
				}),
				afterClose: function () {
					oDialog.destroy();
				}
			});

			oDialog.open();
		},

		updateDueDateGridPlot: function (oChart) {
			// var fnOverdueRuleCallback = jQuery.proxy(function (oDataPoint) {
			// 	var oContext = this.getContextForChartPoint(oChart, oDataPoint);
			// 	return oContext.getProperty("IsOverdue");
			// }, this);

			// var fnDueRuleCallback = jQuery.proxy(function (oDataPoint) {
			// 	var oContext = this.getContextForChartPoint(oChart, oDataPoint);
			// 	return !oContext.getProperty("IsOverdue");
			// }, this);
			
			var fnOverdueRuleCallback = function (oDataPoint) {
				var oContext = this.getContextForChartPoint(oChart, oDataPoint);
				return oContext.getProperty("IsOverdue");
			};

			var fnDueRuleCallback = function (oDataPoint) {
				var oContext = this.getContextForChartPoint(oChart, oDataPoint);
				return !oContext.getProperty("IsOverdue");
			};

			// Update color of due date grid
			oChart.vizUpdate({
				properties: {
					plotArea: {
						dataPointStyle: {
							rules: [{
								callback: fnOverdueRuleCallback.bind(this),
								properties: {
									color: "sapUiChartPaletteSemanticBad"
								}
							}, {
								callback: fnDueRuleCallback.bind(this),
								properties: {
									color: "sapUiChartPaletteSemanticGood"
								}
							}],
							others: {
								properties: {
									color: "sapUiChartPaletteSemanticBad"
								}
							}
						}
					}
				}
			});
			return; 
		},
		getContextForChartPoint: function (oChart, oDataPoint) {
			var oDataset = oChart.getDataset();
			var oBindingContext = oDataset.findContext(oDataPoint);
			return oBindingContext;
		}
	};
});