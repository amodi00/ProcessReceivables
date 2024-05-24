/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/base/Log",
		"sap/m/Button",
		"sap/m/Dialog",
		"sap/m/Label",
		"sap/m/MessageToast",
		"sap/m/Text",
		"sap/m/TextArea",
		"sap/m/ButtonType",
		"sap/m/PDFViewer",
		"sap/ui/model/json/JSONModel",
		"sap/ui/core/Fragment",
		"sap/m/MessageBox",
		"fin/ar/process/receivables/ext/formatter/formatter",
		"fin/ar/process/receivables/ext/utils/ModelGenerator",
		"fin/ar/process/receivables/ext/utils/DialogHandler",
		"fin/ar/process/receivables/ext/utils/FunctionCallExecutor",
		"fin/ar/process/receivables/ext/utils/InputValidator",
		"s4/cfnd/sit/reuse/lists/SituationListIndicationSupport",
		"sap/viz/ui5/format/ChartFormatter"
	],
	function (Log, Button, Dialog, Label, MessageToast, Text, TextArea, ButtonType, PDFViewer, JSONModel, Fragment, MessageBox,
		Formatter, ModelGenerator, DialogHandler, FunctionCallExecutor, InputValidator, SituationListIndicationSupport, ChartFormatter) {
		"use strict";

		var bNavigationToDisputeCaseAllowed = false;

		/** define json object to save all table Ids and it's actions button Ids and draft*/
		var oTables = {
			"CollectionsInvoice::responsiveTable": {
				actions: ["ActionCreateResubmissionForInvoice", "ActionCreatePromiseToPayForInvoice", "ActionCreateDisputeCaseForInvoice",
					"ActionCreateNoteForInvoice", "ActionIncludeInvoiceInCorrespondence"
				],
				hasDraft: false,
				nullable: false
			},
			"CollectionsInvoiceCompanyCode::responsiveTable": {
				actions: ["ActionCreateNoteForInvoiceCompanyCode"],
				hasDraft: false,
				nullable: false
			},
			"DisputeCasesCollectionSegment::responsiveTable": {
				actions: ["btnCreateDispute"],
				hasDraft: true,
				nullable: false
			},
			"PromiseToPayCollectionSegment::responsiveTable": {
				actions: ["ActionWithdrawPromiseToPay"],
				hasDraft: true,
				nullable: false
			},
			"CollectionsResubmission::responsiveTable": {
				actions: ["ActionCompleteResubmission"],
				hasDraft: true,
				nullable: false
			},
			"CollectionsContacts::responsiveTable": {
				actions: ["ActionDeleteCustomerContact", "ActionSetAsDefaultContact"],
				hasDraft: true,
				nullable: false
			},
			"CollectionAccountNotes--CollsAcctNoteList": {
				actions: [],
				hasDraft: false,
				nullable: true
			},
			"CollectionsHeadOfficeBranch::responsiveTable": {
				actions: [],
				hasDraft: false,
				nullable: true
			}
		};
		/** navigation objects*/
		var oNavObject = {
			"manage": {
				"CollectionsCustomerContact": "CollectionsCustomerContact-manage",
				"DisputeCase": "DisputeCase-manage",
				"PromiseToPay": "PromiseToPay-manage",
				"CollectionsResubmission": "CollectionsResubmission-manage"
			},
			"create": {
				"CollectionsResubmission": "CollectionsResubmission-create",
				"CollectionsContactPerson": "CollectionsContactPerson-create"
			},
			"display": {
				"HeadOfficeReceivable": "HeadOfficeReceivable-display"
			}
		};

		var aSemantics = [{
			target: {
				"semanticObject": "CollectionsResubmission",
				"action": "manage"
			}
		}, {
			target: {
				"semanticObject": "PromiseToPay",
				"action": "manage"
			}
		}, {
			target: {
				"semanticObject": "CollectionsResubmission",
				"action": "create"
			}
		}, {
			target: {
				"semanticObject": "CollectionsContactPerson",
				"action": "manage"
			}
		}, {
			target: {
				"semanticObject": "CollectionsContactPerson",
				"action": "create"
			}
		}, {
			target: {
				"semanticObject": "DisputeCase",
				"action": "manage"
			}
		}, {
			target: {
				"semanticObject": "CollectionsCustomerContact",
				"action": "manage"
			}
		}, {
			target: {
				"semanticObject": "HeadOfficeReceivable",
				"action": "display"
			}
		}];
		return sap.ui.controller("fin.ar.process.receivables.ext.controller.ObjectPageExt", {
			_formatter: Formatter,
			_bErrorMessageBoxOpend: false,
			_oDialogs: {
				changeStickyNoteDlg: null,
				createInvoiceNoteDlg: null,
				createInvoiceDisputeCaseDlg: null,
				draftDlg: null,
				footerMessageDlg: null,
				postingNoteListDlg: null,
				LatePaymentListDialog: null,
				contactInfoDlg: null,
				updateInvoiceDisputeCaseDlg: null,
				dueDateGridChartDlg: null,
				paymentTrendChartDlg: null,
				createContactPersonDlg: null,
				relatedDisputeCaseListDlg: null
			},
			// _oCharts: {
			//     LatePaymentChart: null
			// },
			/** initial method at first time object page opening */
			onInit: function () {
				var sCollectionsInvoiceTableID = this.getView().byId("CollectionsInvoice::Table");
				if (sCollectionsInvoiceTableID) {
					sCollectionsInvoiceTableID.setIgnoredFields("BillingDocument");
				};
				//this.getView().byId("CollectionsInvoice::Table").setIgnoredFields("BillingDocument");
				this._attachEventToEachTable();
				this._attachEventToMicroChart();
				// this.getOwnerComponent().getModel().attachBatchRequestCompleted(this._afterBatchRequestComplete, this);
				this.extensionAPI.attachPageDataLoaded(this._afterPageDataLoaded.bind(this));

				SituationListIndicationSupport.mixIntoListReportAdvanced(this, [{
					tableId: "fin.ar.process.receivables::sap.suite.ui.generic.template.ObjectPage.view.Details::CollectionsAccount--CollectionsInvoice::Table",
					anchorKeyField: "CollectionsInvoiceUniqueID", // needed for preview dialog
					columnKey: "AccountingDocument"
				}]);

				// Check if navigation to Manage Dispute Case App is available 
				var oCrossAppNavigation = sap.ushell.Container.getServiceAsync("CrossApplicationNavigation").then(function (oService) {

					var test = oService.isNavigationSupported([{

						target: {
							semanticObject: "DisputeCase",
							action: "manage"
						}
					}], this).done(function (aResponse) {
						if (aResponse.length > 0) {
							bNavigationToDisputeCaseAllowed = aResponse[0].supported;
						}

					});
				});

			},

			adaptNavigationParameterExtension: function (oSelectionVariant, oObjectInfo) {
				if (oSelectionVariant.getSelectOption("CompanyCode") &&
					oSelectionVariant.getSelectOption("CompanyCode")[0].Low === "") {
					var _sSegment = oSelectionVariant.getSelectOption("CollectionSegment")[0].Low;
					this._selectionVariant = oSelectionVariant;
					oSelectionVariant.removeSelectOption("CompanyCode");
					for (var i = 0; i < this._companies.length; i++) {
						if (_sSegment === this._companies[i].Segment) {
							oSelectionVariant.addSelectOption(
								"CompanyCode", "I", "EQ", this._companies[i].Company, ""
							);
						}
					}
				}
			},

			onBeforeRebindTableExtension: function (oEvent) {
				// this adds the situation decoration to your list report every time
				// the data is refreshed
				this.addSituationInfoToListReport(oEvent);
			},
			/** add customer data so that in filter no selection of null */
			onInitialise: function () {
				var _keys = Object.keys(oTables);
				jQuery.each(_keys, function (index, key) {
					if (!oTables[key].nullable) {
						this._addCustomDataEachColumns(this.getView().byId(key));
					}
				}.bind(this));
			},

			onUpdateFinished: function (oEvent) {
				var oSource = oEvent.getSource();
				var _key = "";
				var _oBindingContext = this.getView().getBindingContext();
				var oInvoiceTable =
					"fin.ar.process.receivables::sap.suite.ui.generic.template.ObjectPage.view.Details::CollectionsAccount--CollectionsInvoice::responsiveTable";

				if (oSource.getId() === oInvoiceTable && oSource.getItems().length > 0) {
					oSource.getItems().forEach(function (oItem) {
						var sReferenceDocLogicalSystem = oItem.getBindingContext().getProperty("ReferenceDocumentLogicalSystem");
						var oHBox = oItem.getCells().find(function (oElement) {
							return oElement.getId().indexOf("HBOX") !== -1;
						});
						if (oHBox) {
							var oSmartlink = oHBox.getItems().find(function (oObject) {
								return oObject.getId().indexOf("BillingDocumentLink") !== -1;
							});
							if (sReferenceDocLogicalSystem !== '') {

								oSmartlink.setEnabled(false);
							} else {
								oSmartlink.setEnabled(true);
							}
						}

					});

				}

				if (oSource.getId().indexOf("CollsAcctNoteList") !== -1) {
					_key = oSource.getId().split("--")[1] + "--" + oSource.getId().split("--")[2];
				} else {
					_key = oSource.getId().split("--")[1];
				}

				var _table = oTables[_key];
				/** init action buttons disabled*/
				if (_table.actions && _table.actions.length > 0) {
					jQuery.each(_table.actions, function (index, id) {
						if (_key === "CollectionsInvoice::responsiveTable") {
							if (this.getView().byId(_key).getSelectedItems().length > 0) {
								// Enable all actions
								jQuery.each(_table.actions, function (index, id) {
									this._setActionButton.call(this, id, true);
								}.bind(this));

							} else {
								// Disable all action
								jQuery.each(_table.actions, function (index, id) {
									this._setActionButton.call(this, id, false);
								}.bind(this));

							}
						} else {
							this._setActionButton.call(this, id, false);
						}
					}.bind(this));

					if (_key === "CollectionsInvoice::responsiveTable" && _oBindingContext && _oBindingContext.getProperty("UICT_PromiseToPay")) {
						this.getView().byId(_table.actions[1]).setVisible(false);
					} else if (_key === "CollectionsInvoice::responsiveTable" && _oBindingContext && !_oBindingContext.getProperty(
							"UICT_PromiseToPay")) {
						this.getView().byId(_table.actions[1]).setVisible(true);
					}

					if (_key === "CollectionsInvoice::responsiveTable" && _oBindingContext && _oBindingContext.getProperty(
							"UICT_DisputeCaseCollsSegment")) {
						this.getView().byId(_table.actions[2]).setVisible(false);
					} else if (_key === "CollectionsInvoice::responsiveTable" && _oBindingContext && !_oBindingContext.getProperty(
							"UICT_DisputeCaseCollsSegment")) {
						this.getView().byId(_table.actions[2]).setVisible(true);
					}

					if (_key === "DisputeCasesCollectionSegment::responsiveTable" && bNavigationToDisputeCaseAllowed === false) {
						// Disable Button 
						this.getView().byId(_table.actions[0]).setVisible(false);
					} else if (_key === "DisputeCasesCollectionSegment::responsiveTable" && bNavigationToDisputeCaseAllowed === true) {
						// Enable Button
						this.getView().byId(_table.actions[0]).setVisible(true);
						this.getView().byId(_table.actions[0]).setEnabled(true);
					}

				}
				/** set table content with highlight if the table has draft information */
				if (_table.hasDraft) {
					var oItems = oSource.getItems();
					jQuery.each(oItems, function (index, item) {
						var bIsActiveEntity = item.getBindingContext().getProperty("HasActiveEntity");
						if (!bIsActiveEntity) {
							item.setHighlight("Information");
						}
					});
				}
				/** add action edit for the first note if it is created same as the user*/
				if (_key === "CollectionAccountNotes--CollsAcctNoteList") {
					this._addActionsToNoteItem(oSource);
					this._addHighLightToNoteItem(oSource);
				}
			},

			onClickActionDisplayHeadOfficeReceivable: function (oEvent) {
				var oNavigationController = this.extensionAPI.getNavigationController();
				var sCustomer = oEvent.getSource().getBindingContext().getProperty("CustomerHeadOffice");
				var sCollectionSegment = oEvent.getSource().getBindingContext().getProperty("CollectionSegment");
				var oParams = {
					preferredMode: "display",
					Customer: sCustomer,
					CollectionSegment: sCollectionSegment,
					IsActiveEntity: true
				};

				oNavigationController.navigateExternal(oNavObject.display.HeadOfficeReceivable, oParams);

			},

			onListNavigationExtension: function (oEvent) {
				var oNavigationController = this.extensionAPI.getNavigationController();
				if (oEvent.getSource().getId().indexOf("DisputeCasesCollectionSegment") !== -1) {
					var oParams = {
						DraftUUID: oEvent.getSource().getBindingContext().getProperty("DraftUUID"),
						CaseID: oEvent.getSource().getBindingContext().getProperty("CaseID"),
						IsActiveEntity: oEvent.getSource().getBindingContext().getProperty("IsActiveEntity"),
						DisputeCaseUUID: oEvent.getSource().getBindingContext().getProperty("DisputeCaseUUID")
					};
					// for notebooks we trigger external navigation for all others we use internal navigation
					oNavigationController.navigateExternal("DisputeCase-manage", oParams);
					// return true is necessary to prevent further default navigation
					return true;
				} else if (oEvent.getSource().getId().indexOf("PromiseToPayCollectionSegment") !== -1) {
					oParams = {
						DraftUUID: oEvent.getSource().getBindingContext().getProperty("DraftUUID"),
						CaseID: oEvent.getSource().getBindingContext().getProperty("CaseID"),
						IsActiveEntity: oEvent.getSource().getBindingContext().getProperty("IsActiveEntity"),
						PromiseToPayUUID: oEvent.getSource().getBindingContext().getProperty("PromiseToPayUUID")
					};
					// for notebooks we trigger external navigation for all others we use internal navigation
					oNavigationController.navigateExternal("PromiseToPay-manage", oParams);
					// return true is necessary to prevent further default navigation
					return true;
				} else {
					return false;
				}
			},

			/** add a messagestrip if customer contact to finish */
			_initPageElementStatus: function (oEvent) {
				var _oBindingContext = this.getView().getBindingContext();
				var _oFinishCustomContactBtn = this.getView().byId("action::ActionFinishCustomerContact");
				var _oFirstSection = this.getView().byId("objectPage-OPHeaderContent");
				if (this._oMessageStrip && _oFirstSection.getContent().length > 1) { // reset the message strip and remove it from header
					var _oLastContent = _oFirstSection.getContent()[_oFirstSection.getContent().length - 1];
					_oFirstSection.removeContent(_oLastContent);
					this._oMessageStrip.destroy();
					this._oMessageStrip = undefined;
				}
				if (_oBindingContext && _oBindingContext.getProperty("UICT_LastCustomerContactDate")) {
					_oFinishCustomContactBtn.setText(this.getView().getModel("i18n").getProperty("FinishCustomerContact"));
					_oFinishCustomContactBtn.setTooltip(this.getView().getModel("i18n").getProperty("CustomerContactIsAvailable"));
					if (_oFirstSection && _oFirstSection.getId().indexOf("CollectionsAccount") !== -1) {
						this._oMessageStrip = new sap.m.MessageStrip(this.getView().createId("messageString"), {
							text: "",
							type: "Warning",
							showIcon: true,
							link: new sap.m.Link({
								text: this.getView().getModel("i18n").getProperty("LinkFinishCustomerContact"),
								press: this.onClickActionFinishCustomerContact.bind(this)
							})
						});
						_oFirstSection.addContent(this._oMessageStrip);
					}

				} else { /** change action button text*/
					_oFinishCustomContactBtn.setText(this.getView().getModel("i18n").getProperty("CreateCustomerContact"));
					_oFinishCustomContactBtn.setTooltip("");
				}

				// Get Head Office Receivables button
				var _oHeadOfficeReceivablesButton = this.getView().byId("action::ActionDisplayHeadOfficeReceivable");

				if (_oBindingContext && _oBindingContext.getProperty("UICT_HeadOfficeReceivables") === true) {
					// Set visible
					_oHeadOfficeReceivablesButton.setVisible(true);
				} else if (_oBindingContext && _oBindingContext.getProperty("UICT_HeadOfficeReceivables") === false) {
					// Hide 
					_oHeadOfficeReceivablesButton.setVisible(false);
				}
			},

			_addCustomDataEachColumns: function (oEvent) {
				if (oEvent) {
					var _aColumns = oEvent.getColumns();
					jQuery.each(_aColumns, function (index, col) {
						var _aCustomData = col.getCustomData();
						if (_aCustomData.length > 0) {
							var _oCustomDataValue = _aCustomData[0].getValue();
							if (_oCustomDataValue && typeof _oCustomDataValue === "string") {
								_oCustomDataValue = JSON.parse(_oCustomDataValue);
								_oCustomDataValue.nullable = false;
								_oCustomDataValue = JSON.stringify(_oCustomDataValue);
							} else if (_oCustomDataValue && typeof _oCustomDataValue === "object") {
								_oCustomDataValue.nullable = false;
							}
							_aCustomData[0].setValue(_oCustomDataValue);
						}
					});
				}
			},

			/** add edit button in note list*/
			_addActionsToNoteItem: function (oSource) {
				var _sUserData = sap.ushell.Container.getService("UserInfo").getId();
				var _aTableItems = oSource.getItems();
				var _oContactUser = "";
				if (_aTableItems.length > 0) {
					_oContactUser = _aTableItems[0].getBindingContext().getProperty();
				}
				if (_sUserData === _oContactUser.CreatedByUser && _aTableItems.length > 0 && _aTableItems[0].getActions().length === 0 &&
					_oContactUser.MigrationStatus === "0") {
					_aTableItems[0].addAction(new sap.m.FeedListItemAction({
						icon: "sap-icon://edit",
						text: this.getView().getModel("i18n").getProperty("BtnEdit"),
						key: "Edit",
						press: this.onUpdateAccountNote.bind(this, _aTableItems[0])
					}));
					if (_aTableItems[1]) {
						_aTableItems[1].removeAllActions();
					}
				}
			},

			_addHighLightToNoteItem: function (oSource) {
				var _aTableItems = oSource.getItems();
				jQuery.each(_aTableItems, function (index, item) {
					var _sIconUrl = item.getBindingContext().getProperty("NoteIconURL");
					switch (_sIconUrl) {
					case "sap-icon://quality-issue":
						item.setHighlight("Warning");
						break;
					default:
						item.setHighlight("None");
						break;
					}
				});
			},

			// onCloseFooterDialog: function (oEvent) {
			// 	this._closeDlg("footerMessageDlg");
			// },

			onSelectItem: function (oEvent) {
				var _key = oEvent.getSource().getId().split("--")[1];
				var _bActionMeaningless = false;
				if (_key === "PromiseToPayCollectionSegment::responsiveTable" || _key === "CollectionsResubmission::responsiveTable" || _key ===
					"CollectionsContacts::responsiveTable") {
					var _aSelectedItems = oEvent.getSource().getSelectedItems();
					for (var i = 0; i < _aSelectedItems.length; i++) {
						if (!_aSelectedItems[i].getBindingContext().getProperty("IsActiveEntity")) {
							_bActionMeaningless = true;
							//if there are drafts within the selected items, actions do not make sense
							break;
						}
					}
					if (_key === "CollectionsResubmission::responsiveTable") {
						if (_aSelectedItems.length === 1 && _aSelectedItems[0].getBindingContext().getProperty("ResubmissionStatus") == "1") {
							//resubmission state 1 is 'completed', so action 'completed' does not make sense
							_bActionMeaningless = true;
						}
					}

				}

				if (oTables[_key].actions.length > 0 && oEvent.getSource().getSelectedItems().length > 0 && !_bActionMeaningless) {
					jQuery.each(oTables[_key].actions, function (index, id) {
						this._setActionButton.call(this, id, true);
					}.bind(this));
				} else if (oTables[_key].actions.length > 0 && oEvent.getSource().getSelectedItems().length > 0 && _bActionMeaningless) {
					jQuery.each(oTables[_key].actions, function (index, id) {
						this._setActionButton.call(this, id, false);
					}.bind(this));
				} else if (oTables[_key].actions.length > 0 && oEvent.getSource().getSelectedItems().length === 0) {
					jQuery.each(oTables[_key].actions, function (index, id) {
						this._setActionButton.call(this, id, false);
					}.bind(this));
				}
			},

			_attachEventToEachTable: function () {
				var _keys = Object.keys(oTables);
				jQuery.each(_keys, function (index, key) {
					var _oTable = this.getView().byId(key);
					if (_oTable) {
						/**attach update finieshed event method to every table*/
						_oTable.attachUpdateFinished(this.onUpdateFinished.bind(this));
						if (key !== "CollectionAccountNotes--CollsAcctNoteList") {
							_oTable.getParent().attachBeforeExport(this._changeExportExcelTemplate);
							_oTable.getParent().attachInitialise(this.onInitialise.bind(this));
						}
						if (key !== "DisputeCasesCollectionSegment::responsiveTable") {
							_oTable.attachSelect(this.onSelectItem.bind(this));
						}
					}
				}.bind(this));
			},

			_attachEventToMicroChart: function () {
				var _oDueDateGridChart = this.getView().byId("header::headerEditable::DueDateGrid::SmartMicroChart");
				var _oPaymentTrendChart = this.getView().byId("header::headerEditable::PaymentTrend::SmartMicroChart");
				if (_oDueDateGridChart) {
					_oDueDateGridChart.attachBrowserEvent("click", this._openDueDateGridChart.bind(this));
					_oDueDateGridChart.attachBrowserEvent("mouseover", function (oEvent) {
						oEvent.currentTarget.style.cursor = "pointer";
					});
				}

				if (_oPaymentTrendChart) {
					_oPaymentTrendChart.attachBrowserEvent("click", this._openPaymentTrandChart.bind(this));
					_oPaymentTrendChart.attachBrowserEvent("mouseover", function (oEvent) {
						oEvent.currentTarget.style.cursor = "pointer";
					});
				}
			},

			_openDueDateGridChart: function (oEvent) {
				var _oMicroChart = this.getView().byId("header::headerEditable::DueDateGrid::SmartMicroChart");
				var _sUrl = _oMicroChart.getBindingContext().getPath() + "/to_CollectionsDueDateGrid";
				if (this._oDialogs.dueDateGridChartDlg) {
					return;
				}
				DialogHandler.createPopoverDialog(this, "fin.ar.process.receivables.ext.fragments.DueDateGridPopover", "dueDateGridDlg")
					.then(function (oDlg) {
						this._oDialogs.dueDateGridChartDlg = oDlg;
						this._oDialogs.dueDateGridChartDlg.attachAfterClose(this.onCloseDueDateGridDlg.bind(this));
						return FunctionCallExecutor.getChartData(this, {
							url: _sUrl
						});
					}.bind(this))
					.then(function (oRes) {
						if (oRes.results.length === 0) {
							return;
						}
						var _bRenderComplete = false; // for issue in the event attachmentRenderComplete (endless loop)
						var _oChartModel = ModelGenerator.generateDataModelForDueDateGridChart(oRes);
						var _oChart = DialogHandler.getDialogElement(this, "dueDateGridDlg", "DueDateGridChart");
						this._initDueDateGridChartFormatter(_oChartModel.MaxAmount, _oChartModel.ChartCurrency);
						this._oDialogs.dueDateGridChartDlg.setModel(new JSONModel(_oChartModel), "json");
						this._oDialogs.dueDateGridChartDlg.setModel(this.getView().getModel("i18n"), "i18n");
						_oChart.attachRenderComplete(function () { /** change viz frame plot color*/
							if (!_bRenderComplete) {
								DialogHandler.updateDueDateGridPlot(_oChart);
								_bRenderComplete = true;
							}
						}, this);
						this._oDialogs.dueDateGridChartDlg.openBy(_oMicroChart);
					}.bind(this));
			},
			_initDueDateGridChartFormatter: function (nMaxValue, sCurrency) {
				var oChartFormatter = sap.viz.ui5.format.ChartFormatter.getInstance();
				oChartFormatter.registerCustomFormatter("DueDateGridChartFormatAxisAmount", function (value) {
					var sResult;
					if (nMaxValue < 100000) {
						sResult = this._formatter.formatChartYValuesLong(value, sCurrency);
					} else {
						sResult = this._formatter.formatChartYValuesShort(value, sCurrency);
					}
					return sResult;
				}.bind(this));

				oChartFormatter.registerCustomFormatter("FormatAmountStandard", function (value) {
					var sResult = this._formatter.formatAmount(value);
					return sResult;
				}.bind(this));
				sap.viz.ui5.api.env.Format.numericFormatter(oChartFormatter);
			},
			onCloseDueDateGridDlg: function () {
				this._closeDlg("dueDateGridChartDlg");
			},

			_openPaymentTrandChart: function () {
				var _oMicroChart = this.getView().byId("header::headerEditable::PaymentTrend::SmartMicroChart");

				var _sUrl = _oMicroChart.getBindingContext().getPath() + "/to_CollectionsPaymentTrend";
				if (this._oDialogs.paymentTrendChartDlg) {
					return;
				}
				DialogHandler.createPopoverDialog(this, "fin.ar.process.receivables.ext.fragments.PaymentTrendPopover", "paymentTrendDlg")
					.then(function (oDlg) {
						this._oDialogs.paymentTrendChartDlg = oDlg;
						this._oDialogs.paymentTrendChartDlg.attachAfterClose(this.onClosePaymentTrendChart.bind(this));
						return FunctionCallExecutor.getChartData(this, {
							url: _sUrl
						});
					}.bind(this))
					.then(function (oRes) {
						if (oRes.results.length === 0) {
							return;
						}
						var _oChartModel = ModelGenerator.generateDataModelForPaymentTrendChart(this.getView().getModel("i18n").getProperty(
							"WeightedDaysOverdue"), oRes);
						this._initPaymentTrendFormatter();
						this._oDialogs.paymentTrendChartDlg.setModel(new JSONModel(_oChartModel), "json");
						this._oDialogs.paymentTrendChartDlg.setModel(this.getView().getModel("i18n"), "i18n");
						this._oDialogs.paymentTrendChartDlg.openBy(_oMicroChart);
					}.bind(this));
			},
			_initPaymentTrendFormatter: function () {
				var _oChartFormatter = sap.viz.ui5.format.ChartFormatter.getInstance();
				_oChartFormatter.registerCustomFormatter("PaymentTrendChartAxisAmount", function (value) {
					return this._formatter.formatPaymentTrendYValue(value);
				}.bind(this));
				_oChartFormatter.registerCustomFormatter("FormatWeightedDueDays", function (value) {
					return this._formatter.formatWeightedDueDays(value);
				}.bind(this));
				sap.viz.ui5.api.env.Format.numericFormatter(_oChartFormatter);
			},

			onClosePaymentTrendChart: function () {
				this._closeDlg("paymentTrendChartDlg");
			},

			_changeExportExcelTemplate: function (oEvent) {
				var _aColumns = oEvent.getParameter("exportSettings").workbook.columns;
				jQuery.each(_aColumns, function (index, _oColumn) {
					if (_oColumn.property === "ResubmissionDueDate") { //Resubmission date
						_oColumn.type = "Date";
					}
					if (_oColumn.property[0] === "NetDueDate") //Net due date
					{
						_oColumn.property = "NetDueDate";
						_oColumn.template = null;
						_oColumn.type = "Date";
					}
					if (Object.prototype.toString.call(_oColumn.property) === "[object Array]") {
						var _sTemplate = "";
						for (var i = 0; i < _oColumn.property.length; i++) {
							_sTemplate = _sTemplate + "{" + i + "}" + " ";
						}
						_oColumn.template = _sTemplate;
					}
				});
			},

			onClickActionIncludeInvoiceInCorrespondence: function () {
				// Create Popover
				DialogHandler.createDialogWithTextArea(this,
					"fin.ar.process.receivables.ext.fragments.IncludeInvoiceInCorrespondence",
					"includeInvoiceInCorrespondenceDlg").then(function (oDialog) {
					this._oDialogs.includeInvoiceInCorrespondenceDlg = oDialog;
					this._oDialogs.includeInvoiceInCorrespondenceDlg.setModel(this.getView().getModel("i18n"), "i18n");
					this._oDialogs.includeInvoiceInCorrespondenceDlg.open();
				}.bind(this));
			},

			onIncludeInvoiceInCorrespondenceConfirm: function (oEvent) {
				var _sCheckBoxCreateBillingDocument = DialogHandler.getDialogElement(this, "includeInvoiceInCorrespondenceDlg",
					"checkBoxCreateBillingDocument").getSelected();
				var _sCheckBoxIncludeInCorrespondence = DialogHandler.getDialogElement(this, "includeInvoiceInCorrespondenceDlg",
					"checkBoxIncludeInCorrespondence").getSelected();
				// Close dialog
				this._closeDlg("includeInvoiceInCorrespondenceDlg");

				FunctionCallExecutor.executeIncludeInvoiceInCorrespondence(this, _sCheckBoxCreateBillingDocument, _sCheckBoxIncludeInCorrespondence,
					function (aResponse) {
						var that = this;

						// Refresh data
						var sPath = this.getView().getBindingContext().getPath();
						this.getView().getModel().read(sPath, {
							success: function () {
								that._initPageElementStatus();
							}
						});

					}.bind(this),
					function (err) {});
			},

			onIncludeInvoiceInCorrespondenceCancel: function () {
				this._closeDlg("includeInvoiceInCorrespondenceDlg");
			},

			onClickCreateDisputeCase: function (oEvent) {
				var _aTableIds = Object.keys(oTables);
				var oTable = this.getView().byId(_aTableIds[0]);
				var aSelectedItems = oTable.getSelectedItems();
				var oSelectedCompanies = {};
				var oSelectedCurrencies = {};
				var oAvailableCurrencies = [];
				jQuery.each(aSelectedItems, function (index, item) {
					var sCompanyCode = item.getBindingContext().getProperty("CompanyCode");
					var sCompanyCodeName = item.getBindingContext().getProperty("CompanyCodeName");
					var sCurrency = item.getBindingContext().getProperty("TransactionCurrency");
					if (!oSelectedCompanies.hasOwnProperty(sCompanyCode)) {
						oSelectedCompanies[sCompanyCode] = sCompanyCodeName;
					}
					if (!oSelectedCurrencies.hasOwnProperty(sCurrency)) {
						oSelectedCurrencies[sCurrency] = 1;
						oAvailableCurrencies.push(sCurrency);
					}
				});
				var _oDlgModel = ModelGenerator.generateDataModelForCreateDispute(oSelectedCompanies, oSelectedCurrencies);
				if (!this._oCreateDisputeCasesDlg && (_oDlgModel.CompanyCodeVisible || _oDlgModel.CurrencyVisible)) {
					DialogHandler.createDialogWithTextArea(this,
							"fin.ar.process.receivables.ext.fragments.CollectionInvoiceDialog.CreateInvoiceDisputeCaseDialog",
							"createInvoiceDisputeCaseDlg")
						.then(function (oDialog) {
							this._oDialogs.createInvoiceDisputeCaseDlg = oDialog;
							this._oDialogs.createInvoiceDisputeCaseDlg.setModel(this.getView().getModel("i18n"), "i18n");
							this._oDialogs.createInvoiceDisputeCaseDlg.setModel(new JSONModel(_oDlgModel));
							this._oDialogs.createInvoiceDisputeCaseDlg.open();
						}.bind(this));
				} else {
					if (oAvailableCurrencies.length === 1) {
						var sSelectedCurrency = oAvailableCurrencies[0];
					}
					this.onClickActionCreateDisputeCaseForInvoice(oEvent, sSelectedCurrency);
				}
			},

			onClickCreateCustomerDispute: function (oEvent) {
				//create a dispute case without invoice, just with a list of companies in a dropdown list for this customer
				//within the given collection segment
				var _oModel = this.getView().getModel();
				var _sSegment = this.getView().getBindingContext().getProperty("CollectionSegment");
				var _sCustomer = this.getView().getBindingContext().getProperty("Customer");
				FunctionCallExecutor.getCompaniesPromise(_oModel, {
					Segment: _sSegment,
					Customer: _sCustomer
				}).then(function (oRes) {
					var _oDlgModel = ModelGenerator.generateCreateDisputeCaseDlgModel(oRes.results);
					DialogHandler.createDialogWithTextArea(this, "fin.ar.process.receivables.ext.fragments.CreateDisputeDialog",
							"CreateDisputeCaseDialog")
						.then(function (oPopover) {
							this._oDialogs.createDisputeDlg = oPopover;
							this._oDialogs.createDisputeDlg.setModel(this.getView().getModel("i18n"), "i18n");
							this._oDialogs.createDisputeDlg.setModel(new JSONModel(_oDlgModel), "localJson");
							//						this._attachInputValidations();
							this._oDialogs.createDisputeDlg.open();
							var _oInputTemplate = DialogHandler.getDialogElement(this, "CreateDisputeCaseDialog", "inputCompany");
							_oInputTemplate.fireSelectionChange();
						}.bind(this));
				}.bind(this));
			},

			onCreateDisputeCaseDlgClose: function () {
				this._closeDlg("createInvoiceDisputeCaseDlg");
			},
			onCreateDisputeCaseDlgConfirm: function (oEvent) {
				this.onClickActionCreateDisputeCaseForInvoice(oEvent);
			},
			onCreateCustomerDisputeCancel: function () {
				this._closeDlg("createDisputeDlg");
			},
			onClickActionChangeStickyNote: function (oEvent) {
				var _oDlgContentModel = ModelGenerator.generateDataModelForChangeStickyNote(this, oEvent.getSource().getBindingContext());
				if (!this._oDialogs.changeStickyNoteDlg) {
					DialogHandler.createDialogWithTextArea(this,
						"fin.ar.process.receivables.ext.fragments.CollectionInvoiceDialog.ChangeStickyNoteDialog",
						"changeStickyNoteDlg").then(function (oDialog) {
						this._oDialogs.changeStickyNoteDlg = oDialog;
						this._oDialogs.changeStickyNoteDlg.setModel(this.getView().getModel("i18n"), "i18n");
						this._oDialogs.changeStickyNoteDlg.setModel(new JSONModel(_oDlgContentModel));
						this._attachStickyNoteValidation();
						this._oDialogs.changeStickyNoteDlg.open();
					}.bind(this));
				}
			},
			_attachStickyNoteValidation: function () {
				var _oTextArea = this._byDialogId("changeStickyNoteDlg", "changeStickyNoteTextArea");
				_oTextArea.attachValidationError(function () {
					_oTextArea.setValueState("Error");
				});
				_oTextArea.attachValidationSuccess(function () {
					_oTextArea.setValueState("None");
				});
			},
			_closeDlg: function (sDlg) {
				if (this._oDialogs[sDlg] && this._oDialogs[sDlg].Dlg) {
					this._oDialogs[sDlg].Dlg.destroy();
				} else if (this._oDialogs[sDlg]) {
					this._oDialogs[sDlg].destroy();
				}
				this._oDialogs[sDlg] = null;
			},
			onChangeStickyNoteCancel: function () {
				this._closeDlg("changeStickyNoteDlg");
			},
			onChangeStickyNoteConfirm: function () {
				var _sValueState = this._oDialogs.changeStickyNoteDlg.getModel().getProperty("/noteTextState");
				if (_sValueState === "Error") {
					return;
				}
				FunctionCallExecutor.executeChangeSticky(this).then(function (aResponse) {
					var _oHeader = this.getView().byId("header::headerEditable::StickyNote::PlainTextVBox");
					var _oBtn = this.getView().byId("action::ActionChangeStickyNote");
					_oBtn.setEnabled(false);
					_oHeader.setBusy(true);
					if (_oHeader) {
						var _oModel = this.getView().getModel();
						var _sPath = _oHeader.getBindingContext().getPath();
						_oModel.read(_sPath, {
							success: function (oRes) {
								if (oRes && oRes.NoteText && oRes.NoteText !== "") {
									_oBtn.setText(this.getView().getModel("i18n").getProperty("ActionChangeStickyNote"));
								} else {
									_oBtn.setText(this.getView().getModel("i18n").getProperty("ActionCreateStickyNote"));
								}
								_oHeader.setBusy(false);
								_oBtn.setEnabled(true);
							}.bind(this),
							error: function () {
								_oHeader.setBusy(false);
								_oBtn.setEnabled(true);
							}
						});
					}
					this._closeDlg("changeStickyNoteDlg");
				}.bind(this));
			},

			onClickActionCreateNoteForInvoice: function (oEvent) {
				var _oDlgContentModel = ModelGenerator.generateDataModelForCreateInvoiceNote();
				var _oSource = oEvent.getSource();
				var _oParentTable = _oSource.getParent().getParent();
				var _sEventFrom = _oParentTable.getId().match(/--.+::responsiveTable/)[0].replace("--", "");
				if (!this._oDialogs.createInvoiceNoteDlg) {
					this._oDialogs.createInvoiceNoteDlg = {};
					DialogHandler.createDialogWithTextArea(this,
						"fin.ar.process.receivables.ext.fragments.CollectionInvoiceDialog.CreateInvoiceNoteDialog",
						"createInvoiceNoteDlg").then(function (oDialog) {
						this._oDialogs.createInvoiceNoteDlg.Dlg = oDialog;
						this._oDialogs.createInvoiceNoteDlg.eventFrom = _sEventFrom;
						this._oDialogs.createInvoiceNoteDlg.Dlg.setModel(this.getView().getModel("i18n"), "i18n");
						this._oDialogs.createInvoiceNoteDlg.Dlg.setModel(new JSONModel(_oDlgContentModel));
						this._oDialogs.createInvoiceNoteDlg.Dlg.open();

					}.bind(this));
				}
			},

			onCreateInvoiceNoteCancel: function () {
				this._closeDlg("createInvoiceNoteDlg");
			},
			onCreateInvoiceNoteConfirm: function (oEvent) {
				var _noteText = this._oDialogs.createInvoiceNoteDlg.Dlg.getModel().getProperty("/invoiceNoteText");
				this._closeDlg("createInvoiceNoteDlg");
				FunctionCallExecutor.executeCreateInvoiceNote(_noteText, this, function (aResponse) {
					var _iD = this.getView().getId().replace("CollectionsAccount", "CollectionsInvoice--CollectionsInvoiceNote--CollsInvNoteList");
					sap.ui.getCore().byId(_iD).getBinding("items").refresh();
				}.bind(this), function (err) {});
			},
			onBeforeSemanticObjPopoverOpen: function (oEvent) {
				var _oParameters = oEvent.getParameters();
				var _oBindingContext = oEvent.getSource().getBindingContext();
				var _oAttributes = _oParameters.semanticAttributes;
				var _sSemanticObject = _oParameters.semanticObject;
				_oAttributes.PaidAmount = undefined;
				_oAttributes.CreditedAmount = undefined;
				if (_oAttributes && _sSemanticObject === "DisputeCase") {
					_oAttributes.CaseID = _oAttributes.DisputeCase;
				} else if (_oAttributes && _sSemanticObject === "PromiseToPay") {
					_oAttributes.CaseID = _oAttributes.PromiseToPay;
					_oAttributes.Customer = _oBindingContext.getProperty("Customer");
				} else if (_oAttributes && _sSemanticObject === "CollectionsResubmission") {
					_oAttributes.ResubmissionUUID = _oBindingContext.getProperty("ResubmissionUUID");
					_oAttributes.ResubmissionDueDate = _oBindingContext.getProperty("ResubmissionDueDate");
					_oAttributes.BusinessPartner = oEvent.getSource().getBindingContext().getProperty("BusinessPartner");
					_oAttributes.CollectionSegment = oEvent.getSource().getBindingContext().getProperty("CollectionSegment");
				} else if (_oAttributes && _sSemanticObject === "AccountingDocument") {
					if (_oAttributes["sap-system"] === "") {
						delete _oAttributes["sap-system"];
					}
				} else if (_oAttributes && _sSemanticObject === "Customer") {
					_oAttributes.CollectionSegment = this.getView().getBindingContext().getProperty("CollectionSegment");
					if (_oAttributes.CollectionSegment === null || _oAttributes.CollectionSegment === "") {
						_oAttributes.CompanyCode = this.getView().getBindingContext().getProperty("CompanyCode");
					} else {
						// _oAttributes.CompanyCode = "";
						// delete _oAttributes.CompanyCode;
					}
					if (_oParameters.id.search("headQuarterLink") === -1) {
						_oAttributes.Customer = _oBindingContext.getProperty("BranchAccount");
					} else {
						_oAttributes.Customer = _oBindingContext.getProperty("HeadOffice");
					}
					delete _oAttributes.BusinessPartner; // do not set it to = "";
					delete _oAttributes.HeadOfficeName;
					delete _oAttributes.BranchName;
				}
			},

			// Adjust semantic navigtion for Customer: Delete Business Partner, Customer is enough
			onCustomerTargetsObtained: function (oEvent) {
				// Get company code
				var _sCompanyCode = this.getView().getBindingContext().getProperty("CompanyCode");

				// Set attributes
				if (_sCompanyCode === "") {
					jQuery.each(oEvent.getParameters().actions, function (index) {
						var _sHref = oEvent.getParameters().actions[index].getProperty("href").split("&sap-app-origin-hint")[0];
						_sHref = _sHref.replace("BusinessPartner=", "");
						if (_sHref.search("Receivables") === -1) {
							//Delete CompanyCode="" for other applications
							_sHref = _sHref.replace("CompanyCode=", "");
						}
						oEvent.getParameters().actions[index].setProperty("href", _sHref);
					});
				}
			},

			onClickActionCreateResubmission: function (oEvent) {
				var oNavigationController = this.extensionAPI.getNavigationController();
				var oParams = {
					preferredMode: "create",
					ResubmissionUUID: "00000000-0000-0000-0000-000000000000",
					BusinessPartner: oEvent.getSource().getBindingContext().getProperty("BusinessPartner"),
					CollectionSegment: oEvent.getSource().getBindingContext().getProperty("CollectionSegment")
				};

				FunctionCallExecutor.executeAuthCheckBeforeNav(this, "/CheckAuthorization", {
					CollectionSegment: oEvent.getSource().getBindingContext().getProperty("CollectionSegment")
				}).then(function (oRes) {
					if (oRes && !oRes[0].response.data.CheckAuthorization.Noauthority) {
						oNavigationController.navigateExternal(oNavObject.create.CollectionsResubmission, oParams);
					} else {
						var _oI18nModel = this.getView().getModel("i18n");
						var _oMsgParams = {
							title: _oI18nModel.getProperty("ErrorMsgDialogTitle"),
							type: "Message",
							state: "Error",
							content: _oI18nModel.getProperty("ErrorMsgDialogContent"),
							btnText: _oI18nModel.getProperty("ErrorMsgDialogOK")
						};
						DialogHandler.openMessageDialog(_oMsgParams);
					}
				}.bind(this));
			},

			onClickActionCompleteResubmission: function (oEvent) {
				FunctionCallExecutor.executeCompleteResubmission(this, function (aResponse) {
					this._refreshTableContent("CollectionsResubmission::responsiveTable", {});
				}.bind(this), function (err) {
					// this.onErrorTriggered(err);
				});
			},

			onClickActionCreateCustomerContact: function (oEvent) {
				// Start creation of contact person 
				if (!this._oDialogs.createContactPersonDlg) {
					this._oDialogs.createContactPersonDlg = {};
					DialogHandler.createDialogWithTextArea(this,
							"fin.ar.process.receivables.ext.fragments.CreateContactPersonDialog",
							"createContactPersonDlg")
						.then(function (oDialog) {
							// Open Popup
							this._oDialogs.createContactPersonDlg = oDialog;
							this.getView().addDependent(this._oDialogs.createContactPersonDlg);
							this._oDialogs.createContactPersonDlg.open();
						}.bind(this));
				}
			},

			onCreateContactPersonHelp: function () {
				// Show message box with help text
				MessageBox.information(this.getView().getModel("i18n").getProperty("ChooseContactPersonHelp"));
			},

			onCreateContactPersonCancel: function (oEvent) {
				// Get Business Partner from context
				var _sBusinessPartner = oEvent.getSource().getBindingContext().getProperty("BusinessPartner");

				// Build string to reset model
				var _sResetString = "/CollectionsContactForCreate('" + _sBusinessPartner + "')";

				// Reset model changes
				this.getView().getModel().resetChanges([_sResetString]);

				// Cancel creation of Contact Person
				this._closeDlg("createContactPersonDlg");
			},

			onCreateContactPersonDialogConfirm: function (oEvent) {
				// Get chosen contact person
				var sBusinessPartnerPerson = DialogHandler.getDialogElement(this, "createContactPersonDlg", "businessPartnerPerson").getValue();

				var sValueState = DialogHandler.getDialogElement(this, "createContactPersonDlg", "businessPartnerPerson").getValueState();

				if (sValueState !== "Error") {
					// Get Business Partner from context
					var _sBusinessPartner = oEvent.getSource().getBindingContext().getProperty("BusinessPartner");

					// Build string to reset model
					var _sResetString = "/CollectionsContactForCreate('" + _sBusinessPartner + "')";

					// Reset model changes
					this.getView().getModel().resetChanges([_sResetString]);

					// Get navigation controller
					var oNavigationController = this.extensionAPI.getNavigationController();

					// Fill navigation parameters
					var oParams = {
						preferredMode: "create",
						RelationshipNumber: "",
						BusinessPartnerCompany: oEvent.getSource().getBindingContext().getProperty("BusinessPartner"),
						BusinessPartnerPerson: sBusinessPartnerPerson,
						CollectionSegment: oEvent.getSource().getBindingContext().getProperty("CollectionSegment")
					};

					// Get parameters for validation
					var oParamsForValidation = {
						Businesspartner: oEvent.getSource().getBindingContext().getProperty("BusinessPartner"),
						Contactperson: sBusinessPartnerPerson
					};

					// Check if user is authorized to create contact persons
					FunctionCallExecutor.executeAuthCheckBeforeNav(this, "/CheckAuthForCustomerContact", oParamsForValidation).then(function (oRes) {
						if (oRes && !oRes[0].response.data.CheckAuthForCustomerContact.Noauthority) {

							// Navigate to App "Manage Collections Contact Person" in create mode
							oNavigationController.navigateExternal(oNavObject.create.CollectionsContactPerson, oParams);
						} else {

							// Issue error message
							var _oI18nModel = this.getView().getModel("i18n");
							var _oMsgParams = {
								title: _oI18nModel.getProperty("ErrorMsgDialogTitle"),
								type: "Message",
								state: "Error",
								content: _oI18nModel.getProperty("ErrorMsgDialogContent"),
								btnText: _oI18nModel.getProperty("ErrorMsgDialogOK")
							};
							DialogHandler.openMessageDialog(_oMsgParams);
						}
					}.bind(this));

					// Close Popup
					this._closeDlg("createContactPersonDlg");
				}
			},

			onClickActionShowRelatedPromisesToPay: function (oEvent) {
				var oNavigationController = this.extensionAPI.getNavigationController();

				var oElement = oEvent.getSource();
				var oSelectedItems = oElement.getParent().getParent().getSelectedItems();
				var oParams = {
					preferredMode: "display",
					Prms2PToInvoiceGroupRefUUID: oSelectedItems[0].getBindingContext().getProperty("Prms2PToInvoiceGroupRefUUID")
				};

				oNavigationController.navigateExternal(oNavObject.manage.PromiseToPay, oParams);

			},

			onClickActionSetAsDefaultContact: function (oEvent) {
				var _oModel = this.getView().getModel();
				var _oGeneralFacet = this.getView().byId(
					"fin.ar.process.receivables::sap.suite.ui.generic.template.ObjectPage.view.Details::CollectionsAccount--header::headerEditable::GeneralData::Form"
				);
				var _oBindingContext = _oGeneralFacet.getBindingContext();
				var _sBindingPath = _oBindingContext.getPath();
				_oGeneralFacet.setBusy(true);
				FunctionCallExecutor.executeSetDefaultContract(this).then(function () {
					this._refreshTableContent("CollectionsContacts::responsiveTable", {});
					var _oTable = this.getView().byId("CollectionsContacts::responsiveTable");
					_oTable.removeSelections();
					_oModel.read(_sBindingPath, { /** update header facet main contact*/
						urlParameters: {
							"$expand": "to_CollectionsMainContact"
						},
						success: function () {
							_oGeneralFacet.setBusy(false);
						},
						error: function () {
							_oGeneralFacet.setBusy(false);
						}
					});
				}.bind(this));
			},

			onClickActionDeleteCustomerContact: function (oEvent) {
				var oElement = oEvent.getSource();
				var oTable = oElement.getParent().getParent();
				var oSelectedItem = oTable.getSelectedItem();
				var oI18nModel = this.getView().getModel("i18n").getResourceBundle();
				var sText = oI18nModel.getText("DeleteCustomerContactConfirmation", oSelectedItem.getBindingContext().getProperty(
					"ContactPersonName"));
				MessageBox.warning(sText, {
					title: oI18nModel.getText("ConfirmDeleteCustomerContactTitle"),
					actions: [MessageBox.Action.YES, MessageBox.Action.NO],
					emphasizedAction: MessageBox.Action.YES,
					onClose: function (sAction) {
						if (sAction === "YES") {
							var oParameters = {
								"RelationshipNumber": oSelectedItem.getBindingContext().getProperty("RelationshipNumber"),
								"BusinessPartnerCompany": oSelectedItem.getBindingContext().getProperty("BusinessPartnerCompany"),
								"BusinessPartnerPerson": oSelectedItem.getBindingContext().getProperty("BusinessPartnerPerson"),
								"CollectionSegment": oSelectedItem.getBindingContext().getProperty("CollectionSegment"),
								"DraftUUID": "00000000-0000-0000-0000-000000000000",
								"IsActiveEntity": true
							};
							oTable.setBusy(true);
							FunctionCallExecutor.deleteCustomerContact(this, oParameters).then(function (oRes) {
								oTable.setBusy(false);
								this._refreshTableContent("CollectionsContacts::responsiveTable", {});
								var _sMessageString = oRes.headers["sap-message"];
								var _oMessage = {
									"message": "",
									"severity": "success"
								};
								try {
									_oMessage = JSON.parse(_sMessageString);
								} catch (e) {
									// do nothing
								}
								if (_oMessage.severity === "success") {
									sap.m.MessageToast.show(_oMessage.message);
								} else {
									sap.m.MessageBox.Error(_oMessage.message);
								}

								// // ToDo: Success Message
							}.bind(this)).catch(function (e) {
								// ToDo: Error Message
								oTable.setBusy(false);

								try {
									var _oMessage = JSON.parse(e.responseText);

									sap.m.MessageBox.Error(_oMessage.message);

								} catch (e) {
									// do nothing
								}

							});
						}
					}.bind(this)
				});

			},

			onClickActionWithdrawPromiseToPay: function (oEvent) {
				FunctionCallExecutor.executeRevokePromiseToPay(this)
					.then(function () {
						this._refreshTableContent("PromiseToPayCollectionSegment::responsiveTable", {});
					}.bind(this));
			},

			onClickActionCreatePromiseToPayForInvoice: function (oEvent) {
				FunctionCallExecutor.executeCreatePromiseToPay(this, function (oResponse) {
					var oNavigationController = this.extensionAPI.getNavigationController();
					var sPromiseToPayUUID = oResponse[0][0].response.data.CreatePromiseToPay.Caseuuid;
					var sDraftUUID = oResponse[0][0].response.data.CreatePromiseToPay.Draftuuid;
					var oParams = {
						preferredMode: "display",
						PromiseToPayUUID: sPromiseToPayUUID,
						DraftUUID: sDraftUUID,
						IsActiveEntity: false
					};
					oNavigationController.navigateExternal(oNavObject.manage.PromiseToPay, oParams);
				}.bind(this), function (err) {
					// this.onErrorTriggered.call(this, err);
				});
			},

			onClickActionCreateResubmissionForInvoice: function (oEvent) {
				FunctionCallExecutor.executeCreateInvoiceResubmission(this, function (oResponse) {
					var oNavigationController = this.extensionAPI.getNavigationController();
					var sResubmissionUUID = oResponse[0][0].response.data.CreateResubmission.Caseuuid;
					var sDraftUUID = oResponse[0][0].response.data.CreateResubmission.Draftuuid;

					var oParams = {
						preferredMode: "display",
						ResubmissionUUID: sResubmissionUUID,
						DraftUUID: sDraftUUID,
						IsActiveEntity: false
					};
					oNavigationController.navigateExternal(oNavObject.manage.CollectionsResubmission, oParams);
				}.bind(this));
			},

			onClickActionCreateDisputeCaseForInvoice: function (oEvent, sCurrency) {
				var _sDlgSelectedCompanyCode = "";
				var _sDlgSelectedCurrency = "";
				var _bCompanyCodeVisible = false;
				var _bCurrencyVisible = false;
				if (this._oDialogs.createInvoiceDisputeCaseDlg) {
					_bCompanyCodeVisible = this._oDialogs.createInvoiceDisputeCaseDlg.getModel().getProperty("/CompanyCodeVisible");
					_bCurrencyVisible = this._oDialogs.createInvoiceDisputeCaseDlg.getModel().getProperty("/CurrencyVisible");
					_sDlgSelectedCompanyCode = DialogHandler.getDialogElement(this, "createInvoiceDisputeCaseDlg", "selectCompanyCode").getSelectedKey();
					_sDlgSelectedCurrency = DialogHandler.getDialogElement(this, "createInvoiceDisputeCaseDlg", "selectCurrency").getSelectedKey();
				}

				if (this._oDialogs.createInvoiceDisputeCaseDlg && _bCompanyCodeVisible && _sDlgSelectedCompanyCode === "") {
					this._byDialogId("createInvoiceDisputeCaseDlg", "selectCompanyCode").setValueState(sap.ui.core.ValueState.Error);
					return;
				}
				if (this._oDialogs.createInvoiceDisputeCaseDlg && _bCurrencyVisible && _sDlgSelectedCurrency === "") {
					this._byDialogId("createInvoiceDisputeCaseDlg", "selectCurrency").setValueState(sap.ui.core.ValueState.Error);
					return;
				}

				if (_sDlgSelectedCurrency) {
					var sSelectedCurrency = _sDlgSelectedCurrency;
				} else {
					sSelectedCurrency = sCurrency;
				}

				FunctionCallExecutor.executeCreateDisputeCaseForInvoices(this, {
					CompanyCode: _sDlgSelectedCompanyCode,
					Currency: sSelectedCurrency
				}, function (oResponse) {
					var oNavigationController = this.extensionAPI.getNavigationController();
					var sDisputeCaseUUID = oResponse[0][0].response.data.CreateDisputeCase.Caseuuid;
					var sDraftUUID = oResponse[0][0].response.data.CreateDisputeCase.Draftuuid;
					var oParams = {
						preferredMode: "display",
						DisputeCaseUUID: sDisputeCaseUUID,
						DraftUUID: sDraftUUID,
						IsActiveEntity: false
					};

					oNavigationController.navigateExternal(oNavObject.manage.DisputeCase, oParams);
					this._closeDlg("createInvoiceDisputeCaseDlg");
				}.bind(this), function (err) {
					this._closeDlg("createInvoiceDisputeCaseDlg");
					// this.onErrorTriggered.call(this, err);
				}.bind(this));
			},

			onCreateCustomerDisputeConfirm: function (oEvent) {
				var _oDlgModel = this._oDialogs.createDisputeDlg.getModel("localJson");
				var _sCompany = _oDlgModel.getProperty("/SelectedCompany");
				var _sValueStateText = this.getView().getModel("i18n").getProperty("SelectACompany");
				if (!_sCompany || _sCompany.length === 0) {
					DialogHandler.getDialogElement(this, "CreateDisputeCaseDialog", "inputCompany").setValueState(sap.ui.core.ValueState.Error);
					DialogHandler.getDialogElement(this, "CreateDisputeCaseDialog", "inputCompany").setValueStateText(_sValueStateText);
					return;
				}
				this._closeDlg("createDisputeDlg");
				FunctionCallExecutor.executeCreateCustomerDisputeCase(this, {
					CompanyCode: _sCompany
				}).then(function (oResponse) {
					var oNavigationController = this.extensionAPI.getNavigationController();
					var sDisputeCaseUUID = oResponse[0].response.data.DisputeCaseUUID;
					var sDraftUUID = oResponse[0].response.data.DraftUUID;
					var oParams = {
						preferredMode: "edit",
						DisputeCaseUUID: sDisputeCaseUUID,
						DraftUUID: sDraftUUID,
						IsActiveEntity: false
					};
					oNavigationController.navigateExternal(oNavObject.manage.DisputeCase, oParams);
				}.bind(this));
			},

			onCompanySelectionChanged: function (oEvent) {
				var _oSource = oEvent.getSource();
				var _sSelectedKey = "";
				if (_oSource.getSelectedItem()) {
					_sSelectedKey = _oSource.getSelectedItem().getProperty("key");
				}
				var _oDlgModel = this._oDialogs.createDisputeDlg.getModel("localJson");
				_oDlgModel.setProperty("/SelectedCompany", _sSelectedKey);
			},

			onClickActionFinishCustomerContact: function (oEvent) {
				FunctionCallExecutor.executeCompleteCustomerContact(this).then(function (aResponse) {
					var oNavigationController = this.extensionAPI.getNavigationController();
					var sCustomerContactUUID = aResponse[0].response.data.CompleteCustomerContact.Customercontactuuid;
					var sDraftUUID = aResponse[0].response.data.CompleteCustomerContact.Draftuuid;
					var oParams = {
						preferredMode: "display",
						CustomerContactUUID: sCustomerContactUUID,
						DraftUUID: sDraftUUID,
						IsActiveEntity: false
					};
					oNavigationController.navigateExternal(oNavObject.manage.CollectionsCustomerContact, oParams);
				}.bind(this));
			},

			onIconOfAccountNotePress: function (oEvent) {
				var oNavigationController = this.extensionAPI.getNavigationController();
				var sMigrationStatus = oEvent.getSource().getBindingContext().getProperty("MigrationStatus");
				var sCustomerContactUUID = oEvent.getSource().getBindingContext().getProperty("CustomerContactUUID");
				var sDraftUUID = oEvent.getSource().getBindingContext().getProperty("DraftUUID");
				var _sUserData = sap.ushell.Container.getService("UserInfo").getId();
				var oParams = {
					preferredMode: "display",
					CustomerContactUUID: sCustomerContactUUID,
					DraftUUID: sDraftUUID,
					IsActiveEntity: true
				};

				if (sMigrationStatus === "1") {
					oNavigationController.navigateExternal(oNavObject.manage.CollectionsCustomerContact, oParams);
				} else if (sMigrationStatus === "3") {
					oParams.IsActiveEntity = false;
					if (_sUserData === oEvent.getSource().getBindingContext().getProperty("CreatedByUser")) {
						oNavigationController.navigateExternal(oNavObject.manage.CollectionsCustomerContact, oParams);
					} else {
						MessageToast.show(this.getView().getModel("i18n").getProperty("NotCorrectCustomerConcatcNav"));
					}
				} else {
					MessageToast.show(this.getView().getModel("i18n").getProperty("NoCustomerContactNav"));
				}
			},

			onUserDescriptionClick: function (oEvent) {
				var oSource = oEvent.getSource();
				var _oBindingContext = oSource.getBindingContext() || oSource.getBindingContext("NoteHistory"); // get binding context of click on note list or note list popover
				var _oContactData = _oBindingContext.getProperty();
				var _oContactCardData = ModelGenerator.generateDataModelForContactCard(_oContactData);
				DialogHandler.createPopoverDialog(this, "sap.suite.ui.generic.template.fragments.ContactDetails", "contactDetails").then(
					function (
						oPopover) {
						this._oDialogs.contactInfoDlg = oPopover;
						this._oDialogs.contactInfoDlg.openBy(oSource._getLinkSender());
						this._oDialogs.contactInfoDlg.setModel(new JSONModel(_oContactCardData), "contact");
						this._oDialogs.contactInfoDlg.setModel(this.getView().getModel("i18n"), "i18n");
						this._oDialogs.contactInfoDlg.attachAfterClose(this.onCloseUserDescription.bind(this));
					}.bind(this));
			},
			onCloseUserDescription: function (oEvent) {
				this._closeDlg("contactInfoDlg");
			},

			onDraftClick: function (oEvent) {
				var oBindingContext = oEvent.getSource().getBindingContext();
				var oSource = oEvent.getSource();
				if (this._oDialogs.draftDlg) {
					this._closeDlg("draftDlg");
				}
				var _oDraftDlgModel = ModelGenerator.generateDataModelForDraftDlg(oBindingContext);
				DialogHandler.createPopoverDialog(this, "fin.ar.process.receivables.ext.fragments.DraftPopover", "draftInfoPopover").then(
					function (
						oPopover) {
						this._oDialogs.draftDlg = oPopover;
						this._oDialogs.draftDlg.setModel(new JSONModel(_oDraftDlgModel.adminData), "admin");
						this._oDialogs.draftDlg.setModel(new JSONModel(_oDraftDlgModel.generalData), "general");
						this._oDialogs.draftDlg.setModel(this.getView().getModel("i18n"), "i18n");
						this._oDialogs.draftDlg.openBy(oSource);
						this._oDialogs.draftDlg.attachAfterClose(this.closeDraftAdminPopover.bind(this));
					}.bind(this));
			},

			closeDraftAdminPopover: function (oEvent) {
				this._closeDlg("draftDlg");
			},

			onPostingKeyClick: function (oEvent) {
				var _oSource = oEvent.getSource();
				var _oBindingContext = _oSource.getBindingContext();
				var _sDialogId = "postingNoteListDialog";
				DialogHandler.createPopoverDialog(this, "fin.ar.process.receivables.ext.fragments.PostingNoteList", _sDialogId).then(function (
					oPopover) {
					this._oDialogs.postingNoteListDlg = oPopover;
					this._oDialogs.postingNoteListDlg.setModel(this.getView().getModel("i18n"), "i18n");
					this._oDialogs.postingNoteListDlg.attachAfterClose(this.onPostingNoteListClose.bind(this));
					this._oDialogs.postingNoteListDlg.openBy(_oSource);
					var _oList = this._byDialogId(_sDialogId, "postingNoteList");
					_oList.setBusy(true);
					return FunctionCallExecutor.getPostNote(this, {
						CollectionSegment: _oBindingContext.getProperty("CollectionSegment"),
						CompanyCode: _oBindingContext.getProperty("CompanyCode"),
						FiscalYear: _oBindingContext.getProperty("FiscalYear"),
						AccountingDocument: _oBindingContext.getProperty("AccountingDocument"),
						AccountingDocumentItem: _oBindingContext.getProperty("AccountingDocumentItem")
					});
				}.bind(this)).then(function (oResponse) {
					var _oDataModel = ModelGenerator.generateDataModelForPostNoteListPopover(oResponse);
					var _oList = this._byDialogId(_sDialogId, "postingNoteList");
					this._oDialogs.postingNoteListDlg.setModel(new JSONModel(_oDataModel), "NoteHistory");
					_oList.setBusy(false);
				}.bind(this));
			},

			onLatePaymentRiskClick: function (oEvent) {
				var _oSource = oEvent.getSource();
				var _oBindingContext = _oSource.getBindingContext();
				var _sDialogId = "LatePaymentListDialog";

				DialogHandler.createPopoverDialog(this, "fin.ar.process.receivables.ext.fragments.LatePaymentRisk", _sDialogId).then(function (
					oPopover) {
					this._oDialogs.LatePaymentListDialog = oPopover;
					this._oDialogs.LatePaymentListDialog.setModel(this.getView().getModel("i18n"), "i18n");
					this._oDialogs.LatePaymentListDialog.openBy(_oSource);
					this._oDialogs.LatePaymentListDialog.attachAfterClose(this.onLatePaymentListClose.bind(this));

					return FunctionCallExecutor.getLatePaymentRiskFactors(this, {
						CollectionSegment: _oBindingContext.getProperty("CollectionSegment"),
						CompanyCode: _oBindingContext.getProperty("CompanyCode"),
						FiscalYear: _oBindingContext.getProperty("FiscalYear"),
						AccountingDocument: _oBindingContext.getProperty("AccountingDocument"),
						AccountingDocumentItem: _oBindingContext.getProperty("AccountingDocumentItem")
					});
				}.bind(this)).then(function (oResponse) {
					var _oDataModel = ModelGenerator.generateDataModelForLatePaymentRiskPopover(oResponse, this);
					var oModel = new JSONModel(_oDataModel);
					this._oDialogs.LatePaymentListDialog.setModel(oModel, "LatePayment");

				}.bind(this));
			},

			onPostingNoteListClose: function (oEvent) {
				this._closeDlg("postingNoteListDlg");
			},

			onLatePaymentListClose: function () {
				this._closeDlg("LatePaymentListDialog");
			},

			onDisputeCaseClick: function (oEvent) {
				var _oSource = oEvent.getSource();
				var _oBindingContext = _oSource.getBindingContext();
				var _sDialogId = "relatedDisputeCaseDialog";
				DialogHandler.createPopoverDialog(this, "fin.ar.process.receivables.ext.fragments.RelatedDisputeCaseList", _sDialogId).then(
					function (
						oPopover) {
						this.getView().addDependent(oPopover);
						oPopover.bindElement(_oBindingContext.getPath());

						this._oDialogs.relatedDisputeCaseListDlg = oPopover;
						this._oDialogs.relatedDisputeCaseListDlg.setModel(this.getView().getModel("i18n"), "i18n");
						this._oDialogs.relatedDisputeCaseListDlg.attachAfterClose(this.onRelatedDisputeCasesClose.bind(this));
						this._oDialogs.relatedDisputeCaseListDlg.openBy(_oSource);

					}.bind(this));
			},

			onRelatedDisputeCasesClose: function (oEvent) {
				this._closeDlg("relatedDisputeCaseListDlg");
			},

			onPostNote: function (oEvent) {
				FunctionCallExecutor.executePostNote(this, oEvent).then(function () {
					this._refreshTableContent("CollectionAccountNotes--CollsAcctNoteList", {});
					//	this.getView().byId("CollectionAccountNotes--CollsAcctNoteList").getModel().refresh();
				}.bind(this));
			},

			onPostInvoiceNote: function (oEvent) {
				FunctionCallExecutor.executePostInvoiceNote(this, oEvent).then(function () {
					this._refreshTableContent("CollectionsInvoiceNote--CollsInvNoteList", {});
				}.bind(this));
			},

			onBillingDocumentIconPress: function (oEvent) {
				// Get Binding Context
				var oBindingContext = oEvent.getSource().getBindingContext();

				// Get Billing Document
				FunctionCallExecutor.executeGetBillingDocumentURL(this, oBindingContext).then(function (oResponse) {
					// Parse Response
					var sUrl = oResponse[0].response.data.DetermineURLForExtLinkdObj.Url;

					// Open new Tab
					sap.m.URLHelper.redirect(sUrl, true);

				});

			},

			_getBillingDocumentWithLeadingZeroes: function (sBillingDocument) {
				// Add leading zeroes to Document ID: VBELN - CHAR(10)
				var sConvertedBillingDocument = String(sBillingDocument);
				while (sConvertedBillingDocument.length < 10) {
					sConvertedBillingDocument = "0" + sConvertedBillingDocument;
				}
				return sConvertedBillingDocument;
			},

			onUpdateAccountNote: function (oSource) {
				var _oParentBindingContext = this.getView().getBindingContext();
				var _oDlgModel = ModelGenerator.generateDataModelForUpdateInvoiceNote(_oParentBindingContext, oSource.getBindingContext());
				DialogHandler.createDialogWithTextArea(this,
						"fin.ar.process.receivables.ext.fragments.CollectionInvoiceDialog.UpdateAccountNoteDialog", "updateInvoiceDialog")
					.then(function (oDialog) {
						this._oDialogs.updateInvoiceDisputeCaseDlg = oDialog;
						this._oDialogs.updateInvoiceDisputeCaseDlg.setModel(this.getView().getModel("i18n"), "i18n");
						this._oDialogs.updateInvoiceDisputeCaseDlg.setModel(new JSONModel(_oDlgModel));
						this._oDialogs.updateInvoiceDisputeCaseDlg.open();
					}.bind(this));
			},
			onUpdateAccountNoteConfirm: function (oEvent) {
				var _oBindData = oEvent.getSource().getParent().getModel().getData();
				FunctionCallExecutor.executeUpdatePostNote(this, {
					Customer: _oBindData.Customer,
					CompanyCode: _oBindData.CompanyCode,
					CollectionSegment: _oBindData.CollectionSegment,
					Noteid: _oBindData.NoteId,
					Notetext: _oBindData.noteText
				}).then(function () {
					this._refreshTableContent("CollectionAccountNotes--CollsAcctNoteList", {});
				}.bind(this));
				this._closeDlg("updateInvoiceDisputeCaseDlg");
			},
			onUpdateAccountNoteCancel: function () {
				this._closeDlg("updateInvoiceDisputeCaseDlg");
			},

			_afterPageDataLoaded: function (oEvent) {
				var _sPath = this.getView().getBindingContext().getPath().substring(1);
				var _oModelData = oEvent.context.getModel().oData[_sPath];

				if (_oModelData && _oModelData.UICT_SegmentAuthorization && !_oModelData.CompanyCodeIsWorkable) {
					if (this.getView().byId("action::ActionFinishCustomerContact")) {
						this.getView().byId("action::ActionFinishCustomerContact").setVisible(true);
					}
				} else {
					if (this.getView().byId("action::ActionFinishCustomerContact")) {
						this.getView().byId("action::ActionFinishCustomerContact").setVisible(false);
					}
				}

				if (_oModelData && _oModelData.UICT_CollectableAmount) {
					if (this.getView().byId("header::headerEditable::AmountToBeCollected::SmartMicroChartTitle")) {
						this.getView().byId("header::headerEditable::AmountToBeCollected::SmartMicroChartTitle").setVisible(false);
					}
				} else if (_oModelData && !_oModelData.UICT_CollectableAmount) {
					if (this.getView().byId("header::headerEditable::AmountToBeCollected::SmartMicroChartTitle")) {
						this.getView().byId("header::headerEditable::AmountToBeCollected::SmartMicroChartTitle").setVisible(true);
					}
				}

				if (_oModelData && _oModelData.CompanyCodeIsWorkable) {
					if (this.getView().byId("action::ActionChangeStickyNote")) {
						this.getView().byId("action::ActionChangeStickyNote").setVisible(false);
					}
					if (this.getView().byId("header::headerEditable::StickyNote::PlainTextLabel")) {
						this.getView().byId("header::headerEditable::StickyNote::PlainTextLabel").setVisible(false);
					}
				} else if (_oModelData && !_oModelData.CompanyCodeIsWorkable) {
					if (this.getView().byId("action::ActionChangeStickyNote")) {
						this.getView().byId("action::ActionChangeStickyNote").setVisible(true);
					}
					if (this.getView().byId("header::headerEditable::StickyNote::PlainTextLabel")) {
						this.getView().byId("header::headerEditable::StickyNote::PlainTextLabel").setVisible(true);
					}
				}

				if (_oModelData && !_oModelData.UICT_SegmentAuthorization) {
					if (this.getView().byId("ActionCreateResubmissionForInvoice")) {
						this.getView().byId("ActionCreateResubmissionForInvoice").setVisible(false);
					}
					if (this.getView().byId("ActionCompleteResubmission")) {
						this.getView().byId("ActionCompleteResubmission").setVisible(false);
					}
					if (this.getView().byId("ActionCreateResubmission")) {
						this.getView().byId("ActionCreateResubmission").setVisible(false);
					}
					if (this.getView().byId("ActionSetAsDefaultContact")) {
						this.getView().byId("ActionSetAsDefaultContact").setVisible(false);
					}
				} else if (_oModelData && _oModelData.UICT_SegmentAuthorization) {
					if (this.getView().byId("ActionCreateResubmissionForInvoice")) {
						this.getView().byId("ActionCreateResubmissionForInvoice").setVisible(true);
					}
					if (this.getView().byId("ActionCompleteResubmission")) {
						this.getView().byId("ActionCompleteResubmission").setVisible(true);
					}
					if (this.getView().byId("ActionCreateResubmission")) {
						this.getView().byId("ActionCreateResubmission").setVisible(true);
					}
					if (this.getView().byId("ActionSetAsDefaultContact")) {
						this.getView().byId("ActionSetAsDefaultContact").setVisible(true);
					}
				}
				this._initPageElementStatus();

				if (this._bAlreadySetFilter) {
					return;
				}
				var _oModel = this.getView().getModel();
				this._bAlreadySetFilter = true;
				FunctionCallExecutor.getCompaniesForSegmentPromise(_oModel, {
					//						Segment: _sSegment
				}).then(function (oRes) {
					this._companies = [];
					for (var i = 0; i < oRes.results.length; i++) {
						this._companies.push({
							"Company": oRes.results[i].CompanyCode,
							"Segment": oRes.results[i].CollectionSegment
						});
					}
				}.bind(this));

			},

			onAfterRendering: function () {
				var _aBindings = this.getView().getModel().getBindings();
				var _oChangeStickyNoteBtn = this.getView().byId("action::ActionChangeStickyNote");
				var _oFinishCustomerContactBtn = this.getView().byId("action::ActionFinishCustomerContact");
				var _aStickyNoteBinding = _aBindings.filter(function (binding) {
					return binding.sPath === "to_CollsAccountStickyNote";
				});

				if (_aStickyNoteBinding) {
					_aStickyNoteBinding[0].attachChange(function () {
						var _oBindingContext = this.getView().getBindingContext();
						var _oProperty;
						if (_oBindingContext) {
							_oProperty = _oBindingContext.getProperty("to_CollsAccountStickyNote");
						}
						//var _oProperty = this.getView().getBindingContext().getProperty("to_CollsAccountStickyNote");
						if (_oProperty && _oProperty.NoteText === "" && _oChangeStickyNoteBtn) {
							_oChangeStickyNoteBtn.setText(this.getView().getModel("i18n").getProperty("ActionCreateStickyNote"));
						} else if (_oChangeStickyNoteBtn) {
							_oChangeStickyNoteBtn.setText(this.getView().getModel("i18n").getProperty("ActionChangeStickyNote"));
						}
					}.bind(this));
				}

				sap.ushell.Container.getService("CrossApplicationNavigation").isNavigationSupported(aSemantics).done(function (aRes) {
					if (!aRes[4].supported && !aRes[5].supported) {
						_oFinishCustomerContactBtn.setVisible(false);
					}
				});

				// Attach event to Business Partner Semantic Navigation
				var _oBusinessPartnerSmartLink = this.getView().byId(
					"fin.ar.process.receivables::sap.suite.ui.generic.template.ObjectPage.view.Details::CollectionsAccount--header::headerEditable::GeneralData::BusinessPartner::Field"
				).getSemanticObjectController();

				// Adjust semantic navigtion for Business Partner
				/*				if (_oBusinessPartnerSmartLink) {
									_oBusinessPartnerSmartLink.attachNavigationTargetsObtained(function (oEvent) {
										// Get company code
										var _sCompanyCode = this.getView().getBindingContext().getProperty("CompanyCode");

										// Set attributes
										if (_sCompanyCode === "") {
											var _oSemanticAttributes = {
												//								"BusinessPartner": this.getView().getBindingContext().getProperty("BusinessPartner"),
												//								"CollectionSegment": this.getView().getBindingContext().getProperty("CollectionSegment"),
												"Customer": this.getView().getBindingContext().getProperty("Customer")
											};

											oEvent.getParameters().semanticAttributes = _oSemanticAttributes;

											jQuery.each(oEvent.getParameters().semanticAttributesOfSemanticObjects, function (index) {
												oEvent.getParameters().semanticAttributesOfSemanticObjects[index] = _oSemanticAttributes;
											});

											jQuery.each(oEvent.getParameters().actions, function (index) {
												var _sHref = oEvent.getParameters().actions[index].getProperty("href").split("&sap-app-origin-hint")[0];
												oEvent.getParameters().actions[index].setProperty("href", _sHref);
											});

										}

									}.bind(this));

									// Adjust semantic navigtion for Business Partner
									_oBusinessPartnerSmartLink.attachBeforePopoverOpens(function (oEvent) {
										// Get company code
										var _sCompanyCode = this.getView().getBindingContext().getProperty("CompanyCode");

										// Set attributes
										if (_sCompanyCode === "") {
											var _oSemanticAttributes = {
												//								"BusinessPartner": this.getView().getBindingContext().getProperty("BusinessPartner"),
												//								"CollectionSegment": this.getView().getBindingContext().getProperty("CollectionSegment"),
												"Customer": this.getView().getBindingContext().getProperty("Customer")
											};

											oEvent.getParameters().semanticAttributes = _oSemanticAttributes;

											jQuery.each(oEvent.getParameters().semanticAttributesOfSemanticObjects, function (index) {
												oEvent.getParameters().semanticAttributesOfSemanticObjects[index] = _oSemanticAttributes;
											});

										}

									}.bind(this));
								}*/
			},

			_refreshTableContent: function (sTableId, oUrlParams) {
				var _oTable = this.getView().byId(sTableId);
				_oTable.getBinding("items").refresh(true);
			},

			_setActionButton: function (sId, bEnabled) {
				var oBtn = this.getView().byId(sId);
				oBtn.setEnabled(bEnabled);
			},

			_byDialogId: function (sDialogId, sId) {
				return sap.ui.core.Fragment.byId(this.getView().getId() + "--" + sDialogId, sId);
			},

			onLeaveAppExtension: function (bIsDestroyed) {
				if (!bIsDestroyed) {
					var that = this;

					return function () {

						var sPath = that.getView().getBindingContext().getPath();
						that.getView().getModel().read(sPath, {
							success: function () {
								that._initPageElementStatus();

							}
						});

						var InvoiceTable = that.getView().byId("CollectionsInvoice::responsiveTable").getBinding("items"),
							DisputeCaseTable = that.getView().byId("DisputeCasesCollectionSegment::responsiveTable").getBinding("items"),
							PromiseToPayTable = that.getView().byId("PromiseToPayCollectionSegment::responsiveTable").getBinding("items"),
							ResubmissionTable = that.getView().byId("CollectionsResubmission::responsiveTable").getBinding("items"),
							ContactsTable = that.getView().byId("CollectionsContacts::responsiveTable").getBinding("items"),
							HeadOfficeBranchTable = that.getView().byId("CollectionsHeadOfficeBranch::responsiveTable").getBinding("items"),
							AccountNoteTable = that.getView().byId("CollectionAccountNotes--CollsAcctNoteList").getBinding("items");

						if (InvoiceTable) {
							InvoiceTable.refresh(true);
						}
						if (DisputeCaseTable) {
							DisputeCaseTable.refresh(true);
						}
						if (PromiseToPayTable) {
							PromiseToPayTable.refresh(true);
						}
						if (ResubmissionTable) {
							ResubmissionTable.refresh(true);
						}
						if (ContactsTable) {
							ContactsTable.refresh(true);
						}
						if (HeadOfficeBranchTable) {
							HeadOfficeBranchTable.refresh(true);
						}
						if (AccountNoteTable) {
							AccountNoteTable.refresh(true);
						}

					};
				}
			}
		});
	});