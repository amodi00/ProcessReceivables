/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/core/util/MockServer"],function(M){"use strict";var m,_="fin/ar/process/receivables/",a=_+"localService/mockdata";return{init:function(){var u=jQuery.sap.getUriParameters(),j=jQuery.sap.getModulePath(a),s=jQuery.sap.getModulePath(_+"manifest",".json"),e="CollectionsAccount",E=u.get("errorType"),i=E==="badRequest"?400:500,o=jQuery.sap.syncGetJSON(s).data,d=o["sap.app"].dataSources,b=d.mainService,c=jQuery.sap.getModulePath(_+b.settings.localUri.replace(".xml",""),".xml"),f=/.*\/$/.test(b.uri)?b.uri:b.uri+"/",A=b.settings.annotations;m=new M({rootUri:f});M.config({autoRespond:true,autoRespondAfter:(u.get("serverDelay")||1000)});m.simulate(c,{sMockdataBaseUrl:j,bGenerateMissingMockData:true});var r=m.getRequests(),R=function(g,h,k){k.response=function(x){x.respond(g,{"Content-Type":"text/plain;charset=utf-8"},h);};};r.push({method:"POST",path:new RegExp("CheckAuthorization(.*)"),response:function(x,U){var g=jQuery.sap.sjax({url:j+"/CheckAuth.json"});x.respondJSON(200,{},JSON.stringify(g.data));return true;}});r.push({method:"POST",path:new RegExp("CheckAuthForCustomerContact(.*)"),response:function(x,U){var g=jQuery.sap.sjax({url:j+"/CheckCreateCustomerContactAuth.json"});x.respondJSON(200,{},JSON.stringify(g.data));return true;}});r.push({method:"POST",path:new RegExp("ChangeStickyNoteContent(.*)"),response:function(x,U){var g=jQuery.sap.sjax({url:j+"/ChangeStickyNoteResponse.json"});x.respondJSON(200,{},JSON.stringify(g.data));return true;}});m.setRequests(r);if(u.get("metadataError")){r.forEach(function(g){if(g.path.toString().indexOf("$metadata")>-1){R(500,"metadata Error",g);}});}if(E){r.forEach(function(g){if(g.path.toString().indexOf(e)>-1){R(i,E,g);}});}m.start();jQuery.sap.log.info("Running the app with mock data");if(A&&A.length>0){A.forEach(function(g){var h=d[g],U=h.uri,l=jQuery.sap.getModulePath(_+h.settings.localUri.replace(".xml",""),".xml");new M({rootUri:U,requests:[{method:"GET",path:new RegExp("([?#].*)?"),response:function(x){jQuery.sap.require("jquery.sap.xml");var k=jQuery.sap.sjax({url:l,dataType:"xml"}).data;x.respondXML(200,{},jQuery.sap.serializeXML(k));return true;}}]}).start();});}},getMockServer:function(){return m;}};});