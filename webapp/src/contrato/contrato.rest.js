(() => {

	'use strict';
	
	angular
	.module('app.contrato')
	.factory('ContratoRest', dataservice);
	
	dataservice.$inject = ['$http', 'RestUtils','ConfigRest'];
	
	function dataservice($http, RestUtils, ConfigRest) {
		
		let service = new RestUtils(ConfigRest.contrato);

		service.buscarVencimentoProximo = buscarVencimentoProximo;

		return service;

		function buscarVencimentoProximo(quantidadeDias) {
			return $http.get(service.url + '/vencimento-proximo/' + quantidadeDias);
		}

	}
	
})();