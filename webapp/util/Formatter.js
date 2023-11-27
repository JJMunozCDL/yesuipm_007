sap.ui.define([
	"sap/ui/model/odata/type/Time",
	], function (Time) {
		"use strict";
		return {
			
			getPriority : function(oOperacion) {
				if(!oOperacion) return;
				return oOperacion.FechaInicio && oOperacion.FechaFin && 
					   oOperacion.HoraInicio  && 
					   oOperacion.HoraFin /*&& oOperacion.Observacion !== '' */ ? 'Low' : 'Medium';
			},
			
			getBatchResponse : function(oData) {
				return oData.__batchResponses[0].__changeResponses;
			},
			
			getTextoOperacion : function(oFechaInicio, oFechaFin, oHoraInicio, oHoraFin){
				if(oFechaInicio && oFechaFin && oHoraInicio && oHoraFin){
					var sMessage = "";
					if(oFechaInicio && oFechaFin && 
					   oHoraInicio  && oHoraFin){
						
						if(oFechaInicio.getDate() === oFechaFin.getDate() &&
						   oFechaInicio.getMonth() === oFechaFin.getMonth() &&
						   oFechaInicio.getFullYear() === oFechaFin.getFullYear()){
							sMessage = "Fecha: " + moment(oFechaInicio).format('ll');
						}else{
							sMessage = "Fecha: " + moment(oFechaInicio).format('ll') + " / " + moment(oFechaFin).format('ll');
						}
						var oTime = new Time();
						sMessage += " | Hora inicio: " + oTime.formatValue(oHoraInicio, "string") + " - Hora fin: " + oTime.formatValue(oHoraFin, "string");
						return sMessage;
					}
				}

			},
			
			
			getTareaIniciada : function(oFechaInicio, oFechaFin, oHoraInicio, oHoraFin){
				if(oFechaInicio && oFechaFin && oHoraInicio && oHoraFin){
					return oFechaInicio && oHoraInicio && !oHoraFin;
				}
				return false;
			},
			
			parseErrorNotificacion : function(oResponse) {
				var oHeaders = JSON.parse(oResponse.headers['sap-message'])

			},
			
			parseError: function(oError){
				var sAllMessages = "";
				
				try {
					// try to cast oLogEntry message as a JSON Object
					var oJSONMessage = JSON.parse(oError);
				    var sMessage = oJSONMessage.error.message.value;
				}catch(oException){}
				
				if(sMessage === undefined){
					return;
				}
				
				var aErrorDetails = oJSONMessage.error.innererror.errordetails;
				var aFilteredErrors = new Array();
				
				for(var x = 0, len = aErrorDetails.length; x < len; x++){
					for(var y = 0, lenY = aFilteredErrors.length, bDuplicado = false; y < lenY && !bDuplicado; y++){
						if(aErrorDetails[x].message === aFilteredErrors[y].message)
							bDuplicado = true;
					}
					if(!bDuplicado) aFilteredErrors.push(aErrorDetails[x]);
				}
				
				for(var x = 0, len = aFilteredErrors.length; x < len; x++){
					
					if(aFilteredErrors[x].message !== "")
						var sSeparator = sAllMessages !== "" ? "\n" : "";
						sAllMessages =  sAllMessages + sSeparator + aFilteredErrors[x].message;
				}
				
				return sAllMessages;
			},			
		
			
		}
});
