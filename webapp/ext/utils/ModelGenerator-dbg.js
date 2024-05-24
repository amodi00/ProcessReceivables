/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
/* global jQuery */
sap.ui.define([], function () {
	return {
		generateDataModelForCreateDispute: function (oDataCompanies, oDataCurrencies) {
			var aKeys = Object.keys(oDataCompanies);
			var oParams = {
				Companies: [],
				Currencies: [],
				CompanyCodeVisible: false,
				CurrencyVisible: false
			};
			if (aKeys.length > 1) {
				oParams.CompanyCodeVisible = true; 
			}
			jQuery.each(aKeys, function (index, companycode) {
				oParams.Companies.push({
					CompanyCode: companycode,
					CompanyCodeName: oDataCompanies[companycode]
				});
			});
			
			aKeys = Object.keys(oDataCurrencies);
			if (aKeys.length > 1) {
				oParams.CurrencyVisible = true;
			}
			jQuery.each(aKeys, function (index, currency) {
				oParams.Currencies.push({
					Currency: currency
				});
			});
			return oParams;
		},

		generateCreateDisputeCaseDlgModel: function (aCompanies) {
			var _sCompany = "";
			var aCompaniesWithNames = [];
			if (aCompanies.length > 0) {
				_sCompany = aCompanies[0].CompanyCode;
			}
			jQuery.each(aCompanies, function (index, company) {
				var _sName = company.CompanyCode + " (" + company.to_CompanyCode.CompanyCodeName + ")";
				aCompaniesWithNames.push({
					CompanyCode: company.CompanyCode,
					CompanyCodeName: _sName
				});
			});	
			var _localModel = {
				"SelectedCompany": _sCompany,
				"Companies": aCompaniesWithNames
			};
			return _localModel;
		},
		
		generateDataModelForChangeStickyNote: function (oController, oBindingContext) {
			var _sNoteText = oBindingContext.getProperty("to_CollsAccountStickyNote/NoteText");
			var _oI18n = oController.getView().getModel("i18n");
			var _sHeaderText = _oI18n.getProperty("ChangeStickyNoteHeader");
			if (_sNoteText === "") {
				_sHeaderText = _oI18n.getProperty("CreateStickyNoteHeader");
			}
			return {
				noteText: _sNoteText,
				headerText: _sHeaderText
			};
		},
		
		generateDataModelForCreateInvoiceNote: function () {
			return {
				invoiceNoteText: ""	
			};
		},
		
		generateDataModelForUpdateInvoiceNote: function (oParentBindingContext, oBindingContext) {
			var _sNoteText = oBindingContext.getProperty("NoteText");
			var _sCustomer = oParentBindingContext.getProperty("Customer");
			var _sCollectionSegment = oParentBindingContext.getProperty("CollectionSegment");
			var _sCompanyCode = oParentBindingContext.getProperty("CompanyCode");
			var _sNoteId = oBindingContext.getProperty("NoteID");
			
			return {
				noteText: _sNoteText,
				Customer: _sCustomer,
				CollectionSegment: _sCollectionSegment,
				CompanyCode: _sCompanyCode,
				NoteId: _sNoteId,
				noteTextState: ""
			};
		},
		
		generateDataModelForDraftDlg: function (oBindingContext) {
			return {
				adminData: {
					"IsActiveEntity": oBindingContext.getProperty("IsActiveEntity"),
					"HasDraftEntity": oBindingContext.getProperty("HasDraftEntity")
				},
				generalData: {
					"InProcessByUser": oBindingContext.getProperty("ChangedBy"),
					"LastChangeDateTime": oBindingContext.getProperty("DraftLastChangedDateTime"),
					"LastChangedByUser": oBindingContext.getProperty("ChangedBy")	
				}
			};
		},
		
		generateDataModelForPostNoteListPopover: function (oResponse) {
			var _oData = oResponse.results;
			return _oData;
		},

        generateDataModelForLatePaymentRiskPopover: function (oResponse, oController) {
			var _oData = oResponse; 
            var oText = {}; 
            var oTextMessageStrip = {}; 
            var sParamName1 = _oData.ClrgDlyInDaysInflncgParam1Name;
            var sParamName2 = _oData.ClrgDlyInDaysInflncgParam2Name;
            var sParamName3 = _oData.ClrgDlyInDaysInflncgParam3Name;
            var sReason = oController.getView().getModel("i18n").getResourceBundle().getText("RiskOfLatePaymentReasons");

                oText = 
                "<ul><li>"+sParamName1+"</li><li>"+sParamName2+"</li><li>"+sParamName3+"</li></ul>";

                oTextMessageStrip = sReason +
                "<br><strong>"+sParamName1+"</strong></br><br><strong>"+sParamName2+"</strong></br><br><strong>"+sParamName3+"</strong></br></br>";

         
             return {Result: _oData,
                     Text : oText, 
                     TextMsg: oTextMessageStrip} ;  
		
		},
		
		generateDataModelForContactCard: function (oData) {
			return {
				fn: oData.FullName,
				role: null,
				title: null,
				org: oData.Department,
				email: oData.EmailAddress,
				work: oData.PhoneNumber,
				cell: oData.MobilePhoneNumber,
				fax: oData.FaxNumber
			};
		},
		
		generateDataModelForDueDateGridChart: function (oResponse) {
			var _oData = oResponse.results;
			var _nMaxValue = 0;
			var _aAmounts = [];
			var _sCurrency = _oData[0].CollStrgyCurrency ? _oData[0].CollStrgyCurrency : "";
			jQuery.each(_oData, function (index, data) {
				_aAmounts.push(Number(data.AmountInCollsStrategyCurrency));
			});
			_nMaxValue = Math.max.apply(Math, _aAmounts);
			return {
				DueDateGridItems: _oData,
				ChartCurrency: [_sCurrency],
				MaxAmount: _nMaxValue
			};
		},
		
		generateDataModelForPaymentTrendChart: function (sAxisText, oResponse) {
			var _oData = oResponse.results;
			jQuery.each(_oData, function (index, data) {
				data.FiscalYear = data.FiscalPeriod.slice(0, 4);
				data.FiscalMonth = data.FiscalPeriod.slice(4, 6);
				data.FiscalDate = data.FiscalPeriod.slice(0, 4) + "/" + data.FiscalPeriod.slice(4, 6);                   
			});
			return {
				PaymentTrendItems: _oData,
				ValueAxisTitle: [sAxisText]
			};
		}
	};
});