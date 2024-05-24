/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/model/Filter"],function(F){return{getCompaniesPromise:function(m,p){var _=p;return new Promise(function(r,a){m.read("/CollCustDsputCoCodeAssgmt",{filters:[new F("Customer","EQ",_.Customer,"CollectionSegment","EQ",_.CollectionSegment)],urlParameters:{"$expand":"to_CompanyCode"},success:function(R){r(R);}});});},getCompaniesForSegmentPromise:function(m,p){var _=p;return new Promise(function(r,a){m.read("/CollsSgmtCompanyCodeAssgmt",{success:function(R){r(R);}});});},executeGetBillingDocumentURL:function(c,b){var _=c.getView().getModel("i18n");var a={"CollectionSegment":b.getProperty("CollectionSegment"),"CompanyCode":b.getProperty("CompanyCode"),"AccountingDocument":b.getProperty("AccountingDocument"),"FiscalYear":b.getProperty("FiscalYear"),"AccountingDocumentItem":b.getProperty("AccountingDocumentItem")};var d=function(){return this._createInvokeFunction(c,"/DetermineURLForExtLinkdObj",a);}.bind(this);var e={"sActionLabel":_.getProperty("ActionGetBillingDocumentURL"),"dataloss":{"popup":false}};return c.extensionAPI.securedExecution(d,e);},executeChangeSticky:function(c){var _=c.getView().getBindingContext();var a=c.getView().getModel("i18n");var b=c._oDialogs.changeStickyNoteDlg.getModel().getProperty("/noteText");var d={"Customer":_.getProperty("Customer"),"CompanyCode":_.getProperty("CompanyCode"),"CollectionSegment":_.getProperty("CollectionSegment"),"Notetext":b};var e=function(){return this._createInvokeFunction(c,"/ChangeStickyNoteContent",d);}.bind(this);var f={"sActionLabel":a.getProperty("ActionChangeStickyNote"),"dataloss":{"popup":false}};return c.extensionAPI.securedExecution(e,f);},_createInvokeFunction:function(c,f,p){var _=c.extensionAPI;return _.invokeActions(f,[],p);},executeIncludeInvoiceInCorrespondence:function(c,C,i,s,e){var _=c.getView().byId("CollectionsInvoice::responsiveTable").getSelectedItems();var a=c.getView().getBindingContext().getProperty("CollectionSegment");var b=c.getView().getBindingContext().getProperty("Customer");var d={"sActionLabel":c.getView().getModel("i18n").getProperty("IncludeInCorrespondence"),"dataloss":{"popup":false}};var f=[];if(_.length>0){jQuery.each(_,function(h,j){var k={"Customer":b,"CollectionSegment":a,"CompanyCode":j.getBindingContext().getProperty("CompanyCode"),"FiscalYear":j.getBindingContext().getProperty("FiscalYear"),"AccountingDocument":j.getBindingContext().getProperty("AccountingDocument"),"AccountingDocumentItem":j.getBindingContext().getProperty("AccountingDocumentItem"),"BillingDocumentIsAttached":C,"JournalEntryItemIsIncluded":i};f.push(this._createInvokeFunction(c,"/MailJournalEntryItem",k));}.bind(this));}var g=Promise.all(f);return c.extensionAPI.securedExecution(g.then(s).catch(e),d);},executeCreateInvoiceNote:function(t,c,s,e){var _=c.getView().byId("CollectionsInvoice::responsiveTable").getSelectedItems();var a=c.getView().byId("CollectionsInvoiceCompanyCode::responsiveTable").getSelectedItems();var b={"sActionLabel":c.getView().getModel("i18n").getProperty("CreateNoteForInvoice"),"dataloss":{"popup":false}};var d=[];if(_.length>0){jQuery.each(_,function(i,g){var h={"Customer":g.getBindingContext().getProperty("Customer"),"CollectionSegment":g.getBindingContext().getProperty("CollectionSegment"),"CompanyCode":g.getBindingContext().getProperty("CompanyCode"),"FiscalYear":g.getBindingContext().getProperty("FiscalYear"),"AccountingDocument":g.getBindingContext().getProperty("AccountingDocument"),"AccountingDocumentItem":g.getBindingContext().getProperty("AccountingDocumentItem"),"Notetext":t};d.push(this._createInvokeFunction(c,"/CreateNoteForInvoice",h));}.bind(this));}else if(a.length>0){jQuery.each(a,function(i,g){var h={"Customer":g.getBindingContext().getProperty("Customer"),"CollectionSegment":"","CompanyCode":g.getBindingContext().getProperty("CompanyCode"),"FiscalYear":g.getBindingContext().getProperty("FiscalYear"),"AccountingDocument":g.getBindingContext().getProperty("AccountingDocument"),"AccountingDocumentItem":g.getBindingContext().getProperty("AccountingDocumentItem"),"Notetext":t};d.push(this._createInvokeFunction(c,"/CreateNoteForInvoice",h));}.bind(this));}var f=Promise.all(d);return c.extensionAPI.securedExecution(f.then(s).catch(e),b);},executeCreateDisputeCaseForInvoices:function(c,p,s,e){var _=c.getView().byId("CollectionsInvoice::responsiveTable").getBindingContext();var a=c.getView().byId("CollectionsInvoice::responsiveTable").getSelectedItems();var b={"sActionLabel":c.getView().getModel("i18n").getProperty("CreateDisputeCase"),"dataloss":{"popup":false}};var d=[];jQuery.each(a,function(i,g){var h={"AccountingDocument":g.getBindingContext().getProperty("AccountingDocument"),"AccountingDocumentItem":g.getBindingContext().getProperty("AccountingDocumentItem"),"CollectionSegment":g.getBindingContext().getProperty("CollectionSegment"),"CompanyCode":g.getBindingContext().getProperty("CompanyCode"),"Customer":g.getBindingContext().getProperty("Customer"),"FiscalYear":g.getBindingContext().getProperty("FiscalYear"),"Partner":_.getProperty("BusinessPartner"),"CollSegment":_.getProperty("CollectionSegment"),"Leadingcompanycode":p.CompanyCode,"Leadingcustomer":_.getProperty("Customer"),"Leadingcurrency":p.Currency};d.push(this._createInvokeFunction(c,"/CreateDisputeCase",h));}.bind(this));var f=Promise.all(d);return c.extensionAPI.securedExecution(f.then(s).catch(e),b);},executeCreateCustomerDisputeCase:function(c,p){var _=c.getView().getBindingContext();var a={"Customer":_.getProperty("Customer"),"CompanyCode":p.CompanyCode};var b={"sActionLabel":"","dataloss":{"popup":false}};var d=function(){return this._createInvokeFunction(c,"/CrteDsputCaseWthoutJrnlEntrRef",a);}.bind(this);return c.extensionAPI.securedExecution(d,b);},executeCompleteCustomerContact:function(c){var p={"Customer":c.getView().getBindingContext().getProperty("Customer"),"CollectionSegment":c.getView().getBindingContext().getProperty("CollectionSegment"),"CompanyCode":c.getView().getBindingContext().getProperty("CompanyCode")};var _=function(){return this._createInvokeFunction(c,"/CompleteCustomerContact",p);}.bind(this);var a={"sActionLabel":c.getView().getModel("i18n").getProperty("FinishCustomerContact"),"dataloss":{"popup":false}};return c.extensionAPI.securedExecution(_,a);},executeCreateInvoiceResubmission:function(c,s,e){var _=c.getView().byId("CollectionsInvoice::responsiveTable").getSelectedItems();var a={"sActionLabel":c.getView().getModel("i18n").getProperty("CreateResubmission"),"dataloss":{"popup":false}};var b=[];jQuery.each(_,function(i,f){var g={"AccountingDocument":f.getBindingContext().getProperty("AccountingDocument"),"AccountingDocumentItem":f.getBindingContext().getProperty("AccountingDocumentItem"),"CollectionSegment":f.getBindingContext().getProperty("CollectionSegment"),"CompanyCode":f.getBindingContext().getProperty("CompanyCode"),"Customer":f.getBindingContext().getProperty("Customer"),"FiscalYear":f.getBindingContext().getProperty("FiscalYear"),"Partner":c.getView().getBindingContext().getProperty("BusinessPartner"),"CollSegment":c.getView().getBindingContext().getProperty("CollectionSegment")};b.push(this._createInvokeFunction(c,"/CreateResubmission",g));}.bind(this));var d=Promise.all(b);return c.extensionAPI.securedExecution(d.then(s).catch(e),a);},executeCompleteResubmission:function(c,s,e){var _=c.getView().byId("CollectionsResubmission::responsiveTable").getSelectedItems();var a={"sActionLabel":c.getView().getModel("i18n").getProperty("CompleteResubmission"),"dataloss":{"popup":false}};var b=[];jQuery.each(_,function(i,f){var g={"ResubmissionUUID":f.getBindingContext().getProperty("ResubmissionUUID"),"DraftUUID":"00000000-0000-0000-0000-000000000000","IsActiveEntity":f.getBindingContext().getProperty("IsActiveEntity")};b.push(this._createInvokeFunction(c,"/Complete",g));}.bind(this));var d=Promise.all(b);return c.extensionAPI.securedExecution(d.then(s).catch(e),a);},executeCreatePromiseToPay:function(c,s,e){var _=c.getView().byId("CollectionsInvoice::responsiveTable").getSelectedItems();var a={"sActionLabel":c.getView().getModel("i18n").getProperty("CreatePromiseToPay"),"dataloss":{"popup":false}};var b=[];jQuery.each(_,function(i,f){var g={"AccountingDocument":f.getBindingContext().getProperty("AccountingDocument"),"AccountingDocumentItem":f.getBindingContext().getProperty("AccountingDocumentItem"),"CollectionSegment":f.getBindingContext().getProperty("CollectionSegment"),"CompanyCode":f.getBindingContext().getProperty("CompanyCode"),"Customer":f.getBindingContext().getProperty("Customer"),"FiscalYear":f.getBindingContext().getProperty("FiscalYear"),"Leadingcustomer":f.getBindingContext().getProperty("Customer")};b.push(this._createInvokeFunction(c,"/CreatePromiseToPay",g));}.bind(this));var d=Promise.all(b);return c.extensionAPI.securedExecution(d.then(s).catch(e),a);},executeRevokePromiseToPay:function(c){var _=c.getView().byId("PromiseToPayCollectionSegment::responsiveTable").getSelectedItem();var a={"sActionLabel":c.getView().getModel("i18n").getProperty("ActionWithdrawPromiseToPay"),"dataloss":{"popup":false}};var b={"PromiseToPayUUID":_.getBindingContext().getProperty("PromiseToPayUUID"),"DraftUUID":_.getBindingContext().getProperty("DraftUUID"),"IsActiveEntity":_.getBindingContext().getProperty("IsActiveEntity")};var d=function(){return this._createInvokeFunction(c,"/RevokePromiseToPay",b);}.bind(this);return c.extensionAPI.securedExecution(d,a);},executeSetDefaultContract:function(c){var _=c.getView().byId("CollectionsContacts::responsiveTable").getSelectedItem();var a={"RelationshipNumber":_.getBindingContext().getProperty("RelationshipNumber"),"BusinessPartnerCompany":_.getBindingContext().getProperty("BusinessPartnerCompany"),"BusinessPartnerPerson":_.getBindingContext().getProperty("BusinessPartnerPerson"),"CollectionSegment":_.getBindingContext().getProperty("CollectionSegment"),"DraftUUID":"00000000-0000-0000-0000-000000000000","IsActiveEntity":true};var b={"sActionLabel":c.getView().getModel("i18n").getProperty("AssignAsDefaultContact"),"dataloss":{"popup":false}};var d=function(){return this._createInvokeFunction(c,"/AssignAsDefaultContact",a);}.bind(this);return c.extensionAPI.securedExecution(d,b);},executePostInvoiceNote:function(c,e){var p={"Customer":c.getView().getBindingContext().getProperty("Customer"),"CollectionSegment":c.getView().getBindingContext().getProperty("CollectionSegment"),"CompanyCode":c.getView().getBindingContext().getProperty("CompanyCode"),"FiscalYear":c.getView().getBindingContext().getProperty("FiscalYear"),"AccountingDocument":c.getView().getBindingContext().getProperty("AccountingDocument"),"AccountingDocumentItem":c.getView().getBindingContext().getProperty("AccountingDocumentItem"),"Notetext":e.getParameter("value")};var f=function(){return this._createInvokeFunction(c,"/CreateNoteForInvoice",p);}.bind(this);var _={"sActionLabel":c.getView().getModel("i18n").getProperty("CreateNote"),"dataloss":{"popup":false}};return c.extensionAPI.securedExecution(f,_);},executePostNote:function(c,e){var p={"Customer":c.getView().getBindingContext().getProperty("Customer"),"CollectionSegment":c.getView().getBindingContext().getProperty("CollectionSegment"),"CompanyCode":"","Notetext":e.getParameter("value")};var f=function(){return this._createInvokeFunction(c,"/CreateNote",p);}.bind(this);var _={"sActionLabel":c.getView().getModel("i18n").getProperty("CreateNote"),"dataloss":{"popup":false}};return c.extensionAPI.securedExecution(f,_);},executeUpdatePostNote:function(c,p){var P={"Customer":p.Customer,"CollectionSegment":p.CollectionSegment,"CompanyCode":p.CompanyCode,"Noteid":p.Noteid,"Notetext":p.Notetext};var f=function(){return this._createInvokeFunction(c,"/ChangeNoteContent",P);}.bind(this);var _={"sActionLabel":c.getView().getModel("i18n").getProperty("CreateNote"),"dataloss":{"popup":false}};return c.extensionAPI.securedExecution(f,_);},executeAuthCheckBeforeNav:function(c,C,p){var f=function(){return this._createInvokeFunction(c,C,p);}.bind(this);var _={"sActionLabel":"","dataloss":{"popup":false}};return c.extensionAPI.securedExecution(f,_);},getPostNote:function(c,p){var _=c.getView().getModel();var a=p.CollectionSegment,b=p.CompanyCode,d=p.FiscalYear,e=p.AccountingDocument,f=p.AccountingDocumentItem;var g="/CollectionsInvoice(CollectionSegment='"+a+"',CompanyCode='"+b+"',FiscalYear='"+d+"',AccountingDocument='"+e+"',AccountingDocumentItem='"+f+"')/to_CollectionsInvoiceNote";return new Promise(function(r,h){_.read(g,{urlParameters:{"$orderby":"CreationDateTime desc","$expand":"to_CreatedByContactCard"},success:function(R){r(R);}});});},getLatePaymentRiskFactors:function(c,p){var _=c.getView().getModel();var a=p.CompanyCode,b=p.CollectionSegment,d=p.AccountingDocument,e=p.FiscalYear,f=p.AccountingDocumentItem;var g="/CollectionsInvoice(CollectionSegment='"+b+"',CompanyCode='"+a+"',FiscalYear='"+e+"',AccountingDocument='"+d+"',AccountingDocumentItem='"+f+"')/to_CollsInvcPaytDelayPrediction";return new Promise(function(r,h){_.read(g,{urlParameters:{},success:function(R){r(R);}});});},getChartData:function(c,p){var _=c.getView().getModel();var a=p.url;return new Promise(function(r,b){_.read(a,{urlParameters:{"$top":100,"$skip":0},success:function(R){r(R);}});});},_onBeforeSemanticObjPopoverOpen:function(e){var _=e.getParameters();var a=_.semanticAttributes;var b=_.semanticObject;if(a&&b==="FinanceApplicationLog"){a.LogNumber=this.fillWithLeadingZeroes(a.LogNumber);}if(a&&a.CompanyCode===""){delete a.CompanyCode;delete a.CompanyCodeName;}},deleteCustomerContact:function(c,p){var _=c.getView().getModel();var a="/CollectionContact(RelationshipNumber='"+p.RelationshipNumber+"',BusinessPartnerCompany='"+p.BusinessPartnerCompany+"',BusinessPartnerPerson='"+p.BusinessPartnerPerson+"',CollectionSegment='"+p.CollectionSegment+"',DraftUUID=guid'00000000-0000-0000-0000-000000000000',IsActiveEntity=true)";return new Promise(function(r,b){_.remove(a,{refreshAfterChange:true,success:function(d,R){r(R);},error:function(e){b(e);}});});}};});