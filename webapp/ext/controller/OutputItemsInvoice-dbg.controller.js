/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.controller("fin.ar.process.receivables.ext.controller.OutputItemsInvoice", {

	onInit: function () {
		//sKey and sObjectType have to be set according to the business object
		var sObjectType = "BILLING_DOCUMENT";
		var sMode = "D";
		//var sKey = "ActiveDeliveryDocument";
		var oController = this;
		var sCurrentKey = "";
		var oI18nModel = this.getOwnerComponent().getModel("i18n").getResourceBundle();
		this.getOwnerComponent().getModel().attachBatchRequestCompleted(function () {
			var _sBillingDocument = oController.getView().getBindingContext().getProperty("BillingDocument");
			sCurrentKey = this._formatBillingDocument(_sBillingDocument);
			if (sCurrentKey) {
				if (!oController._oOutputComponent) {
					oController._oOutputComponent = this.getOwnerComponent().runAsOwner(
						function () {
							return sap.ui.getCore().createComponent({
								name: "sap.ssuite.fnd.om.outputcontrol.outputitems",
								id: oController.createId("OutputComponent"),
								settings: {
									editMode: sMode,
									objectId: sCurrentKey,
									objectType: sObjectType,
									itemsTableNoDataText: oI18nModel.getText("NoDataText")
								}
							});
						});
					oController.byId("OutputManagementComponentContainer").setComponent(oController._oOutputComponent);
				} else if (sCurrentKey !== oController._oOutputComponent.getObjectId()) {
					oController._oOutputComponent.setObjectId(sCurrentKey);
					oController._oOutputComponent.refresh();
				}
			}
		}.bind(this));
	},

	_formatBillingDocument: function (sBillingDocument) {
		var _nTextLength = sBillingDocument.length;
		var _nMaxLength = 10;
		var _newString = sBillingDocument;
		for (var i = 0; i < _nMaxLength - _nTextLength; i++) {
			_newString = "0" + _newString;
		}
		return _newString;
	}
});