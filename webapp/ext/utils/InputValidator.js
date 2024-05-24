/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/model/SimpleType"],function(S){return S.extend("fin.ar.process.receivables.ext.utils.InputValidator",{formatValue:function(v){return v;},parseValue:function(v){return v;},validateValue:function(v){if(!this._validateInputLength(v)){throw new sap.ui.model.ValidateException();}else{return true;}},_validateInputLength:function(t){var _=(t.match(/\n/g)||[]).length;var a=t.length;if(_>4||a>200){return false;}else{return true;}}});});
