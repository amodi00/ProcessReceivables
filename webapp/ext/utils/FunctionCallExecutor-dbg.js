/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
/* global jQuery */
sap.ui.define([
	"sap/ui/model/Filter"
], function (Filter) {
	return {
		getCompaniesPromise: function (oModel, oParams) {
			var _oParams = oParams;
			return new Promise(function (resolve, reject) {
				oModel.read("/CollCustDsputCoCodeAssgmt", {
					filters: [new Filter("Customer", "EQ", _oParams.Customer,
						"CollectionSegment", "EQ", _oParams.CollectionSegment)],

					urlParameters: {
						"$expand": "to_CompanyCode"
					},
					success: function (oResponse) {
						resolve(oResponse);
					}
				});
			});
		},

		// getLogicalSystem: function (oController, oParams) {
		// 	var _oModel = oController.getView().getModel();
		// 	var _sCollectionSegment = oParams.CollectionSegment,
		// 		_sCompanyCode = oParams.CompanyCode,
		// 		_sFiscalYear = oParams.FiscalYear,
		// 		_sAccountingDocument = oParams.AccountingDocument,
		// 		_sAccountingDocumentItem = oParams.AccountingDocumentItem;
		// 	var _sRequestUrl = "/CollectionsInvoice(CollectionSegment='" + _sCollectionSegment + "',CompanyCode='" + _sCompanyCode +
		// 		"',FiscalYear='" + _sFiscalYear + "',AccountingDocument='" + _sAccountingDocument +
		// 		"',AccountingDocumentItem='" + _sAccountingDocumentItem + "')/to_CollectionsInvoice";
		// 	return new Promise(function (resolve, reject) {
		// 		_oModel.read(_sRequestUrl, {
		// 			urlParameters: {
		// 				"$expand": "to_CollectionsInvoice"
		// 			},
		// 			success: function (oResponse) {
		// 				resolve(oResponse);
		// 			}
		// 		});
		// 	});
		// },

		getCompaniesForSegmentPromise: function (oModel, oParams) {
			var _oParams = oParams;
			return new Promise(function (resolve, reject) {
				oModel.read("/CollsSgmtCompanyCodeAssgmt", {
//					filters: [new Filter("CollectionSegment", "EQ", _oParams.Segment)],
					success: function (oResponse) {
						resolve(oResponse);
					}
				});
			});
		},


		executeGetBillingDocumentURL: function (oController, oBindingContext) {
			var _oI18n = oController.getView().getModel("i18n");

			var _oParams = {
				"CollectionSegment": oBindingContext.getProperty("CollectionSegment"),
				"CompanyCode": oBindingContext.getProperty("CompanyCode"),
				"AccountingDocument": oBindingContext.getProperty("AccountingDocument"),
				"FiscalYear": oBindingContext.getProperty("FiscalYear"),
				"AccountingDocumentItem": oBindingContext.getProperty("AccountingDocumentItem")
			};

			var _fnInvokeFunction = function () {
				return this._createInvokeFunction(oController, "/DetermineURLForExtLinkdObj", _oParams);
			}.bind(this);
			var _oParamsAfterSecuredExecution = {
				"sActionLabel": _oI18n.getProperty("ActionGetBillingDocumentURL"),
				"dataloss": {
					"popup": false
				}
			};
			return oController.extensionAPI.securedExecution(_fnInvokeFunction, _oParamsAfterSecuredExecution);
		},

		executeChangeSticky: function (oController) {
			var _oBindingContext = oController.getView().getBindingContext();
			var _oI18n = oController.getView().getModel("i18n");
			var _sNoteText = oController._oDialogs.changeStickyNoteDlg.getModel().getProperty("/noteText");
			var _oParams = {
				"Customer": _oBindingContext.getProperty("Customer"),
				"CompanyCode": _oBindingContext.getProperty("CompanyCode"),
				"CollectionSegment": _oBindingContext.getProperty("CollectionSegment"),
				"Notetext": _sNoteText
			};
			var _fnInvokeFunction = function () {
				return this._createInvokeFunction(oController, "/ChangeStickyNoteContent", _oParams);
			}.bind(this);
			var _oParamsAfterSecuredExecution = {
				"sActionLabel": _oI18n.getProperty("ActionChangeStickyNote"),
				"dataloss": {
					"popup": false
				}
			};
			return oController.extensionAPI.securedExecution(_fnInvokeFunction, _oParamsAfterSecuredExecution);
		},

		_createInvokeFunction: function (oController, sFunctionName, oParams) {
			var _oExtensionAPI = oController.extensionAPI;
			return _oExtensionAPI.invokeActions(sFunctionName, [], oParams);
		},

		executeIncludeInvoiceInCorrespondence: function (oController, sCreateBillingDocument, sIncludeInCorrespondence, fnSuccessExecuted, fnError) {
			var _aSelectedInvoices = oController.getView().byId("CollectionsInvoice::responsiveTable").getSelectedItems();
			var _sCollectionSegment = oController.getView().getBindingContext().getProperty("CollectionSegment");
			var _sCustomer = oController.getView().getBindingContext().getProperty("Customer");
			var _oParamsAfterSecuredExecution = {
				"sActionLabel": oController.getView().getModel("i18n").getProperty("IncludeInCorrespondence"),
				"dataloss": {
					"popup": false
				}
			};
			var _aExecutePromise = [];

			if (_aSelectedInvoices.length > 0) {
				jQuery.each(_aSelectedInvoices, function (index, item) {
					var _oParams = {
						"Customer": _sCustomer,
						"CollectionSegment": _sCollectionSegment,
						"CompanyCode": item.getBindingContext().getProperty("CompanyCode"),
						"FiscalYear": item.getBindingContext().getProperty("FiscalYear"),
						"AccountingDocument": item.getBindingContext().getProperty("AccountingDocument"),
						"AccountingDocumentItem": item.getBindingContext().getProperty("AccountingDocumentItem"),
						"BillingDocumentIsAttached": sCreateBillingDocument,
						"JournalEntryItemIsIncluded": sIncludeInCorrespondence
					};
					_aExecutePromise.push(this._createInvokeFunction(oController, "/MailJournalEntryItem", _oParams));
				}.bind(this));
			}
			var _fnInvokeFunction = Promise.all(_aExecutePromise);

			return oController.extensionAPI.securedExecution(_fnInvokeFunction.then(fnSuccessExecuted).catch(fnError),
				_oParamsAfterSecuredExecution);

		},

		executeCreateInvoiceNote: function (text, oController, fnSuccessExecuted, fnError) { 
			var _aSelectedItemsSegment = oController.getView().byId("CollectionsInvoice::responsiveTable").getSelectedItems();
			var _aSelectedItemsCompanyCode = oController.getView().byId("CollectionsInvoiceCompanyCode::responsiveTable").getSelectedItems();
			var _oParamsAfterSecuredExecution = {
				"sActionLabel": oController.getView().getModel("i18n").getProperty("CreateNoteForInvoice"),
				"dataloss": {
					"popup": false
				}
			};
			var _aExecutePromise = [];

			if (_aSelectedItemsSegment.length > 0) {
				jQuery.each(_aSelectedItemsSegment, function (index, item) {
					var _oParams = {
						"Customer": item.getBindingContext().getProperty("Customer"),
						"CollectionSegment": item.getBindingContext().getProperty("CollectionSegment"),
						"CompanyCode": item.getBindingContext().getProperty("CompanyCode"),
						"FiscalYear": item.getBindingContext().getProperty("FiscalYear"),
						"AccountingDocument": item.getBindingContext().getProperty("AccountingDocument"),
						"AccountingDocumentItem": item.getBindingContext().getProperty("AccountingDocumentItem"),
						"Notetext": text
					};
					_aExecutePromise.push(this._createInvokeFunction(oController, "/CreateNoteForInvoice", _oParams));
				}.bind(this));

			} else if (_aSelectedItemsCompanyCode.length > 0) {
				jQuery.each(_aSelectedItemsCompanyCode, function (index, item) {
					var _oParams = {
						"Customer": item.getBindingContext().getProperty("Customer"),
						"CollectionSegment": "",
						"CompanyCode": item.getBindingContext().getProperty("CompanyCode"),
						"FiscalYear": item.getBindingContext().getProperty("FiscalYear"),
						"AccountingDocument": item.getBindingContext().getProperty("AccountingDocument"),
						"AccountingDocumentItem": item.getBindingContext().getProperty("AccountingDocumentItem"),
						"Notetext": text
					};
					_aExecutePromise.push(this._createInvokeFunction(oController, "/CreateNoteForInvoice", _oParams));
				}.bind(this));
			}

			var _fnInvokeFunction = Promise.all(_aExecutePromise);

			return oController.extensionAPI.securedExecution(_fnInvokeFunction.then(fnSuccessExecuted).catch(fnError),
				_oParamsAfterSecuredExecution);
		},

		executeCreateDisputeCaseForInvoices: function (oController, oParams, fnSuccessExecuted, fnError) {
			var _oBindingContext = oController.getView().byId("CollectionsInvoice::responsiveTable").getBindingContext();
			var _aSelectedItems = oController.getView().byId("CollectionsInvoice::responsiveTable").getSelectedItems();
			var _oParamsAfterSecuredExecution = {
				"sActionLabel": oController.getView().getModel("i18n").getProperty("CreateDisputeCase"),
				"dataloss": {
					"popup": false
				}
			};
			var _aInvokeFunctions = [];
			jQuery.each(_aSelectedItems, function (index, item) {
				var _oParams = {
					"AccountingDocument": item.getBindingContext().getProperty("AccountingDocument"),
					"AccountingDocumentItem": item.getBindingContext().getProperty("AccountingDocumentItem"),
					"CollectionSegment": item.getBindingContext().getProperty("CollectionSegment"),
					"CompanyCode": item.getBindingContext().getProperty("CompanyCode"),
					"Customer": item.getBindingContext().getProperty("Customer"),
					"FiscalYear": item.getBindingContext().getProperty("FiscalYear"),
					"Partner": _oBindingContext.getProperty("BusinessPartner"),
					"CollSegment": _oBindingContext.getProperty("CollectionSegment"),
					"Leadingcompanycode": oParams.CompanyCode,
					"Leadingcustomer": _oBindingContext.getProperty("Customer"),
					"Leadingcurrency": oParams.Currency
				};
				_aInvokeFunctions.push(this._createInvokeFunction(oController, "/CreateDisputeCase", _oParams));
			}.bind(this));
			var _fnInvokeFunctions = Promise.all(_aInvokeFunctions);

			return oController.extensionAPI.securedExecution(_fnInvokeFunctions.then(fnSuccessExecuted).catch(fnError),
				_oParamsAfterSecuredExecution);
		},

		executeCreateCustomerDisputeCase: function (oController, oParams) {
			var _oBindingContext = oController.getView().getBindingContext();
			var _oParams = {
				"Customer": _oBindingContext.getProperty("Customer"),
				"CompanyCode": oParams.CompanyCode
			};
			var _oParametersAfterSecuredExecution = {
				"sActionLabel": "",
				"dataloss": {
					"popup": false
				}
			};
			var _fnInvokeFunction = function () {
				return this._createInvokeFunction(oController, "/CrteDsputCaseWthoutJrnlEntrRef", _oParams);
			}.bind(this);
			return oController.extensionAPI.securedExecution(_fnInvokeFunction, _oParametersAfterSecuredExecution);
		},

		executeCompleteCustomerContact: function (oController) {
			var oParameters = {
				"Customer": oController.getView().getBindingContext().getProperty("Customer"),
				"CollectionSegment": oController.getView().getBindingContext().getProperty("CollectionSegment"),
				"CompanyCode": oController.getView().getBindingContext().getProperty("CompanyCode")
			};

			var _fnInvokeFunction = function () {
				return this._createInvokeFunction(oController, "/CompleteCustomerContact", oParameters);
			}.bind(this);
			var _oParametersAfterSecuredExecution = {
				"sActionLabel": oController.getView().getModel("i18n").getProperty("FinishCustomerContact"),
				"dataloss": {
					"popup": false
				}
			};
			return oController.extensionAPI.securedExecution(_fnInvokeFunction, _oParametersAfterSecuredExecution);
		},

		executeCreateInvoiceResubmission: function (oController, fnSuccessExecuted, fnError) {
			var _oSelectedItems = oController.getView().byId("CollectionsInvoice::responsiveTable").getSelectedItems();
			var _oParametersAfterSecuredExecution = {
				"sActionLabel": oController.getView().getModel("i18n").getProperty("CreateResubmission"),
				"dataloss": {
					"popup": false
				}
			};
			var _aInvokeFunctions = [];
			jQuery.each(_oSelectedItems, function (index, item) {
				var _oParameters = {
					"AccountingDocument": item.getBindingContext().getProperty("AccountingDocument"),
					"AccountingDocumentItem": item.getBindingContext().getProperty("AccountingDocumentItem"),
					"CollectionSegment": item.getBindingContext().getProperty("CollectionSegment"),
					"CompanyCode": item.getBindingContext().getProperty("CompanyCode"),
					"Customer": item.getBindingContext().getProperty("Customer"),
					"FiscalYear": item.getBindingContext().getProperty("FiscalYear"),
					"Partner": oController.getView().getBindingContext().getProperty("BusinessPartner"),
					"CollSegment": oController.getView().getBindingContext().getProperty("CollectionSegment")
				};
				_aInvokeFunctions.push(this._createInvokeFunction(oController, "/CreateResubmission", _oParameters));
			}.bind(this));
			var _fnPromiseAllFunction = Promise.all(_aInvokeFunctions);

			return oController.extensionAPI.securedExecution(_fnPromiseAllFunction.then(fnSuccessExecuted).catch(fnError),
				_oParametersAfterSecuredExecution);
		},

		executeCompleteResubmission: function (oController, fnSuccessExecuted, fnError) {
			var _oSelectedItems = oController.getView().byId("CollectionsResubmission::responsiveTable").getSelectedItems();
			var _oParametersAfterSecuredExecution = {
				"sActionLabel": oController.getView().getModel("i18n").getProperty("CompleteResubmission"),
				"dataloss": {
					"popup": false
				}
			};
			var _aInvokeFunctions = [];
			jQuery.each(_oSelectedItems, function (index, item) {
				var _oParameters = {
					"ResubmissionUUID": item.getBindingContext().getProperty("ResubmissionUUID"),
					"DraftUUID": "00000000-0000-0000-0000-000000000000",
					"IsActiveEntity": item.getBindingContext().getProperty("IsActiveEntity")
				};
				_aInvokeFunctions.push(this._createInvokeFunction(oController, "/Complete", _oParameters));
			}.bind(this));
			var _fnPromiseAllFunction = Promise.all(_aInvokeFunctions);
			return oController.extensionAPI.securedExecution(_fnPromiseAllFunction.then(fnSuccessExecuted).catch(fnError),
				_oParametersAfterSecuredExecution);
		},

		executeCreatePromiseToPay: function (oController, fnSuccessExecuted, fnError) {
			var _oSelectedItems = oController.getView().byId("CollectionsInvoice::responsiveTable").getSelectedItems();
			var _oParametersAfterSecuredExecution = {
				"sActionLabel": oController.getView().getModel("i18n").getProperty("CreatePromiseToPay"),
				"dataloss": {
					"popup": false
				}
			};
			var _aInvokeFunctions = [];
			jQuery.each(_oSelectedItems, function (index, item) {
				var _oParameters = {
					"AccountingDocument": item.getBindingContext().getProperty("AccountingDocument"),
					"AccountingDocumentItem": item.getBindingContext().getProperty("AccountingDocumentItem"),
					"CollectionSegment": item.getBindingContext().getProperty("CollectionSegment"),
					"CompanyCode": item.getBindingContext().getProperty("CompanyCode"),
					"Customer": item.getBindingContext().getProperty("Customer"),
					"FiscalYear": item.getBindingContext().getProperty("FiscalYear"),
					"Leadingcustomer": item.getBindingContext().getProperty("Customer")
				};

				_aInvokeFunctions.push(this._createInvokeFunction(oController, "/CreatePromiseToPay", _oParameters));
			}.bind(this));

			var _fnPromiseAllFunction = Promise.all(_aInvokeFunctions);
			return oController.extensionAPI.securedExecution(_fnPromiseAllFunction.then(fnSuccessExecuted).catch(fnError),
				_oParametersAfterSecuredExecution);
		},

		executeRevokePromiseToPay: function (oController) {
			var _oSelectedItem = oController.getView().byId("PromiseToPayCollectionSegment::responsiveTable").getSelectedItem();
			var _oParametersAfterSecuredExecution = {
				"sActionLabel": oController.getView().getModel("i18n").getProperty("ActionWithdrawPromiseToPay"),
				"dataloss": {
					"popup": false
				}
			};
			var _oParameters = {
				"PromiseToPayUUID": _oSelectedItem.getBindingContext().getProperty("PromiseToPayUUID"),
				"DraftUUID": _oSelectedItem.getBindingContext().getProperty("DraftUUID"),
				"IsActiveEntity": _oSelectedItem.getBindingContext().getProperty("IsActiveEntity")
			};
			var _fnInvokeFunction = function () {
				return this._createInvokeFunction(oController, "/RevokePromiseToPay", _oParameters);
			}.bind(this);

			return oController.extensionAPI.securedExecution(_fnInvokeFunction, _oParametersAfterSecuredExecution);

		},

		executeSetDefaultContract: function (oController) {
			var _oSelectedItem = oController.getView().byId("CollectionsContacts::responsiveTable").getSelectedItem();
			var _oParameters = {
				"RelationshipNumber": _oSelectedItem.getBindingContext().getProperty("RelationshipNumber"),
				"BusinessPartnerCompany": _oSelectedItem.getBindingContext().getProperty("BusinessPartnerCompany"),
				"BusinessPartnerPerson": _oSelectedItem.getBindingContext().getProperty("BusinessPartnerPerson"),
				"CollectionSegment": _oSelectedItem.getBindingContext().getProperty("CollectionSegment"),
				"DraftUUID": "00000000-0000-0000-0000-000000000000",
				"IsActiveEntity": true
			};
			var _oParametersAfterSecuredExecution = {
				"sActionLabel": oController.getView().getModel("i18n").getProperty("AssignAsDefaultContact"),
				"dataloss": {
					"popup": false
				}
			};

			var _fnInvokeFunction = function () {
				return this._createInvokeFunction(oController, "/AssignAsDefaultContact", _oParameters);
			}.bind(this);

			return oController.extensionAPI.securedExecution(_fnInvokeFunction, _oParametersAfterSecuredExecution);
		},

		executePostInvoiceNote: function (oController, oEvent) {
			var oParameters = {
				"Customer": oController.getView().getBindingContext().getProperty("Customer"),
				"CollectionSegment": oController.getView().getBindingContext().getProperty("CollectionSegment"),
				"CompanyCode": oController.getView().getBindingContext().getProperty("CompanyCode"),
				"FiscalYear": oController.getView().getBindingContext().getProperty("FiscalYear"),
				"AccountingDocument": oController.getView().getBindingContext().getProperty("AccountingDocument"),
				"AccountingDocumentItem": oController.getView().getBindingContext().getProperty("AccountingDocumentItem"),
				"Notetext": oEvent.getParameter("value")
			};

			var fnFunction = function () {
				return this._createInvokeFunction(oController, "/CreateNoteForInvoice", oParameters);
			}.bind(this);

			var _oParametersAfterSecuredExecution = {
				"sActionLabel": oController.getView().getModel("i18n").getProperty("CreateNote"),
				"dataloss": {
					"popup": false
				}
			};
			return oController.extensionAPI.securedExecution(fnFunction, _oParametersAfterSecuredExecution);
		},

		executePostNote: function (oController, oEvent) {
			var oParameters = {
				"Customer": oController.getView().getBindingContext().getProperty("Customer"),
				"CollectionSegment": oController.getView().getBindingContext().getProperty("CollectionSegment"),
				"CompanyCode": "",
				"Notetext": oEvent.getParameter("value")
			};

			var fnFunction = function () {
				return this._createInvokeFunction(oController, "/CreateNote", oParameters);
			}.bind(this);

			var _oParametersAfterSecuredExecution = {
				"sActionLabel": oController.getView().getModel("i18n").getProperty("CreateNote"),
				"dataloss": {
					"popup": false
				}
			};
			return oController.extensionAPI.securedExecution(fnFunction, _oParametersAfterSecuredExecution);
		},

		executeUpdatePostNote: function (oController, oParams) {
			var oParameters = {
				"Customer": oParams.Customer,
				"CollectionSegment": oParams.CollectionSegment,
				"CompanyCode": oParams.CompanyCode,
				"Noteid": oParams.Noteid,
				"Notetext": oParams.Notetext
			};
			var fnFunction = function () {
				return this._createInvokeFunction(oController, "/ChangeNoteContent", oParameters);
			}.bind(this);
			var _oParametersAfterSecuredExecution = {
				"sActionLabel": oController.getView().getModel("i18n").getProperty("CreateNote"),
				"dataloss": {
					"popup": false
				}
			};
			return oController.extensionAPI.securedExecution(fnFunction, _oParametersAfterSecuredExecution);
		},

		executeAuthCheckBeforeNav: function (oController, sCheckAuthFuncName, oParams) {
			var fnFunction = function () {
				return this._createInvokeFunction(oController, sCheckAuthFuncName, oParams);
			}.bind(this);
			var _oParametersAfterSecuredExecution = {
				"sActionLabel": "",
				"dataloss": {
					"popup": false
				}
			};
			return oController.extensionAPI.securedExecution(fnFunction, _oParametersAfterSecuredExecution);
		},

		getPostNote: function (oController, oParams) {
			var _oModel = oController.getView().getModel();
			var _sCollectionSegment = oParams.CollectionSegment,
				_sCompanyCode = oParams.CompanyCode,
				_sFiscalYear = oParams.FiscalYear,
				_sAccountingDocument = oParams.AccountingDocument,
				_sAccountingDocumentItem = oParams.AccountingDocumentItem;
			var _sRequestUrl = "/CollectionsInvoice(CollectionSegment='" + _sCollectionSegment + "',CompanyCode='" + _sCompanyCode +
				"',FiscalYear='" + _sFiscalYear + "',AccountingDocument='" + _sAccountingDocument +
				"',AccountingDocumentItem='" + _sAccountingDocumentItem + "')/to_CollectionsInvoiceNote";
			return new Promise(function (resolve, reject) {
				_oModel.read(_sRequestUrl, {
					urlParameters: {
						"$orderby": "CreationDateTime desc",
						"$expand": "to_CreatedByContactCard"
					},
					success: function (oResponse) {
						resolve(oResponse);
					}
				});
			});
		},

        getLatePaymentRiskFactors: function (oController, oParams) {
			var _oModel = oController.getView().getModel();
			var _sCompanyCode = oParams.CompanyCode,
            _sCollectionSegment = oParams.CollectionSegment,
				_sAccountingDocument = oParams.AccountingDocument,
				_sFiscalYear = oParams.FiscalYear,
				_sAccountingDocumentItem = oParams.AccountingDocumentItem;
                var _sRequestUrl = "/CollectionsInvoice(CollectionSegment='" + _sCollectionSegment + "',CompanyCode='" + _sCompanyCode +
				"',FiscalYear='" + _sFiscalYear + "',AccountingDocument='" + _sAccountingDocument +
				"',AccountingDocumentItem='" + _sAccountingDocumentItem + "')/to_CollsInvcPaytDelayPrediction";



			return new Promise(function (resolve, reject) {
				_oModel.read(_sRequestUrl, {
					urlParameters: {
					// 	"$orderby": "CreationDateTime desc",
					// 	"$expand": "to_CreatedByContactCard"
					},
					success: function (oResponse) {
						resolve(oResponse);
					}
				});
			});
		},

		getChartData: function (oController, oParams) {
			var _oModel = oController.getView().getModel();
			var _sUrl = oParams.url;
			return new Promise(function (resolve, reject) {
				_oModel.read(_sUrl, {
					urlParameters: {
						"$top": 100,
						"$skip": 0
					},
					success: function (oResponse) {
						resolve(oResponse);
					}
				});
			});
		},

        _onBeforeSemanticObjPopoverOpen: function (oEvent) {
            var _oParameters = oEvent.getParameters();
            var _oAttributes = _oParameters.semanticAttributes;
            var _sSemanticObject = _oParameters.semanticObject;
      
            if (_oAttributes && _sSemanticObject === "FinanceApplicationLog") {
              _oAttributes.LogNumber = this.fillWithLeadingZeroes(
                _oAttributes.LogNumber
              );
            }

            if (_oAttributes && _oAttributes.CompanyCode === "") {
                delete _oAttributes.CompanyCode;
                delete _oAttributes.CompanyCodeName;                
            }            

        },

		deleteCustomerContact: function (oController, oParams) {
			var _oModel = oController.getView().getModel();
			var _sUrl = "/CollectionContact(RelationshipNumber='" + oParams.RelationshipNumber + "',BusinessPartnerCompany='" + oParams.BusinessPartnerCompany +
				"',BusinessPartnerPerson='" + oParams.BusinessPartnerPerson + "',CollectionSegment='" + oParams.CollectionSegment +
				"',DraftUUID=guid'00000000-0000-0000-0000-000000000000',IsActiveEntity=true)";
			return new Promise(function (resolve, reject) {
				_oModel.remove(_sUrl, {
					//method: "DELETE",
					refreshAfterChange: true,
					success: function (data, oRes) {
						resolve(oRes);
					},
					error: function (e) {
						reject(e);
					}
				});
			});
		}
	};
});