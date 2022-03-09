(() => {

	'use strict';
	
	angular
	.module('relatorio.relatorio-gerencial')
	.factory('RelatorioGerencialRest', dataservice);
	
	dataservice.$inject = ['$http', 'RestUtils', 'ConfigRest'];
	
	function dataservice($http, RestUtils, ConfigRest) {
		
		const service = new RestUtils(ConfigRest.relatorioGerencial);

		service.avaliar = avaliar;
		service.consolidar = consolidar;
		service.aprovar = aprovar;

		return service;

		function avaliar(idRelatorioGerencial, data) {
			return $http.post(service.url + '/avaliar/' + idRelatorioGerencial, data);
		}

		function consolidar(idRelatorioGerencial) {
			return $http.post(service.url + '/consolidar/' + idRelatorioGerencial);
		}

		function aprovar(idRelatorioGerencial) {
			return $http.post(service.url + '/aprovar/' + idRelatorioGerencial);
		}

	}
	
})();