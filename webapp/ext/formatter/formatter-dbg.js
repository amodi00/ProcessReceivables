/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([], function () {
	return {
		formatDraftLockText: function (bActiveEntity, bHasDraftEntity, sInProcessByUser) {
			if (bActiveEntity && bHasDraftEntity && sInProcessByUser !== "") {
				return "{i18n>linkUnSavedChanges}";
			} else if (bActiveEntity && !bHasDraftEntity && sInProcessByUser === "") {
				return "{i18n>linkLockedBy}";
			} else {
				return "{i18n>Draft}";
			}
		},

		formatText: function (sText1, sText2, sText3, sText4, sText5) {
			var sText = "";

			if (sText2 !== "") {
				if (sText1.indexOf("{0}") !== -1) {
					sText = sText1.replace("{0}", sText2);
				} else {
					sText = sText1 + " " + sText2;
				}

			} else {
				sText = sText3 + "\n" + sText4;
			}

			return sText;
		},

		draftVisible: function (isActivEntity) {
			if (isActivEntity) {
				return true;
			} else {
				return false;
			}
		},

		isDefaultContact: function (bIsDefaultContact) {
			if (bIsDefaultContact) {
				return this.getView().getModel("i18n").getProperty("isDefaultContact");
			} else {
				return this.getView().getModel("i18n").getProperty("isNotDefaultContact");
			}
		},

		formatResubCriticality: function (sNumber) {
			var _sCriticality = "None";
			switch (sNumber) {
			case "1":
				_sCriticality = "Error";
				break;
			case "2":
				_sCriticality = "Warning";
				break;
			case "3":
				_sCriticality = "None";
				break;
			default:
				break;
			}
			return _sCriticality;
		},

		formatResubCriticalityIcon: function (sNumber) {
			var _sIcon = "";
			switch (sNumber) {
			case "1":
				_sIcon = "sap-icon://status-negative";
				break;
			case "2":
				_sIcon = "sap-icon://status-critical";
				break;
			case "3":
				_sIcon = "";
				break;
			default:
				break;
			}
			return _sIcon;
		},

		concatTexts: function (sText1, sText2) {
			return sText1 + " " + "(" + sText2 + ")";
		},
		
		formatOverDueText: function (bIsOverdue) {
			return bIsOverdue ? this.getView().getModel("i18n").getProperty("OverDueInDays") : this.getView().getModel("i18n").getProperty("DueInDays");
		},

		formatChartYValuesLong: function (sValue, sCurrency) {
			var formattedAmt = sap.ui.core.format.NumberFormat.getCurrencyInstance({
				decimals: 0,
				showMeasure: false
			}).format(Number(sValue), sCurrency);
			return formattedAmt;
		},

		formatChartYValuesShort: function (sValue, sCurrency) {
			var formattedAmt = sap.ui.core.format.NumberFormat.getCurrencyInstance({
				style: "short",
				showMeasure: false
			}).format(sValue, sCurrency);
			return formattedAmt;
		},

		formatAmount: function (sValue) {
			var oCurrencyFormatter = sap.ui.core.format.NumberFormat.getCurrencyInstance();
			var sAmtFormatted = oCurrencyFormatter.format(sValue);
			return sAmtFormatted;
		},
		
		formatPaymentTrendYValue: function (sValue) {
			return sap.ui.core.format.NumberFormat.getIntegerInstance({
				decimals: 0
			}).format(sValue);
		},
		
		formatWeightedDueDays: function (sValue) {
			var _oFloatFormatter = sap.ui.core.format.NumberFormat.getIntegerInstance({
				maxFractionDigits: 2
			});
			
			return _oFloatFormatter.format(sValue);
		}, 

        concatenateLatePaymentRiskParam: function (
            sParam,
            sParamValue
          ) {
            return sParam + ": " + sParamValue ;
          }
	};
});