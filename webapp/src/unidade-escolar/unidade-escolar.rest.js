(function () {
	'use strict';
	
	angular
	.module('app.unidade-escolar')
	.factory('UnidadeEscolarRest', dataservice);
	
	dataservice.$inject = ['$http', 'RestUtils','ConfigRest'];
	
	function dataservice($http, RestUtils, ConfigRest) {
		
		var service = new RestUtils(ConfigRest.unidadeEscolar);
		
		service.carregarComboTipoEscola = carregarComboTipoEscola;

		return service;

		function carregarComboTipoEscola() {
			return $http.get(service.url + '/combo-tipo-escola');
		}

	}
	
})();