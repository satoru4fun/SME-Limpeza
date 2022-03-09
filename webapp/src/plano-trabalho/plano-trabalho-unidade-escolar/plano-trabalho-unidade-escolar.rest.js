(function () {
	'use strict';
	
	angular
	.module('plano-trabalho.plano-trabalho-unidade-escolar')
	.factory('PlanoTrabalhoUnidadeEscolarRest', dataservice);
	
	dataservice.$inject = ['$http', 'RestUtils','ConfigRest'];
	
	function dataservice($http, RestUtils, ConfigRest) {
		
		var service = new RestUtils(ConfigRest.planoTrabalhoUnidadeEscolar);

		return service;

	}
	
})();