(function () {
	'use strict';
	
	angular
	.module('componentes.endereco')
	.factory('EnderecoRest', dataservice);
	
	dataservice.$inject = ['$http', 'RestUtils','ConfigRest'];
	
	function dataservice($http, RestUtils, ConfigRest) {
		
		var service = new RestUtils(ConfigRest.endereco);
		
		service.buscarEnderecoPorCep = buscarEnderecoPorCep;
		service.buscarCoordenadas = buscarCoordenadas;

		return service;

		function buscarEnderecoPorCep(cep) {
			return $http.get(service.url + '/cep/' + cep);
			//return $http.get('https://viacep.com.br/ws/' + encodeURI(cep) + '/json/');
		}

		function buscarCoordenadas(data) {
			return $http.get(service.url + '/coordenadas/' + encodeURI(data));
			//return $http.get('https://nominatim.openstreetmap.org/?q=' + encodeURI(data) + '&addressdetails=1&format=json&limit=1');
		}

	}
	
})();