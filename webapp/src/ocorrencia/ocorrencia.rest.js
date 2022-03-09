(function () {
	
	'use strict';
	
	angular
	.module('app.ocorrencia')
	.factory('OcorrenciaRest', dataservice);
	
	dataservice.$inject = ['$http', 'RestUtils','ConfigRest'];
	
	function dataservice($http, RestUtils, ConfigRest) {
		
		let service = new RestUtils(ConfigRest.ocorrencia);

		service.encerrar = encerrar;
		service.buscarPrestadoresComReincidencia = buscarPrestadoresComReincidencia;

		return service;

		function encerrar(id, model) {
			return $http.patch(service.url + '/encerrar/' + id, model);
		}

		function buscarPrestadoresComReincidencia() {
			return $http.get(service.url + '/reincidencia-por-prestador/');
		}

	}
	
})();