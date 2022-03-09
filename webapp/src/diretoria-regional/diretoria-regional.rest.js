(function () {
	'use strict';
	
	angular
	.module('app.diretoria-regional')
	.factory('DiretoriaRegionalRest', dataservice);
	
	dataservice.$inject = ['$http', 'RestUtils','ConfigRest'];
	
	function dataservice($http, RestUtils, ConfigRest) {
		
		var service = new RestUtils(ConfigRest.diretoriaRegional);
		
		return service;

	}
	
})();