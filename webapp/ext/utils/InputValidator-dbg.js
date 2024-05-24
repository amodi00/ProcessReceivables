/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/model/SimpleType"
], function (SimpleType) {
	return SimpleType.extend("fin.ar.process.receivables.ext.utils.InputValidator", {
		formatValue: function (oValue) {
			return oValue;
		},
		parseValue: function (oValue) {
			return oValue;
		},
		validateValue: function (oValue) {
			if ( !this._validateInputLength(oValue) ) {
				throw new sap.ui.model.ValidateException();
			} else {
				return true;
			}
		},
		
		_validateInputLength: function (sText) {
			var _nLineBreaks = (sText.match(/\n/g)||[]).length;
			var _nTextLength = sText.length;
			if (_nLineBreaks > 4 ||_nTextLength > 200) {
				return false;
			} else {
				return true;
			}
			
		}
	}); 
});
