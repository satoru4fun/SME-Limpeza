(function () {

    'use strict';

    angular
        .module('app.dashboard')
        .controller('Dashboard', Dashboard);

    Dashboard.$inject = ['controller', '$rootScope', '$scope', 'ContratoUtils', 'OcorrenciaUtils'];

    function Dashboard(controller, $rootScope, $scope, ContratoUtils, OcorrenciaUtils) {
        
        /* jshint validthis: true */
        var vm = this;

        vm.instancia = {};
		vm.tabela = {};

        vm.options = {
            minMode: 'day', 
            maxDate: moment()
        };

        vm.filtrarVencendoEm90 = filtrarVencendoEm90;
        vm.filtrarVencendoEm180 = filtrarVencendoEm180;

        iniciar();

        function iniciar() {

            if (!$rootScope.logado) {
                return;
            }

            if($rootScope.usuario.usuarioOrigem.codigo == 'sme') {
                buscarContratosVencimentoProximo();
                buscarPrestadoresComReincidencia();
            }

        }

        function buscarContratosVencimentoProximo() {

            ContratoUtils.buscarVencimentoProximo(180).then((response) => {
                vm.contratoVencimentoProximoList = response.objeto;
            });

        }

        function filtrarVencendoEm90(contrato) {
            return contrato.dias <= 90;
        }

        function filtrarVencendoEm180(contrato) {
            return contrato.dias > 90 && contrato.dias <= 180;
        }

        function buscarPrestadoresComReincidencia() {
            OcorrenciaUtils.buscarPrestadoresComReincidencia().then((response) => {
                vm.prestadorComReincidenciaList = response.objeto;
            });
        }

    }

})();