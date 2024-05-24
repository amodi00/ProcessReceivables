/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([],function(){return{generateDataModelForCreateDispute:function(d,D){var k=Object.keys(d);var p={Companies:[],Currencies:[],CompanyCodeVisible:false,CurrencyVisible:false};if(k.length>1){p.CompanyCodeVisible=true;}jQuery.each(k,function(i,c){p.Companies.push({CompanyCode:c,CompanyCodeName:d[c]});});k=Object.keys(D);if(k.length>1){p.CurrencyVisible=true;}jQuery.each(k,function(i,c){p.Currencies.push({Currency:c});});return p;},generateCreateDisputeCaseDlgModel:function(c){var _="";var C=[];if(c.length>0){_=c[0].CompanyCode;}jQuery.each(c,function(i,b){var d=b.CompanyCode+" ("+b.to_CompanyCode.CompanyCodeName+")";C.push({CompanyCode:b.CompanyCode,CompanyCodeName:d});});var a={"SelectedCompany":_,"Companies":C};return a;},generateDataModelForChangeStickyNote:function(c,b){var _=b.getProperty("to_CollsAccountStickyNote/NoteText");var a=c.getView().getModel("i18n");var d=a.getProperty("ChangeStickyNoteHeader");if(_===""){d=a.getProperty("CreateStickyNoteHeader");}return{noteText:_,headerText:d};},generateDataModelForCreateInvoiceNote:function(){return{invoiceNoteText:""};},generateDataModelForUpdateInvoiceNote:function(p,b){var _=b.getProperty("NoteText");var a=p.getProperty("Customer");var c=p.getProperty("CollectionSegment");var d=p.getProperty("CompanyCode");var e=b.getProperty("NoteID");return{noteText:_,Customer:a,CollectionSegment:c,CompanyCode:d,NoteId:e,noteTextState:""};},generateDataModelForDraftDlg:function(b){return{adminData:{"IsActiveEntity":b.getProperty("IsActiveEntity"),"HasDraftEntity":b.getProperty("HasDraftEntity")},generalData:{"InProcessByUser":b.getProperty("ChangedBy"),"LastChangeDateTime":b.getProperty("DraftLastChangedDateTime"),"LastChangedByUser":b.getProperty("ChangedBy")}};},generateDataModelForPostNoteListPopover:function(r){var _=r.results;return _;},generateDataModelForLatePaymentRiskPopover:function(r,c){var _=r;var t={};var T={};var p=_.ClrgDlyInDaysInflncgParam1Name;var P=_.ClrgDlyInDaysInflncgParam2Name;var s=_.ClrgDlyInDaysInflncgParam3Name;var R=c.getView().getModel("i18n").getResourceBundle().getText("RiskOfLatePaymentReasons");t="<ul><li>"+p+"</li><li>"+P+"</li><li>"+s+"</li></ul>";T=R+"<br><strong>"+p+"</strong></br><br><strong>"+P+"</strong></br><br><strong>"+s+"</strong></br></br>";return{Result:_,Text:t,TextMsg:T};},generateDataModelForContactCard:function(d){return{fn:d.FullName,role:null,title:null,org:d.Department,email:d.EmailAddress,work:d.PhoneNumber,cell:d.MobilePhoneNumber,fax:d.FaxNumber};},generateDataModelForDueDateGridChart:function(r){var _=r.results;var a=0;var b=[];var c=_[0].CollStrgyCurrency?_[0].CollStrgyCurrency:"";jQuery.each(_,function(i,d){b.push(Number(d.AmountInCollsStrategyCurrency));});a=Math.max.apply(Math,b);return{DueDateGridItems:_,ChartCurrency:[c],MaxAmount:a};},generateDataModelForPaymentTrendChart:function(a,r){var _=r.results;jQuery.each(_,function(i,d){d.FiscalYear=d.FiscalPeriod.slice(0,4);d.FiscalMonth=d.FiscalPeriod.slice(4,6);d.FiscalDate=d.FiscalPeriod.slice(0,4)+"/"+d.FiscalPeriod.slice(4,6);});return{PaymentTrendItems:_,ValueAxisTitle:[a]};}};});