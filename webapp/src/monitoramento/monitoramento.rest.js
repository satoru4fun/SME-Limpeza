(function () {
	
	'use strict';
	
	angular
	.module('app.monitoramento')
	.factory('MonitoramentoRest', dataservice);
	
	dataservice.$inject = ['$http', 'RestUtils','ConfigRest'];
	
	function dataservice($http, RestUtils, ConfigRest) {
		
		let service = new RestUtils(ConfigRest.monitoramento);

		return service;

	}
	
})();