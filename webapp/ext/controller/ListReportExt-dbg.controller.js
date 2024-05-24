/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	["fin/ar/process/receivables/ext/utils/FunctionCallExecutor"],
	function (FunctionCallExecutor) {
		return sap.ui.controller(
			"fin.ar.process.receivables.ext.controller.ListReportExt", {

				onInit: function () {
					var _oModel = this.getOwnerComponent().getModel();
					_oModel.attachBatchRequestCompleted(this._addFilterData.bind(this));
				},

				onAfterRendering: function () {
/*						//workaround: hide backend field as navigation to assignOpenItems does not work here for multiple semantic objects
						if (this.getView().byId("fin.ar.process.receivables::sap.suite.ui.generic.template.ListReport.view.ListReport::CollectionsAccount--listReport-BusinessPartner")) {
							this.getView().byId("fin.ar.process.receivables::sap.suite.ui.generic.template.ListReport.view.ListReport::CollectionsAccount--listReport-BusinessPartner").setVisible(false);
						}*/
						if (this.getView().byId("fin.ar.process.receivables::sap.suite.ui.generic.template.ListReport.view.ListReport::CollectionsAccount--BranchHeader")) {
							this.getView().byId("fin.ar.process.receivables::sap.suite.ui.generic.template.ListReport.view.ListReport::CollectionsAccount--BranchHeader").setVisible(false);
						}
					},

				_addFilterData: function (oEvent) {
					if (oEvent.getParameters("request").requests[0].url.indexOf("CollectionsAccount") > -1) {
						//workaround: hide backend field as navigation to assignOpenItems does not work here for multiple semantic objects
						if (this.getView().byId("fin.ar.process.receivables::sap.suite.ui.generic.template.ListReport.view.ListReport::CollectionsAccount--BranchHeader")) {
							this.getView().byId("fin.ar.process.receivables::sap.suite.ui.generic.template.ListReport.view.ListReport::CollectionsAccount--BranchHeader").setVisible(false);
						}
					}
					var _oSource = this.getView().byId("listReportFilter");
					if (this._bAlreadySetFilter) {
						return;
					}
					var _oModel = this.getView().getModel();
					this._bAlreadySetFilter = true;
					FunctionCallExecutor.getCompaniesForSegmentPromise(_oModel, {
						//						Segment: _sSegment
					}).then(function (oRes) {
						this._companies = [];
						for (var i = 0; i < oRes.results.length; i++) {
							this._companies.push({
								"Company": oRes.results[i].CompanyCode,
								"Segment": oRes.results[i].CollectionSegment
							});
						}
					}.bind(this));
				},

				adaptNavigationParameterExtension: function (oSelectionVariant, oObjectInfo) {
					if (oSelectionVariant.getSelectOption("CompanyCode")[0].Low === "") {
						var _sSegment = oSelectionVariant.getSelectOption("CollectionSegment")[0].Low;
						this._selectionVariant = oSelectionVariant;
						oSelectionVariant.removeSelectOption("CompanyCode");
						for (var i = 0; i < this._companies.length; i++) {
							if (_sSegment === this._companies[i].Segment) {
								oSelectionVariant.addSelectOption(
									"CompanyCode", "I", "EQ", this._companies[i].Company, ""
								);
							}
						}
						// FunctionCallExecutor.getCompaniesForSegmentPromise(_oModel, {
						// 	Segment: _sSegment
						// }).then(function (oRes) {
						// 	oSelectionVariant.removeSelectOption("CompanyCode");
						// 	for (var i = 0; i < oRes.results.length; i++) {
						// 		oSelectionVariant.addSelectOption(
						// 			"CompanyCode", "I", "EQ", oRes.results[i].CompanyCode, ""
						// 		);
						// 	}
						// }.bind(this));
					}
				},

				onNavigationTargetObtained: function (oEvent) {
					// Get company code
					//				var _sCompanyCode = this.getView().getBindingContext().getProperty("CompanyCode");

					// Set attributes
					//				if (_sCompanyCode === "") {
					jQuery.each(oEvent.getParameters().actions, function (index) {
						var _sHref = oEvent.getParameters().actions[index].getProperty("href").split("&sap-app-origin-hint")[0];
						_sHref = _sHref.replace("BusinessPartner=", "");
						if (_sHref.search("Receivables") === -1) {
							//Delete CompanyCode="" for other applications
							_sHref = _sHref.replace("CompanyCode=", "");
						}
						oEvent.getParameters().actions[index].setProperty("href", _sHref);
					});
					//				}
				}
			}
		);
	}
);