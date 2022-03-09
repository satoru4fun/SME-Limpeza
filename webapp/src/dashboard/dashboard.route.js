(function () {

	'use strict';

	angular
		.module('app')
		.config(routes);

	routes.$inject = ['$routeProvider', '$locationProvider'];

	function routes($routeProvider, $locationProvider) {

        $routeProvider
            .when('/dashboard', {
                templateUrl: 'src/dashboard/dashboard.html',
                controller: 'Dashboard',
                controllerAs: 'vm',
                reloadOnSearch: false
            });
    }

})();