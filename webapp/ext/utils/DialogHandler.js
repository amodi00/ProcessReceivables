/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/core/Fragment","sap/m/Dialog","sap/m/Button"],function(F,D,B){return{createDialogWithTextArea:function(c,d,i){return F.load({name:d,id:c.getView().createId(i),controller:c});},createPopoverDialog:function(c,d,i){return F.load({name:d,id:c.getView().createId(i),controller:c});},getDialogElement:function(c,d,e){return sap.ui.core.Fragment.byId(c.getView().getId()+"--"+d,e);},openMessageDialog:function(p){var d=new D({title:p.title,type:p.type,state:p.state,content:new sap.m.Text({text:p.content}),beginButton:new B({type:"Emphasized",text:p.btnText,press:function(){d.close();}}),afterClose:function(){d.destroy();}});d.open();},updateDueDateGridPlot:function(c){var o=function(a){var C=this.getContextForChartPoint(c,a);return C.getProperty("IsOverdue");};var d=function(a){var C=this.getContextForChartPoint(c,a);return!C.getProperty("IsOverdue");};c.vizUpdate({properties:{plotArea:{dataPointStyle:{rules:[{callback:o.bind(this),properties:{color:"sapUiChartPaletteSemanticBad"}},{callback:d.bind(this),properties:{color:"sapUiChartPaletteSemanticGood"}}],others:{properties:{color:"sapUiChartPaletteSemanticBad"}}}}}});return;},getContextForChartPoint:function(c,d){var o=c.getDataset();var b=o.findContext(d);return b;}};});