/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
(function(s){var f=function(m){var u=m;var r="";var a=["sap.apf","sap.base","sap.chart","sap.collaboration","sap.f","sap.fe","sap.fileviewer","sap.gantt","sap.landvisz","sap.m","sap.ndc","sap.ovp","sap.rules","sap.suite","sap.tnt","sap.ui","sap.uiext","sap.ushell","sap.uxap","sap.viz","sap.webanalytics","sap.zen"];function g(l,b){Object.keys(l).forEach(function(c){if(!a.some(function(d){return c===d||c.startsWith(d+".");})){if(b.length>0){b=b+","+c;}else{b=c;}}});return b;}return new Promise(function(b,c){$.ajax(u).done(function(d){if(d){if(d["sap.ui5"]&&d["sap.ui5"].dependencies){if(d["sap.ui5"].dependencies.libs){r=g(d["sap.ui5"].dependencies.libs,r)}if(d["sap.ui5"].dependencies.components){r=g(d["sap.ui5"].dependencies.components,r)}}if(d["sap.ui5"]&&d["sap.ui5"].componentUsages){r=g(d["sap.ui5"].componentUsages,r)}}b(r);}).fail(function(e){c(new Error("Could not fetch manifest at '"+m));});});};s.registerComponentDependencyPaths=function(m){return f(m).then(function(l){if(l&&l.length>0){var u="/sap/bc/ui2/app_index/ui5_app_info?id="+l;var a=jQuery.sap.getUriParameters().get("sap-client");if(a&&a.length===3){u=u+"&sap-client="+a;}return $.ajax(u).done(function(d){if(d){Object.keys(d).forEach(function(b){var c=d[b];if(c&&c.dependencies){c.dependencies.forEach(function(e){if(e.url&&e.url.length>0&&e.type==="UI5LIB"){jQuery.sap.log.info("Registering Library "+e.componentId+" from server "+e.url);jQuery.sap.registerModulePath(e.componentId,e.url);}});}});}});}});};})(sap);var scripts=document.getElementsByTagName("script");var currentScript=scripts[scripts.length-1];var manifestUri=currentScript.getAttribute("data-sap-ui-manifest-uri");var componentName=currentScript.getAttribute("data-sap-ui-componentName");var useMockserver=currentScript.getAttribute("data-sap-ui-use-mockserver");sap.registerComponentDependencyPaths(manifestUri).catch(function(e){jQuery.sap.log.error(e);}).finally(function(){sap.ui.getCore().attachInit(function(){jQuery.sap.require("jquery.sap.resources");var l=sap.ui.getCore().getConfiguration().getLanguage();var b=jQuery.sap.resources({url:"i18n/i18n.properties",locale:l});document.title=b.getText("appTitle");});if(componentName&&componentName.length>0){if(useMockserver&&useMockserver==="true"){sap.ui.getCore().attachInit(function(){sap.ui.require([componentName.replace(/\./g,"/")+"/localService/mockserver"],function(s){s.init();sap.ushell.Container.createRenderer().placeAt("content");});});}else{sap.ui.require(["sap/ui/core/ComponentSupport"]);sap.ui.getCore().attachInit(function(){jQuery.sap.require("jquery.sap.resources");var l=sap.ui.getCore().getConfiguration().getLanguage();var b=jQuery.sap.resources({url:"i18n/i18n.properties",locale:l});document.title=b.getText("appTitle");});}}else{sap.ui.getCore().attachInit(function(){sap.ushell.Container.createRenderer().placeAt("content");});}});sap.registerComponentDependencyPaths(manifestUri);
