(() => {

	'use strict';
	
	angular
	.module('relatorio.relatorio-contrato')
	.factory('RelatorioContratoRest', dataservice);
	
	dataservice.$inject = ['$http', 'RestUtils', 'ConfigRest'];
	
	function dataservice($http, RestUtils, ConfigRest) {
		
		const service = new RestUtils(ConfigRest.relatorioContrato);
		service.buscar = buscar;
		return service;

		function buscar(anoReferencia, mesReferencia, idContrato) {
			return $http.get(`${service.url}/${anoReferencia}/${mesReferencia}/${idContrato}`);
		}

	}
	
})();