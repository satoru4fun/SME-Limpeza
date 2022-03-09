(function () {
	'use strict';
	
	angular
	.module('ocorrencia.ocorrencia-variavel')
	.factory('OcorrenciaVariavelRest', dataservice);
	
	dataservice.$inject = ['$http', 'RestUtils','ConfigRest'];
	
	function dataservice($http, RestUtils, ConfigRest) {
		
		var service = new RestUtils(ConfigRest.ocorrenciaVariavel);
		service.carregarComboCadastro = carregarComboCadastro;
		return service;

		function carregarComboCadastro(flagApenasMonitoramento) {
			return $http.get(service.url + '/combo-cadastro/' + flagApenasMonitoramento);
		}

	}
	
})();