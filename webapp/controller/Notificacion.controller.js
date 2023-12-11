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

		CLASE_ORDEN: "YMC",
		
		onInit : function() {
			
			var oViewModel = new JSONModel();
									
			var oRepuestosModel = new JSONModel({
				repuestos: new Array(),
				selectedItem: {}
			});
			
			var oEquiposModel = new JSONModel();
			var oNuevaOrdenModel = new JSONModel({
				Tplnr  : "0285-112-P08-FAGOR-5",
				Descripcion : "test descripcion. ",
				Werks : "2885",
				Equnr : "10000156"
			});
			var oMotivosModel = new JSONModel();
			var oPersonalModel = new JSONModel();
			var oUbicacionTecnicaModel = new JSONModel();
			var oRepuestosMatchCodeModel = new JSONModel();
			var oProcesoNotificacionModel = new JSONModel();		
			
			this.setModel(oViewModel, 		 				'viewModel');	
			this.setModel(oEquiposModel, 					'equiposModel');
			this.setModel(oPersonalModel, 					'personalModel');
			this.setModel(oMotivosModel, 					'motivosModel');
			this.setModel(oRepuestosModel, 					'repuestosModel');
			this.setModel(oNuevaOrdenModel, 				'nuevaOrdenModel');
			this.setModel(oUbicacionTecnicaModel, 			'ubicacionTecnicaModel');
			this.setModel(oRepuestosMatchCodeModel, 		'repuestosMatchCodeModel');
			this.setModel(oProcesoNotificacionModel, 		'procesoNotificacionModel');

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

		checkNotifTemp : function() {
			
			var oView 		= this.getView();
			var oNuevaOrdenModel = oView.getModel('nuevaOrdenModel');
			var oViewModel 	= oView.getModel('viewModel');

			this._getNotificacionTemporal( 
				//Existe notificación pendiente 
				(oNotificacionTemporal) => {
					
					if(oNotificacionTemporal.Aufnr) return;
					
					oViewModel.setProperty("/ordenIniciada", true);
					
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
								this._getEquipos(undefined, oUbicacionTecnica[0].Tplnr);
							}
						}.bind(this));
					}else{
						this._getEquipos(oNotificacionTemporal.Werks);
					}
					
					oNuevaOrdenModel.setProperty("/Equnr", oNotificacionTemporal.Equnr);
					oNuevaOrdenModel.setProperty("/Descripcion", oNotificacionTemporal.Txt);
					oNuevaOrdenModel.setProperty("/FechaInicio", oNotificacionTemporal.FechaIni);
					oNuevaOrdenModel.setProperty("/HoraInicio", oNotificacionTemporal.HoraIni);
					
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
					}.bind(this)
				});


			}else{
								
				/* Comprobamos campos obligatorios */
				var sPernr = this.sPernr;
				var sTplnr = oNuevaOrdenModel.getProperty("/Tplnr");
				var sEqunr = oNuevaOrdenModel.getProperty("/Equnr");
				
				
				
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
						Descripcion: oNuevaOrdenModel.getProperty("/Descripcion")
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
					this._getEquipos(oNuevaOrdenModel.getProperty("/Werks"), oUbicacionTecnica[0].Tplnr);
				}
			}.bind(this));
			
		},
		
		onSelectUbicacionList : function(oEvent) {
			
			if(!this._oDialogoUbicacionesTecnicas){
				this._oDialogoUbicacionesTecnicas = sap.ui.xmlfragment("es.cdl.yesui5pm003.view.fragment.DialogoUbicacionesTecnicas", this); 
				this.getView().addDependent(this._oDialogoUbicacionesTecnicas);
			}
			this._getUbicacionesTecnicas();		
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
			this._getEquipos(oNuevaOrdenModel.getProperty("/Werks"), oSelectedContext.getProperty('Tplnr'));
			
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
						Werks		: oNuevaOrden.Werks,
						FechaInicio	: oFechaInicio,
						HoraInicio 	: oNuevaOrden.HoraInicio,
						FechaFin 	: oFechaFin,
						HoraFin 	: oNuevaOrden.HoraFin,
						Equnr		: oNuevaOrden.Equnr,
						Tplnr		: oNuevaOrden.Tplnr,
						Ilart		: oNuevaOrden.Ilart,
						Ktext		: oNuevaOrden.Descripcion,
						Observacion	: oNuevaOrden.TxtCabecera
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
		
		 onCerrarDialogoProcesoNotificacion : function(oEvent){
		 	var oProcesoNotificacionModel = this.getModel('procesoNotificacionModel');
		 	var bErrorOrden = oProcesoNotificacionModel.getProperty("/errorOrden");
		 	
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
		
		onChangeCentro : function(oEvent){
			this._getMotivos();	
			this._getEquipos(oEvent.getParameter('selectedItem').getKey())
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
						this.checkNotifTemp();
					}else{
						this.onNavBack();	
					}
				}
			}
			//TEMP 
			
			this.sPernr = '28';
			this.checkNotifTemp();
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

			var sCentro = oNuevaOrdenModel.getProperty("/Werks");
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
			var sCentro = oNuevaOrdenModel.getProperty("/Werks");

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
		
		_getEquipos : function(sWerks, sTplnr){
			
			var oModel = this.getModel();
			var oEquiposModel = this.getModel('equiposModel');
			var aFilters = [];
			
			oEquiposModel.setProperty("/", []);
			
			if(sWerks){
				aFilters.push(new Filter({
					path: 'Werks',
					operator: 'EQ',
					value1: sWerks
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
				}
			});
		},
				
		_getRepuestos : function(sEqunr, fnSuccess){
			
			var oModel = this.getModel();
			var oRepuestosMatchCodeModel = this.getModel('repuestosMatchCodeModel');
			var oNuevaOrdenModel = this.getModel('nuevaOrdenModel');
			var oViewModel = this.getModel('viewModel');
			
			var sCentro = oNuevaOrdenModel.getProperty("/Werks");
			
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
		
		_getMotivos : function(){
			
			var oModel = this.getModel();
			var oMotivosModel = this.getModel('motivosModel');
			var oNuevaOrdenModel = this.getModel('nuevaOrdenModel');

			var sCentro = oNuevaOrdenModel.getProperty("/Werks");
			
			oMotivosModel.setProperty("/", []);
			
			oModel.read("/MotivosSet",{
				filters: [new Filter({
					path: 'Werks',
					operator: 'EQ',
					value1: sCentro
				})],
				success: function(oData){
					oMotivosModel.setProperty("/", oData.results);
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