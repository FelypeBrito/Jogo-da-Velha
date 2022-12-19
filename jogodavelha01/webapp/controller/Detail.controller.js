sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/m/library",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (BaseController, JSONModel, formatter, mobileLibrary, MessageToast, MessageBox) {
    "use strict";

    // shortcut for sap.m.URLHelper
    var URLHelper = mobileLibrary.URLHelper;

    return BaseController.extend("jogodavelha01.controller.Detail", {

        formatter: formatter,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        onInit: function () {
            // Model used to manipulate control states. The chosen values make sure,
            // detail page is busy indication immediately so there is no break in
            // between the busy indication for loading the view's meta data
            var oViewModel = new JSONModel({
                busy: false,
                delay: 0,
                lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading")
            });

            this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

            this.setModel(oViewModel, "detailView");

            this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
        },

        /*=============================================================*/
        /* Metodos Customizados                                        */
        /* =========================================================== */

        onPressButton: function (oEvent) {

            var view = this.getView();
            var model = view.getModel();

            var bc = this.getView().getBindingContext();
            var obj = model.getProperty(bc.getPath());

            var globalPath = bc.getPath();

            var boxPath = this.byId("vboxConteudoPagina").getBindingContext().getPath();

            if (globalPath !== boxPath) {
                MessageBox.error("Selecionar entrada mais atual do histórico")
                return;
            }

            var finalizado = model.getProperty(bc.getPath() + "/Finalizado");

            if (finalizado) {
                return;
            }

            
            var status = model.getProperty(bc.getPath() + "/Status");

            if (status !== 'A') {
                MessageBox.error("Aguardando Ingressar segundo jogador!")
                return;
            }
            
            var imgBox = oEvent.getSource()
            var img = imgBox.getSrc();

            if (img == "../img/Branco.jpg") {
                //var button = oEvent.getSource();

                //if(button.getText() == ""){

                var vez = model.getProperty(bc.getPath() + "/Vez");
                debugger
                //button.setText(vez);

                img = imgBox.setAlt(vez);

                if (!model.hasPendingChanges()) {
                    MessageToast.show("Sem mudanças para gravar.");
                    return;
                }

                model.submitChanges({
                    success: function (oData) {

                        MessageToast.show("Mudanças realizadas.")
                        this.getView().setBusy(false);
                    }.bind(this),

                    error: function (oData) {

                        MessageToast.show("Aconteceu um erro.");
                        console.error(oData);
                        this.getView().setBusy(false);
                    }
                })
            }
        },

        onHistoricoSelected: function (oEvent) {

            var v = this.getView();
            var m = v.getModel();

            var globalPath = this.getView().getBindingContext().getPath();

            var historyItens = m.getData(globalPath + "/Jogadas")

            var oSelectedItem = oEvent.getSource();
            //se não for modelo default, informar nome do modelo. 
            //Ex:getBindingContext("pessoa");
            var oContext = oSelectedItem.getBindingContext();
            var sPath = oContext.getPath();

            var idx = historyItens.indexOf(sPath.substring(1));

            if (idx == 0) {
                sPath = globalPath;
            }

            var oProductDetailPanel = this.byId("vboxConteudoPagina");
            oProductDetailPanel.bindElement({
                path: sPath,
                expand: 'Jogadas'

            });
        },
        onPressIngressar: function (oEvent) {

            var oSource = oEvent.getSource();
            var bc = oSource.getParent().getBindingContext();
            var obj = bc.getObject();
            var oModel = this.getView().getModel();
            MessageToast.show("Alterando Status");
            oModel.callFunction("/Ingressar", {
                method: "POST",
                urlParameters: {
                    ID: obj.ID
                },
                success: function (oData, response) { },
                error: function (oError) { }
            })
        },









        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

        /**
         * Event handler when the share by E-Mail button has been clicked
         * @public
         */
        onSendEmailPress: function () {
            var oViewModel = this.getModel("detailView");

            URLHelper.triggerEmail(
                null,
                oViewModel.getProperty("/shareSendEmailSubject"),
                oViewModel.getProperty("/shareSendEmailMessage")
            );
        },


        /**
         * Updates the item count within the line item table's header
         * @param {object} oEvent an event containing the total number of items in the list
         * @private
         */
        onListUpdateFinished: function (oEvent) {
            var sTitle,
                iTotalItems = oEvent.getParameter("total"),
                oViewModel = this.getModel("detailView");

            // only update the counter if the length is final
            if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
                if (iTotalItems) {
                    sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
                } else {
                    //Display 'Line Items' instead of 'Line items (0)'
                    sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
                }
                oViewModel.setProperty("/lineItemListTitle", sTitle);
            }
        },

        /* =========================================================== */
        /* begin: internal methods                                     */
        /* =========================================================== */

        /**
         * Binds the view to the object path and expands the aggregated line items.
         * @function
         * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
         * @private
         */
        _onObjectMatched: function (oEvent) {

            var boxPath = this.byId("vboxConteudoPagina");

            //Reinicializa o vbox
            boxPath.unbindElement();


            var sObjectId = oEvent.getParameter("arguments").objectId;
            this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
            this.getModel().metadataLoaded().then(function () {
                var sObjectPath = this.getModel().createKey("JogoSet", {
                    ID: sObjectId
                });
                this._bindView("/" + sObjectPath);
            }.bind(this));
        },

        /**
         * Binds the view to the object path. Makes sure that detail view displays
         * a busy indicator while data for the corresponding element binding is loaded.
         * @function
         * @param {string} sObjectPath path to the object to be bound to the view.
         * @private
         */
        _bindView: function (sObjectPath) {
            // Set busy indicator during view binding
            var oViewModel = this.getModel("detailView");

            // If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
            oViewModel.setProperty("/busy", false);

            this.getView().bindElement({
                path: sObjectPath,
                parameters: {
                    expand: "Jogadas"

                },
                events: {
                    change: this._onBindingChange.bind(this),
                    dataRequested: function () {
                        oViewModel.setProperty("/busy", true);
                    },
                    dataReceived: function () {
                        oViewModel.setProperty("/busy", false);
                    }
                }
            });
        },

        _onBindingChange: function () {
            var oView = this.getView(),
                oElementBinding = oView.getElementBinding();

            // No data for the binding
            if (!oElementBinding.getBoundContext()) {
                this.getRouter().getTargets().display("detailObjectNotFound");
                // if object could not be found, the selection in the list
                // does not make sense anymore.
                this.getOwnerComponent().oListSelector.clearListListSelection();
                return;
            }

            var sPath = oElementBinding.getPath(),
                oResourceBundle = this.getResourceBundle(),
                oObject = oView.getModel().getObject(sPath),
                sObjectId = oObject.ID,
                sObjectName = oObject.Descricao,
                oViewModel = this.getModel("detailView");

            this.getOwnerComponent().oListSelector.selectAListItem(sPath);

            oViewModel.setProperty("/shareSendEmailSubject",
                oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
            oViewModel.setProperty("/shareSendEmailMessage",
                oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
        },

        _onMetadataLoaded: function () {
            // Store original busy indicator delay for the detail view
            var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
                oViewModel = this.getModel("detailView"),
                oLineItemTable = this.byId("lineItemsList"),
                iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();

            // Make sure busy indicator is displayed immediately when
            // detail view is displayed for the first time
            oViewModel.setProperty("/delay", 0);
            oViewModel.setProperty("/lineItemTableDelay", 0);

            oLineItemTable.attachEventOnce("updateFinished", function () {
                // Restore original busy indicator delay for line item table
                oViewModel.setProperty("/lineItemTableDelay", iOriginalLineItemTableBusyDelay);
            });

            // Binding the view will set it to not busy - so the view is always busy if it is not bound
            oViewModel.setProperty("/busy", true);
            // Restore original busy indicator delay for the detail view
            oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
        },

        /**
         * Set the full screen mode to false and navigate to list page
         */
        onCloseDetailPress: function () {
            this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
            // No item should be selected on list after detail page is closed
            this.getOwnerComponent().oListSelector.clearListListSelection();
            this.getRouter().navTo("list");
        },

        /**
         * Toggle between full and non full screen mode.
         */
        toggleFullScreen: function () {
            var bFullScreen = this.getModel("appView").getProperty("/actionButtonsInfo/midColumn/fullScreen");
            this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", !bFullScreen);
            if (!bFullScreen) {
                // store current layout and go full screen
                this.getModel("appView").setProperty("/previousLayout", this.getModel("appView").getProperty("/layout"));
                this.getModel("appView").setProperty("/layout", "MidColumnFullScreen");
            } else {
                // reset to previous layout
                this.getModel("appView").setProperty("/layout", this.getModel("appView").getProperty("/previousLayout"));
            }
        }
    });

});