 sap.ui.define([
     "es/cdl/yesui5pm003/controller/BaseController",
     "sap/ui/model/json/JSONModel",
     "sap/ui/model/Filter",
     "sap/ui/model/odata/type/Time",
     "sap/m/MessageBox",
     "sap/m/MessageToast",
     "es/cdl/yesui5pm003/util/Formatter",
     ], function(BaseController, JSONModel, Filter, Time, MessageBox, MessageToast, Formatter){
	
	"use strict";
 
	return BaseController.extend("es.cdl.yesui5pm003.controller.Notificacion", {
		
		formatter: Formatter,
		
		sPernr : "",
		sWerks : "",
		_vhPersonal : "",
		CLASE_ORDEN: "YMC",
		
		onInit : function() {
			
			var oViewModel = new JSONModel();
									
			var oRepuestosModel = new JSONModel({
				repuestos: new Array(),
				selectedItem: {}
			});
			
			var oEquiposModel = new JSONModel();
			var oNuevaOrdenModel = new JSONModel({
				Tplnr  : "",
				Descripcion : "",
				Werks : "",
				Equnr : "",
				Parada : false,
				Peticionario : "",
				PName : "",
				Destinatario : "",
				DName : "",
				Area : "",
				Sintomas : ""
			});
			var oMotivosModel = new JSONModel();
			var oPersonalModel = new JSONModel();
			var oResponsableModel = new JSONModel();
			var oUbicacionTecnicaModel = new JSONModel();
			var oRepuestosMatchCodeModel = new JSONModel();
			var oProcesoNotificacionModel = new JSONModel();	
			var oCatalogoTipoModel = new JSONModel();
			var oCatalogoCausaModel = new JSONModel();	
			
			this.setModel(oViewModel, 		 				'viewModel');	
			this.setModel(oEquiposModel, 					'equiposModel');
			this.setModel(oPersonalModel, 					'personalModel');
			this.setModel(oResponsableModel, 				'responsableModel');
			this.setModel(oMotivosModel, 					'motivosModel');
			this.setModel(oRepuestosModel, 					'repuestosModel');
			this.setModel(oNuevaOrdenModel, 				'nuevaOrdenModel');
			this.setModel(oUbicacionTecnicaModel, 			'ubicacionTecnicaModel');
			this.setModel(oRepuestosMatchCodeModel, 		'repuestosMatchCodeModel');
			this.setModel(oProcesoNotificacionModel, 		'procesoNotificacionModel');
			this.setModel(oCatalogoTipoModel, 				'catCausaModel');
			this.setModel(oCatalogoCausaModel, 				'catTipoModel');

			this.oWizardCrearOrden = this.byId('WizardCrearOrden');
			
			this._oPopoverConfirmarNotificacion = sap.ui.xmlfragment("es.cdl.yesui5pm003.view.fragment.PopoverConfirmarNotificacion", this);								
			this.getView().addDependent(this._oPopoverConfirmarNotificacion);	
			
			/* Instanciamos el BusyDialog de creación de notificación */
			this._oBusyDialogNotificacion = sap.ui.xmlfragment("es.cdl.yesui5pm003.view.fragment.BusyDialogNotificacion", this);
			this.getView().addDependent(this._oBusyDialogNotificacion);
			
	/*		var oRouter = this.getRouter();
			oRouter.getRoute('NotificacionUrgente').attachPatternMatched(this._onRouteMatched.bind(this));	
			oRouter.getRoute('NotificacionUrgenteOrden').attachPatternMatched(this._onRouteMatchedOrden.bind(this));*/	
			
		},

		filterArea: function(sWerks){
			var oBindingList = this.getView().byId("areaCombo").getBinding('items');
			var oFilter = new sap.ui.model.Filter({
				filters: [
					new sap.ui.model.Filter({
						path: "Werks",
						operator: "EQ",
						value1: sWerks
					})
				],
				and: false
			});
			
			oBindingList.filter(oFilter);

		},

		_getPersonal: function (sKey){
			this.getView().getModel().read("/PersonalSet", {
				success: function (oData){	
					this.getView().getModel("personalModel").setProperty("/", oData.results);
					for(var i in oData.results){
						if (oData.results[i].Pernr === this.sPernr){
							this.sWerks = oData.results[i].Werks;
							this._setWerks();
							this.getView().getModel("nuevaOrdenModel").setProperty("/Peticionario", oData.results[i].Pernr);
							this.getView().getModel("nuevaOrdenModel").setProperty("/PName", oData.results[i].Vorna+""+oData.results[i].Nachn);
						}
					}
					if (this.sWerks === "") this.onNavBack();
				}.bind(this),
				error: function (oError){
					this.getView().getModel("loginModel").setProperty("/Personal", [] );
				}.bind(this)
			});
		},

		
		_getResponsables: function (sKey){
			this.getView().getModel().read("/ResponsableSet", {
				success: function (oData){	
					this.getView().getModel("responsableModel").setProperty("/", oData.results);
				}.bind(this),
				error: function (oError){
					this.getView().getModel("responsableModel").setProperty("/", [] );
				}.bind(this)
			});
		},
		
		onSearchUsuario : function(oEvent){
			var sQuery = oEvent.getParameter('value');
			var oBindingList = oEvent.getSource().getBinding('items');
			var oFilter = new sap.ui.model.Filter({
				filters: [
					new sap.ui.model.Filter({
						path: "Pernr",
						operator: "Contains",
						value1: sQuery
					}),
					new sap.ui.model.Filter({
						path: "Vorna",
						operator: "Contains",
						value1: sQuery
					}),
					new sap.ui.model.Filter({
						path: "Nachn",
						operator: "Contains",
						value1: sQuery
					}),
				],
				and: false
			});
			
			oBindingList.filter(oFilter);
		},

		onSearchResponsable : function(oEvent){
			var sQuery = oEvent.getParameter('value');
			var oBindingList = oEvent.getSource().getBinding('items');
			var oFilter = new sap.ui.model.Filter({
				filters: [
					new sap.ui.model.Filter({
						path: "Pernr",
						operator: "Contains",
						value1: sQuery
					}),
					new sap.ui.model.Filter({
						path: "Sname",
						operator: "Contains",
						value1: sQuery
					}),
				],
				and: false
			});
			
			oBindingList.filter(oFilter);
		},

		checkNotifTemp : function() {
			
			var oView 		= this.getView();
			var oNuevaOrdenModel = oView.getModel('nuevaOrdenModel');
			var oViewModel 	= oView.getModel('viewModel');

			this._getNotificacionTemporal( 
				//Existe notificación pendiente 
				(oNotificacionTemporal) => {
					
					if(oNotificacionTemporal.Aufnr) return;
					
					if (oNotificacionTemporal.HoraFin && oNotificacionTemporal.HoraFin.ms !== 0){
						oViewModel.setProperty("/stepCompleteCabecera", true);
						oViewModel.setProperty("/ordenIniciada", false);
						this.oWizardCrearOrden.setCurrentStep(this.byId('wizardStepRepuestos'));
						this.oWizardCrearOrden.goToStep(this.byId('wizardStepRepuestos'));	
					}else{	
						oViewModel.setProperty("/ordenIniciada", true);
					}
					oNuevaOrdenModel.setProperty("/Tplnr", oNotificacionTemporal.Tplnr);
					
					if(oNotificacionTemporal.Tplnr){
						this._getUbicacionTecnica(oNotificacionTemporal.Tplnr, function(oUbicacionTecnica){
							if(oUbicacionTecnica.length !== 1){
								oViewModel.setProperty("/valueStateUT", "Error");
								oViewModel.setProperty("/valueStateTextUT", "");
								oNuevaOrdenModel.setProperty("/Pltxt", "");
							}else{
								oViewModel.setProperty("/valueStateUT", "None");
								oViewModel.setProperty("/valueStateTextUT", "");
								oNuevaOrdenModel.setProperty("/Pltxt", oUbicacionTecnica[0].Pltxt);
								oNuevaOrdenModel.setProperty("/CausaReq", oUbicacionTecnica[0].CausaReq);
								oNuevaOrdenModel.setProperty("/TipoReq", oUbicacionTecnica[0].TipoReq);
								this._getEquipos( oUbicacionTecnica[0].Tplnr);
								this._getCatalogos(oUbicacionTecnica[0].Tplnr, "");
							}
						}.bind(this));
					}else{
						this._getEquipos();
					}
					if (oNotificacionTemporal.Equnr){
						this._getCatalogos("", oNotificacionTemporal.Equnr);
					}
					oNuevaOrdenModel.setProperty("/Equnr", oNotificacionTemporal.Equnr);
					oNuevaOrdenModel.setProperty("/Descripcion", oNotificacionTemporal.Txt);
					oNuevaOrdenModel.setProperty("/FechaInicio", oNotificacionTemporal.FechaIni);
					oNuevaOrdenModel.setProperty("/HoraInicio", oNotificacionTemporal.HoraIni);
					oNuevaOrdenModel.setProperty("/FechaFin", oNotificacionTemporal.FechaFin);
					oNuevaOrdenModel.setProperty("/HoraFin", oNotificacionTemporal.HoraFin);
					oNuevaOrdenModel.setProperty("/Area", oNotificacionTemporal.Beber);
					oNuevaOrdenModel.setProperty("/Sintomas", oNotificacionTemporal.Sintomas);
					oNuevaOrdenModel.setProperty("/Destinatario", oNotificacionTemporal.Destinatario);
					oNuevaOrdenModel.setProperty("/Peticionario", oNotificacionTemporal.Peticionario);
					oNuevaOrdenModel.setProperty("/Parada", oNotificacionTemporal.Msaus);
					oNuevaOrdenModel.setProperty("/Causa", oNotificacionTemporal.CauseCode);
					oNuevaOrdenModel.setProperty("/CauseCodegrp", oNotificacionTemporal.CauseCodegrp);
					oNuevaOrdenModel.setProperty("/Tipologia", oNotificacionTemporal.Code);
					oNuevaOrdenModel.setProperty("/Codegrp", oNotificacionTemporal.Codegrp);
				}, ( Error ) => {
					this._getEquipos();
				}
			);
				
			
		},
		
		onHandleTrabajo : function(oEvent){
			
			var oModel = this.getModel();
			var oViewModel = this.getModel('viewModel');
			var oNuevaOrdenModel = this.getModel('nuevaOrdenModel');
			var bOrdenIniciada = oViewModel.getProperty("/ordenIniciada");
			var oTime = new Time();
			var oTimeFin = oTime.parseValue(new Date().toLocaleTimeString(), "string");
			var oFechaFin = this.formatUTC(new Date());
						
			if(bOrdenIniciada){
				
				oViewModel.setProperty("/cargandoWizard", true);
				oModel.callFunction("/CerrarNotificacionTemporal", {
					method: 'POST',
					urlParameters: {
							Pernr: this.sPernr,
							Aufnr: "",
							Vornr: "",
							FechaFin: oFechaFin,
							HoraFin: oTimeFin 
					},
					success: function(oData){
						oViewModel.setProperty("/stepCompleteCabecera", true);
						oViewModel.setProperty("/ordenIniciada", !bOrdenIniciada);
						oViewModel.setProperty("/cargandoWizard", false);

						oNuevaOrdenModel.setProperty("/FechaFin", new Date());
						oNuevaOrdenModel.setProperty("/HoraFin", oTime.parseValue(new Date().toLocaleTimeString(), "string"));
																	
						this.oWizardCrearOrden.setCurrentStep(this.byId('wizardStepRepuestos'));
						this.oWizardCrearOrden.goToStep(this.byId('wizardStepRepuestos'));												
					}.bind(this),
					error: function(oError){
						oViewModel.setProperty("/cargandoWizard", false);
						var sMessage = Formatter.parseError(oError.responseText)
						MessageBox.confirm(
							sMessage, {
					        icon: sap.m.MessageBox.Icon.ERROR,
					        actions: [sap.m.MessageBox.Action.OK],
					        title: "Error",
					        onClose: function(oAction) {}.bind(this)
						});						
						oViewModel.setProperty("/cargandoWizard", false);
					}.bind(this)
				});


			}else{
								
				/* Comprobamos campos obligatorios */
				var sPernr = this.sPernr;
				var sTplnr = oNuevaOrdenModel.getProperty("/Tplnr");
				var sEqunr = oNuevaOrdenModel.getProperty("/Equnr");
				var sIdCausa = sap.ui.core.Fragment.createId(this.getView().getId(), "idSelectCausas")
				var sIdTipo = sap.ui.core.Fragment.createId(this.getView().getId(), "idSelectTipo")
				var oTipo = sap.ui.getCore().byId(sIdTipo).getSelectedItem();
				var oCausa = sap.ui.getCore().byId(sIdCausa).getSelectedItem();
				var sCode = (oTipo !== null) ? oTipo.getBindingContext("catTipoModel").getObject().Code : "";
				var sCodeGrp = (oTipo !== null) ? oTipo.getBindingContext("catTipoModel").getObject().Codegrp : "";
				var sCodeCau = (oCausa !== null) ? oCausa.getBindingContext("catCausaModel").getObject().Code : "";
				var sCodeGrpCau = (oCausa !== null) ? oCausa.getBindingContext("catCausaModel").getObject().Codegrp : "";
				
				if((!sPernr || oViewModel.getProperty("/pernrValueState") === "Error") && !sPernr){
					MessageToast.show(this.getResourceBundle().getText('numPersonalObligatorio'), { width: '30em'});
					return;
				}

				if((!sTplnr || oViewModel.getProperty("/valueStateUT") === "Error") && !sEqunr){
					MessageToast.show(this.getResourceBundle().getText('ubicacionEquipoObligatoria'), { width: '30em'});
					return;
				}
				
				oViewModel.setProperty("/cargandoWizard", true);

				oModel.callFunction("/CrearNotificacionTemporal", {
					method: 'POST',
					urlParameters: {
						Vornr : "",
						Aufnr : "",
						Pernr: this.sPernr,
						Tplnr: oNuevaOrdenModel.getProperty("/Tplnr"),
						Equnr: oNuevaOrdenModel.getProperty("/Equnr"),
						Descripcion: oNuevaOrdenModel.getProperty("/Descripcion"),
						Beber 		: oNuevaOrdenModel.getProperty("/Area"), 
						Peticionario : oNuevaOrdenModel.getProperty("/Peticionario"), 
						Destinatario : oNuevaOrdenModel.getProperty("/Destinatario"), 
						Msaus : oNuevaOrdenModel.getProperty("/Parada"), 
						Sintomas : oNuevaOrdenModel.getProperty("/Sintomas"),
						CauseCode : sCodeCau,
						CauseCodegrp : sCodeGrpCau,
						Code : sCode,
						Codegrp : sCodeGrp
					}, 
					success: function(oData){
						oNuevaOrdenModel.setProperty("/FechaInicio", new Date());
						oNuevaOrdenModel.setProperty("/HoraInicio", oTime.parseValue(new Date().toLocaleTimeString(), "string"));
						oViewModel.setProperty("/ordenIniciada", !bOrdenIniciada);
						oViewModel.setProperty("/cargandoWizard", false);
					}, 
					error: function(oError){
						var sMessage = Formatter.parseError(oError.responseText)
						MessageBox.confirm(
							sMessage, {
					        icon: sap.m.MessageBox.Icon.ERROR,
					        actions: [sap.m.MessageBox.Action.OK],
					        title: "Error",
					        onClose: function(oAction) {}.bind(this)
						});						
						oViewModel.setProperty("/cargandoWizard", false);
					}
				});
			
			}
			
		},

		onSearchUbicacionTecnica : function(oEvent) {
			var sQuery = oEvent.getParameter('value');
			var oBinding = oEvent.getParameter('itemsBinding');
			
			oBinding.filter(
				new Filter({
					filters: [
						new Filter({ path: "Tplnr", operator: "Contains", value1: sQuery}),
						new Filter({ path: "Pltxt", operator: "Contains", value1: sQuery})			            
		            ],
					and: false
				})
			);
								
		},
		
				
		onChangeUbicacionTecnica : function(oEvent){
			var oViewModel = this.getModel('viewModel');
			var oNuevaOrdenModel = this.getModel('nuevaOrdenModel');
			var oEquiposModel = this.getModel('equiposModel');
			var sValue = oEvent.getParameter('value');
			
			oEquiposModel.setProperty("/", new Array());
			
			var oUbicacionTecnica = this._getUbicacionTecnica(sValue, function(oUbicacionTecnica){
				if(oUbicacionTecnica.length !== 1){
					oViewModel.setProperty("/valueStateUT", "Error");
					oViewModel.setProperty("/valueStateTextUT", "");
					oNuevaOrdenModel.setProperty("/Pltxt", "");
				}else{
					oViewModel.setProperty("/valueStateUT", "None");
					oViewModel.setProperty("/valueStateTextUT", "");
					oNuevaOrdenModel.setProperty("/Pltxt", oUbicacionTecnica[0].Pltxt);
					this._getEquipos( oUbicacionTecnica[0].Tplnr);
				}
			}.bind(this));
			
		},

		onChangeEquipo:function(){
			var oSelectedContext = oEvent.getParameter('selectedContexts')[0];
			this._getCatalogos("", oSelectedContext.getProperty('Equnr'));
			oNuevaOrdenModel.setProperty("/TipoReq", oSelectedContext.getProperty('TipoReq'));
			oNuevaOrdenModel.setProperty("/CausaReq", oSelectedContext.getProperty('CausaReq'));
		},
		
		onSelectUbicacionList : function(oEvent) {
			
			if(!this._oDialogoUbicacionesTecnicas){
				this._oDialogoUbicacionesTecnicas = sap.ui.xmlfragment("es.cdl.yesui5pm003.view.fragment.DialogoUbicacionesTecnicas", this); 
				this.getView().addDependent(this._oDialogoUbicacionesTecnicas);
			}
				
			this._oDialogoUbicacionesTecnicas.open();

		},
		
		onCancelarUbicacionTecnica : function(oEvent) {},
		
		onSelectUbicacionTecnicaPosicion : function(oEvent) {
			var oView = this.getView();
			var oUbicacioTecnicaModel = oView.getModel('ubicacionTecnicaModel');
			var oSelectedContext = oEvent.getParameter('selectedContexts')[0];
			var oViewModel = oView.getModel('viewModel');
			var oNuevaOrdenModel = this.getModel('nuevaOrdenModel');

			oViewModel.setProperty("/valueStateUT", "None");
			oNuevaOrdenModel.setProperty("/Tplnr", oSelectedContext.getProperty('Tplnr'));
			oNuevaOrdenModel.setProperty("/Pltxt", oSelectedContext.getProperty('Pltxt'));
			oNuevaOrdenModel.setProperty("/TipoReq", oSelectedContext.getProperty('TipoReq'));
			oNuevaOrdenModel.setProperty("/CausaReq", oSelectedContext.getProperty('CausaReq'));
			this._getEquipos(oSelectedContext.getProperty('Tplnr'));
			this._getCatalogos(oSelectedContext.getProperty('Tplnr'), "");
		},
				
		onPressRepuestos : function(oEvent){
			
			if(!this._oDialogoRepuesto){
				this._oDialogoRepuesto = sap.ui.xmlfragment("es.cdl.yesui5pm003.view.fragment.DialogoRepuesto", this); 
				this.getView().addDependent(this._oDialogoRepuesto);
			}
			
			var oModel = this.getModel('repuestosModel');
			oModel.setProperty("/selectedItem", {});
					
			this._oDialogoRepuesto.open();
		},
		
		onValueHelpRepuesto : function(oEvent){
			
			if(!this._oMatchCodeRepuestos){
				this._oMatchCodeRepuestos = sap.ui.xmlfragment("es.cdl.yesui5pm003.view.fragment.MatchCodeRepuestos", this); 
				this.getView().addDependent(this._oMatchCodeRepuestos);
			}
			
			var oViewModel = this.getModel('viewModel');
			var oNuevaOrdenModel = this.getModel('nuevaOrdenModel');
			
			oViewModel.setProperty("/selectedKeyRepuestos", "todos");

			this._getRepuestos();			
			
			this._oMatchCodeRepuestos.open();
		},
		
		onDeleteRepuesto : function(oEvent){
			
			var sItemPath = oEvent.getParameter('listItem').getBindingContextPath('repuestosModel');
			var oRepuestosModel = this.getModel('repuestosModel');
			var oRepuesto =  oRepuestosModel.getProperty(sItemPath);
			var aRepuestos = oRepuestosModel.getProperty("/repuestos");

			aRepuestos = aRepuestos.filter( (repuesto) => {
				return JSON.stringify(repuesto) !== JSON.stringify(oRepuesto);
			});

			oRepuestosModel.setProperty("/repuestos", aRepuestos);
		},
		
		onAceptarCrearRepuesto : function(oEvent){
			
			var oModel = this.getModel('repuestosModel');

			var sMatnr  = oModel.getProperty("/selectedItem/Matnr");
			
			if(!sMatnr || sMatnr === ""){
				MessageToast.show(this.getResourceBundle().getText('introduzcaMaterial'));
				return;
			}			
			
			var sMaktx    = oModel.getProperty("/selectedItem/Maktx");
			var sCantidad = oModel.getProperty("/selectedItem/Cantidad");
			var sUnidad   = oModel.getProperty("/selectedItem/Meins");
			var sLgort    = oModel.getProperty("/selectedItem/Lgort");
			var sWerks    = oModel.getProperty("/selectedItem/Werks");
			
			/* Creamos la línea del material seleccionado */

			var aRepuestos = oModel.getProperty("/repuestos");
			 
			for(var x = 0, len = aRepuestos.length, bExiste = false; x < len  && !bExiste ; x++){
				if(aRepuestos[x].Matnr === sMatnr){
					bExiste = true;
					aRepuestos[x].Cantidad = sCantidad;
				}
			}
			
			if(!bExiste){
				aRepuestos.push({
					Matnr: sMatnr,
					Maktx: sMaktx,
					Labst: sCantidad,
					Meins: sUnidad,
					Lgort: sLgort,
					Werks: sWerks
				});
			}
			
			
			oModel.setProperty("/repuestos", aRepuestos);
						
			this.onCancelarCrearRepuesto();
		},
		
		onCancelarCrearRepuesto : function(oEvent){
			
			var oModel = this.getModel('repuestosModel');
			
			/* Eliminamos el material seleccionado del modelo */
			oModel.setProperty("/selectedItem/Matnr", "");
			oModel.setProperty("/selectedItem/Maktx", "");
			oModel.setProperty("/selectedItem/Cantidad", "");
			oModel.setProperty("/selectedItem/Meins", "");
			
			this._oDialogoRepuesto.close();
		},
		
		onPressNotificar : function(oEvent){
			if(!this._oPopoverConfirmarNotificacion){
				this._oPopoverConfirmarNotificacion = sap.ui.xmlfragment("es.cdl.yesui5pm003.view.fragment.PopoverConfirmarNotificacion", this);								
				this.getView().addDependent(this._oPopoverConfirmarNotificacion);	
			}
			
			this._oPopoverConfirmarNotificacion.openBy(oEvent.getSource());	
		},
		
		onPressConfirmarNotificacion : function(oEvent){
						
			var oModel = this.getModel();
			var oViewModel = this.getModel('viewModel');
		 	var oRepuestosModel = this.getModel('repuestosModel');
		 	var oNuevaOrdenModel = this.getModel('nuevaOrdenModel');
			var oProcesoNotificacionModel = this.getModel('procesoNotificacionModel');

		 	var oNuevaOrden = oNuevaOrdenModel.getProperty("/");
		 	var oRepuestos = oRepuestosModel.getProperty("/repuestos");
			var oTipo, oCausa;
			var sIdCausa = sap.ui.core.Fragment.createId(this.getView().getId(), "idSelectCausas");
			var sIdTipo = sap.ui.core.Fragment.createId(this.getView().getId(), "idSelectTipo");
			var oCausaItem = sap.ui.getCore().byId(sIdCausa).getSelectedItem(); 
			if (oCausaItem !== null){
				oCausa = oCausaItem.getBindingContext("catCausaModel").getObject();
			}else{
				if(oNuevaOrden.CausaReq === true){
					MessageToast.show("Es necesario informar la causa.", {
						width: "30em"
					});
					return;	
			}
			}
			var oTipoItem = sap.ui.getCore().byId(sIdTipo).getSelectedItem();
			if (oTipoItem !== null){
				oTipo = oTipoItem.getBindingContext("catTipoModel").getObject();
			}else{
				if(oNuevaOrden.TipoReq === true){
					MessageToast.show("Es necesario informar la tipología.", {
						width: "30em"
					});
					return;	
				}
			}
			var oTime = new Time();
									
			if(oNuevaOrden.FechaInicio && oNuevaOrden.FechaFin && 
					oNuevaOrden.HoraInicio  && oNuevaOrden.HoraFin && (oNuevaOrden.Tplnr || oNuevaOrden.Equnr) ){
			
				var oFechaInicio = new Date(Date.UTC(oNuevaOrden.FechaInicio.getFullYear(),
											     oNuevaOrden.FechaInicio.getMonth(),
												 oNuevaOrden.FechaInicio.getDate()));
		
				var oFechaFin = new Date(Date.UTC(oNuevaOrden.FechaFin.getFullYear(),
											  oNuevaOrden.FechaFin.getMonth(),
											  oNuevaOrden.FechaFin.getDate()));

				oModel.createEntry("/NotificacionUrgenteSet", {
					properties: {
						Pernr 		: this.sPernr,
						Werks		: this.sWerks,
						FechaInicio	: oFechaInicio,
						HoraInicio 	: oNuevaOrden.HoraInicio,
						FechaFin 	: oFechaFin,
						HoraFin 	: oNuevaOrden.HoraFin,
						Equnr		: oNuevaOrden.Equnr,
						Tplnr		: oNuevaOrden.Tplnr,
						Ilart		: oNuevaOrden.Ilart,
						Ktext		: oNuevaOrden.Descripcion,
						Observacion	: oNuevaOrden.TxtCabecera,
						Beber 		: oNuevaOrden.Area,
						Peticionario : oNuevaOrden.Peticionario,
						Destinatario : oNuevaOrden.Destinatario,
						Msaus : oNuevaOrden.Parada,
						Sintomas : oNuevaOrden.Sintomas, 
						Completada : ( oNuevaOrden.Completada === true ) ? 'X' : '',
						CauseCode : (oCausa) ? oCausa.Code : "",
						CauseCodegrp : (oCausa) ? oCausa.Codegrp : "",
						Code : (oTipo) ? oTipo.Code : "",
						Codegrp : (oTipo) ? oTipo.Codegrp : ""

					},
					success: function(oData, oResponse){
						
						oProcesoNotificacionModel.setProperty("/busy", false);
						oProcesoNotificacionModel.setProperty("/info",""); 
						oProcesoNotificacionModel.setProperty("/description", "Notificación de tiempos creada correctamente");
						oProcesoNotificacionModel.setProperty("/icon","accept"); 
						oProcesoNotificacionModel.setProperty("/state", "Low");
						oProcesoNotificacionModel.setProperty("/errorOrden", false);
						this._notificarMateriales(oData.Aufnr);
						
					}.bind(this),
					error: function(oError) {
						var sMessage = Formatter.parseError(oError.responseText);
//						MessageBox.error(sMessage, { styleClass: "sapUiSizeCompact" });
						
						oProcesoNotificacionModel.setProperty("/busy", false);
						oProcesoNotificacionModel.setProperty("/info",""); 
						oProcesoNotificacionModel.setProperty("/description", sMessage);
						oProcesoNotificacionModel.setProperty("/icon","decline"); 
						oProcesoNotificacionModel.setProperty("/state", "High");
						oProcesoNotificacionModel.setProperty("/errorOrden", true);
						oProcesoNotificacionModel.setProperty("/mostrarRepuestos", false);	
						
					}.bind(this)
				});
				
				
				this._oPopoverConfirmarNotificacion.close();
				
				this._resetProcesoNotificacion();
				
				this._oBusyDialogNotificacion.open();

				oProcesoNotificacionModel.setProperty("/busy", true);
				oProcesoNotificacionModel.setProperty("/isCompleted", false);
				oProcesoNotificacionModel.setProperty("/mostrarOrden", true);
				oProcesoNotificacionModel.setProperty("/mostrarRepuestos", oRepuestos.length > 0);

				//oViewModel.setProperty("/busyNotificaciones", true);
				oViewModel.setProperty("/cargandoWizard", true);

				oModel.submitChanges({
					success: function(oData, oResponse){
						oViewModel.setProperty("/cargandoWizard", false);	
						oModel.resetChanges();
					}.bind(this),
					error : function(oError){
						
					}.bind(this)
				})
			
			}else{
				
				// Campos obligatorios
				if(!oNuevaOrden.Tplnr && !oNuevaOrden.Equnr){
					oViewModel.setProperty("/valueStateUT", "Error");
				}
				
				
				if(!oNuevaOrden.FechaFin || !oNuevaOrden.HoraFin || !oNuevaOrden.FechaInicio || !oNuevaOrden.HoraInicio){
					MessageToast.show(this.getResourceBundle().getText('fechaHoraObligatoria'), {
						width: "30em"
					});	
				}
				
			}
						
		},

		 onAfterCloseDialogoNotificacion: function(){
			this.getView().setBusy(false);
		 },
		
		 onCerrarDialogoProcesoNotificacion : function(oEvent){
		 	var oProcesoNotificacionModel = this.getModel('procesoNotificacionModel');
		 	var bErrorOrden = oProcesoNotificacionModel.getProperty("/errorOrden");
		 	this.getView().setBusy(false);
			this._oBusyDialogNotificacion.close();
			this._resetProcesoNotificacion();
			
			if(!bErrorOrden){
				this.onNavBack();
			}
			
		 },
	
		onSelectionChangeRepuestos : function(oEvent){
			var sKey = oEvent.getParameter('item').getKey();
			
			if(sKey === "repEquipo"){
				var oNuevaOrdenModel = this.getModel('nuevaOrdenModel');
				this._getRepuestos(oNuevaOrdenModel.getProperty("/Equnr"));	
			}else{
				this._getRepuestos();
			}
		},
		
		onSelectRepuesto : function(oEvent){
			var oRepuestosModel = this.getModel('repuestosModel');
			var oSelectedItem = oEvent.getParameter('listItem').getBindingContext('repuestosMatchCodeModel').getObject();
			oRepuestosModel.setProperty("/selectedItem", oSelectedItem);
			
			oEvent.getSource().removeSelections();
			this._oMatchCodeRepuestos.close();
		},
		
		onPressCancelarMathCodeRepuestos : function(oEvent){
			var oList = sap.ui.getCore().byId('listRepuestos');
			oList.removeSelections();
			this._oMatchCodeRepuestos.close();
		},
		
		onSalirAplicacion : function(){
			var oNuevaOrdenModel = this.getModel('nuevaOrdenModel');
			
			if(oNuevaOrdenModel.getProperty("/FechaFin")){
				MessageBox.warning(
						"La notificación no se ha confirmado y se perderan los datos.\n\n¿Desea descartar los cambios?",
						{
							actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
							styleClass: "sapUiSizeCompact",
							onClose: function(sAction) {
								if(sAction === MessageBox.Action.OK){
									this.onNavBack();
								}
							}.bind(this)
						}
					);
			}else{
				this.onNavBack();
			}

		},
		
		onSearchRepuesto : function(oEvent){
			var sValue = oEvent.getParameter('newValue');
			
			var aFilters = new Array();
			
			aFilters.push(new Filter({
				path: "Maktx",
				operator: "Contains",
				value1: sValue
			}));
			
			var oList = sap.ui.getCore().byId('listRepuestos');
			var oBinding = oList.getBinding('items');
			oBinding.filter(aFilters);
		},
		
		onChangeRepuesto : function(oEvent){
			var sValue = oEvent.getParameter('value');
			var oRepuestosModel = this.getModel('repuestosModel');
			var bExisteMatnr = false;
			var oRepuesto = undefined;
			
			oRepuestosModel.setProperty("/selectedItem/MatnrState", "None");
			
			this._getRepuestos(undefined, () => {
				
				var oRepuestosMatchCodeModel = this.getModel('repuestosMatchCodeModel');
				var oRepuestos = oRepuestosMatchCodeModel.getProperty("/");
				
				for (var i = 0; i < oRepuestos.length && !bExisteMatnr; i++) {
					if(oRepuestos[i].Matnr === sValue){
						bExisteMatnr = true;
						oRepuesto = oRepuestos[i];
						break;
					}
				}
				
				if(bExisteMatnr){
					oRepuestosModel.setProperty("/selectedItem", oRepuesto);
					oRepuestosModel.setProperty("/selectedItem/MatnrState", "None");
				}else{
					oRepuestosModel.setProperty("/selectedItem", { Matnr: sValue });
					oRepuestosModel.setProperty("/selectedItem/MatnrState", "Error");
				}
				
			});
			
		},
		
		_setWerks : function(){
			this.filterArea(this.sWerks);
			this._getUbicacionesTecnicas();	
			this._getEquipos();

		},
		
		onConfirmRepuesto : function(oEvent){},
		
		_onRouteMatchedBase : function(oArguments){
			
			//this.sPernr  = oArguments.Pernr;
			
			var oView = this.getView();

			var oViewModel = this.getModel('viewModel');
			var oLoginModel = this.getModel('loginModel');
			var oNuevaOrdenModel = this.getModel('nuevaOrdenModel');
			var oProcesoNotificacionModel = this.getModel('procesoNotificacionModel');
			var oCData = this.getOwnerComponent().getComponentData();
			
 			if (oCData){

				if (oCData.startupParameters.Pernr !== undefined){
					if(oCData.startupParameters.Pernr[0] !== ""){
						this.sPernr = oCData.startupParameters.Pernr[0];
						this._getPersonal();
						this._getResponsables();
						this.checkNotifTemp();
					}else{
						this.onNavBack();	
					}
				}
			}else{
				this.onNavBack();
			} 

			oViewModel.setProperty("/", {
				ordenIniciada: false,
				stepCompleteCabecera: false,
				creandoNotificacion: false,
				selectedKeyRepuestos: 'repEquipo'
			});			
			
			oProcesoNotificacionModel.setProperty("/", {
				busy: false,
				info: "Creando notificación...",
				icon: "upload-to-cloud",
				iconMateriales: "lateness",
				infoMateriales: "Pendiente notificación de repuestos.",
				isCompleted: false,
				mostrarRepuestos: false,
				mostrarOrden: false
			});
						
		},
		
		onAfterRendering : function(oEvent){
			
			var oViewModel = this.getModel('viewModel');
			//var oArguments = oEvent.getParameter('arguments');
			
			this._onRouteMatchedBase();		
			
			var oNuevaOrdenModel = this.getModel('nuevaOrdenModel');
			 
			
		},
		
		_onRouteMatchedOrden : function(oEvent){
			
			var oViewModel = this.getModel('viewModel');
			var oArguments = oEvent.getParameter('arguments');
			
			this._onRouteMatchedBase();
			
		},
			
		_getUbicacionTecnica : function(sTplnr, fnCallback){
			
			var oView = this.getView();
			var oModelView = oView.getModel('viewModel');
			var oNuevaOrdenModel = this.getModel('nuevaOrdenModel');			

			var sCentro = this.sWerks;
			var aFilters = new Array();
			
			aFilters.push(new Filter({
				path: "Werks",
				operator: "EQ",
				value1: sCentro
			}));
		
			aFilters.push(new Filter({
				path: "Tplnr",
				operator: "EQ",
				value1: sTplnr
			}));
			
			oModelView.setProperty("/isCargandoUbicacion", true);

			oView.getModel().read("/UbicacionesSet", {
				filters: aFilters,
				success: function(oData){
					oModelView.setProperty("/isCargandoUbicacion", false);
					fnCallback(oData.results);
				},
				error: function(oError){
					oModelView.setProperty("/isCargandoUbicacion", false);
					fnCallback();
				}
			})
		},
		
		_getUbicacionesTecnicas : function(){
			
			var oUbicacionTecnicaModel = this.getModel('ubicacionTecnicaModel');
			var oNuevaOrdenModel = this.getModel('nuevaOrdenModel');			

			var oViewModel = this.getModel('viewModel');
			var sCentro = this.sWerks;

			oViewModel.setProperty("/isCargandoUbicacionesList", true);
			oUbicacionTecnicaModel.setProperty("/", new Array());			
			var aFilters = new Array();
			
			aFilters.push(new Filter({
				path: "Werks",
				operator: "EQ",
				value1: sCentro
			}));

			this.getModel().read("/UbicacionesSet", {
				filters: aFilters,
				success: function(oData){
					oUbicacionTecnicaModel.setProperty("/", oData.results);
					oViewModel.setProperty("/isCargandoUbicacionesList", false);
				},
				error: function(oError){
					oViewModel.setProperty("/isCargandoUbicacionesList", false);
				}
			})
			
		},
		
		_getEquipos : function(sTplnr){
			
			var oModel = this.getModel();
			var oEquiposModel = this.getModel('equiposModel');
			var aFilters = [];
			
			oEquiposModel.setProperty("/", []);
			
			if(this.sWerks){
				aFilters.push(new Filter({
					path: 'Werks',
					operator: 'EQ',
					value1: this.sWerks
				}));
			}
			
			if(sTplnr){
				aFilters.push(new Filter({
					path: 'Tplnr',
					operator: 'EQ',
					value1: sTplnr
				}));
			}
			
			oModel.read("/EquiposSet",{
				filters: aFilters,
				success: function(oData){
					oEquiposModel.setProperty("/", oData.results);	
					var sEqunr = this.getView().getModel('nuevaOrdenModel').getProperty("/Equnr");
					if (sEqunr !== "" && sEqunr !== undefined){
						for (var i in oData.results){
							if (oData.results[i].Equnr === sEqunr){
								oNuevaOrdenModel.setProperty("/TipoReq", oData.results[i].TipoReq);
								oNuevaOrdenModel.setProperty("/CausaReq", oData.results[i].CausaReq);
								break;
							}
						}
					}				
				}.bind(this)
			});
		},
				
		_getRepuestos : function(sEqunr, fnSuccess){
			
			var oModel = this.getModel();
			var oRepuestosMatchCodeModel = this.getModel('repuestosMatchCodeModel');
			var oNuevaOrdenModel = this.getModel('nuevaOrdenModel');
			var oViewModel = this.getModel('viewModel');
			
			var sCentro = this.sWerks;
			
			oRepuestosMatchCodeModel.setProperty("/", []);
			var aFilters = [];
			
			aFilters.push(new Filter({
						path: 'Werks',
						operator: 'EQ',
						value1: sCentro
					}));
			
			if(sEqunr){
				aFilters.push(new Filter({
					path: 'Equnr',
					operator: 'EQ',
					value1: sEqunr
				}));
			}
			
			oViewModel.setProperty("/cargandoRepuestos", true);
			
			oModel.read("/RepuestosSet",{
				filters: aFilters,
				success: function(oData){
					oRepuestosMatchCodeModel.setProperty("/", oData.results);
					oViewModel.setProperty("/cargandoRepuestos", false);
					if(fnSuccess) fnSuccess();
				}
			});
		},

		_getCatalogos : function(sTplnr, sEqunr){
			
			var oModel = this.getModel();
			var oCausasModel = this.getModel('catCausaModel');
			var oTipoModel = this.getModel('catTipoModel');
			var aFilterTipo = [];
			var aFilterCausa = [];
			
			oCausasModel.setProperty("/", []);
			oTipoModel.setProperty("/", []);
			
			if(sTplnr !== "" && sTplnr !== undefined){
				aFilterTipo.push(new Filter({
					path: 'Tplnr',
					operator: 'EQ',
					value1: sTplnr
				}));

				aFilterCausa.push(new Filter({
					path: 'Tplnr',
					operator: 'EQ',
					value1: sTplnr
				}));
			}
			
			if(sEqunr !== "" && sEqunr !== undefined){
				aFilterTipo.push(new Filter({
					path: 'Equnr',
					operator: 'EQ',
					value1: sEqunr
				}));

				aFilterCausa.push(new Filter({
					path: 'Equnr',
					operator: 'EQ',
					value1: sEqunr
				}));
			}

			aFilterTipo.push(new Filter({
				path: 'Qkatart',
				operator: 'EQ',
				value1: 'D'
			}));

			aFilterCausa.push(new Filter({
				path: 'Qkatart',
				operator: 'EQ',
				value1: '5'
			}));
			oModel.read("/CatalogosSet",{
				filters: aFilterTipo,
				success: function(oData){
					oTipoModel.setProperty("/", oData.results);					
				}
			});

			oModel.read("/CatalogosSet",{
				filters: aFilterCausa,
				success: function(oData){
					oCausasModel.setProperty("/", oData.results);					
				}
			});
		},
		
		_getNotificacionTemporal : function(fnSuccess, fnError){
			
			var oViewModel = this.getModel('viewModel');
			
			oViewModel.setProperty("/cargandoWizard", true);
			
			this.getModel().read("/NotificacionTemporalSet", {
				filters: [
					new Filter({
						path: 'Pernr',
						operator: 'EQ',
						value1: this.sPernr
				})],
				success: function(oData){
					oViewModel.setProperty("/cargandoWizard", false);
						fnSuccess(oData.results[0]);
				}.bind(this),
				error: function(oError){
					oViewModel.setProperty("/cargandoWizard", false);
					fnError();
				}
			})
		},
		
		_resetProcesoNotificacion: function(){
			var oProcesoNotificacionModel = this.getModel('procesoNotificacionModel');
			
			oProcesoNotificacionModel.setData({
				busy: false,
				info: "Creando notificación...",
				icon: "upload-to-cloud",
				iconMateriales: "lateness",
				infoMateriales: "Pendiente notificación de repuestos.",
				isCompleted: false,
				mostrarRepuestos: false,
				mostrarOrden: false,
				errorOrden: false
			});

		 },

		 onConfirmSeleccionUsuario : function(oEvent) {

			var oSelectedItem = oEvent.getParameter('selectedItem');
			var oUsuario = oSelectedItem.getBindingContext("personalModel").getObject();
			var sPath = this._vhPersonal;
			this.getView().getModel("nuevaOrdenModel").setProperty("/"+sPath, oUsuario.Pernr);
			this.getView().getModel("nuevaOrdenModel").setProperty("/"+sPath.substring(0, 1)+"Name", oUsuario.Vorna+" "+oUsuario.Nachn);

		},

		onConfirmSeleccionResponsable : function(oEvent) {

			var oSelectedItem = oEvent.getParameter('selectedItem');
			var oUsuario = oSelectedItem.getBindingContext("responsableModel").getObject();
			var sPath = oSelectedItem.getBindingContext("responsableModel").get
			this.getView().getModel("nuevaOrdenModel").setProperty("/Destinatario", oUsuario.Pernr);
			this.getView().getModel("nuevaOrdenModel").setProperty("/DName", oUsuario.Sname);

		},

		onSeleccionUsuario : function(oEvent) {
			
			if (!this._oMatchCodeUsuarios) {
				this._oMatchCodeUsuarios = sap.ui.xmlfragment("es.cdl.yesui5pm003.view.fragment.personalVH", this);
				this.getView().addDependent(this._oMatchCodeUsuarios);
			}

			this._vhPersonal = oEvent.getSource().getName();
	
			this._oMatchCodeUsuarios.open();
		},

		
		onSeleccionResponsable : function(oEvent) {
			
			if (!this._oMatchCodeResponsable) {
				this._oMatchCodeResponsable = sap.ui.xmlfragment("es.cdl.yesui5pm003.view.fragment.responsableVH", this);
				this.getView().addDependent(this._oMatchCodeResponsable);
			}
	
			this._oMatchCodeResponsable.open();
		},
		
		_notificarMateriales : function(sAufnr){

			var oModel 					  = this.getModel();
			var oViewModel 				  = this.getModel('viewModel');
		 	var oRepuestosModel  	  	  = this.getModel('repuestosModel');
		 	var oProcesoNotificacionModel = this.getModel('procesoNotificacionModel');
		 	var oRepuestos	 			  = oRepuestosModel.getProperty("/repuestos");
		 	if(oRepuestos.length === 0){
				oProcesoNotificacionModel.setProperty("/isCompleted", true);
		 		return;
		 	}
		 	

		 	for (var i = oRepuestos.length - 1; i >= 0; i--) {
		 		var oRepuesto = oRepuestos[i];
		 		oModel.createEntry("/NotificarRepuestosSet",{
					properties: {
						Aufnr: sAufnr,
						Werks: oRepuesto.Werks,
						Matnr: oRepuesto.Matnr,	
						Lgfsb: oRepuesto.Lgort, 	
						Erfme: oRepuesto.Meins, 	
						Lgpbe: "", 					 
						Menge: oRepuesto.Labst,  
					}
				});
		 	}		 	

		 	oProcesoNotificacionModel.setProperty("/iconMateriales","upload-to-cloud"); 
		 	oProcesoNotificacionModel.setProperty("/busyMateriales", true);
		 	
			this._oBusyDialogNotificacion.open();
		 			 	
		 	/* Enviamos los datos a SAP */
			oModel.submitChanges({
				success: function(oData){			
										
					oModel.resetChanges();
					
					var oResponse = oData.__batchResponses[0].response;

					if(oResponse && (oResponse.statusCode === "400" || oResponse.statusCode === "500")){
						
						oProcesoNotificacionModel.setProperty("/busyMateriales", false);
						oProcesoNotificacionModel.setProperty("/isCompletedMateriales", true); 
						oProcesoNotificacionModel.setProperty("/infoMateriales",""); 
						var sMessage = Formatter.parseError(oResponse.body);
						oProcesoNotificacionModel.setProperty("/descriptionMateriales", sMessage);
						oProcesoNotificacionModel.setProperty("/iconMateriales","decline"); 
						oProcesoNotificacionModel.setProperty("/stateMateriales", "High");
						oProcesoNotificacionModel.setProperty("/errorOrden", true);
						
					}else{
						// var oDataResponse = oData.__batchResponses[0].__changeResponses[0].data;
						oProcesoNotificacionModel.setProperty("/busyMateriales", false);
						oProcesoNotificacionModel.setProperty("/isCompletedMateriales", true); 
						oProcesoNotificacionModel.setProperty("/infoMateriales",""); 
						oProcesoNotificacionModel.setProperty("/descriptionMateriales", "Repuestos consumidos correctamente");
						oProcesoNotificacionModel.setProperty("/iconMateriales","accept"); 
						oProcesoNotificacionModel.setProperty("/stateMateriales", "Low");
						oProcesoNotificacionModel.setProperty("/errorOrden", false);
						oProcesoNotificacionModel.setProperty("/isCompleted", true);
						 
					}
					
				}.bind(this),
				error: function(){
					this.getView().setBusy(false);
					MessageBox.confirm(
						"The error occurred on the application server, you will find more information in transaction ST22", {
				        icon: sap.m.MessageBox.Icon.ERROR,
				        actions: [sap.m.MessageBox.Action.OK],
				        title: "Error",
				        onClose: function(oAction) {}.bind(this)
					});
				}.bind(this)
			});
		 },
		
		
		
	});
	
});