(function () {
	
	'use strict';
	
	angular
	.module('ocorrencia.ocorrencia-detalhe')
	.controller('OcorrenciaDetalheController', OcorrenciaDetalheController);
	
	OcorrenciaDetalheController.$inject = ['$rootScope', '$scope', '$interval', 'controller', '$routeParams', '$uibModal', '$location', 
		'OcorrenciaRest', 'OcorrenciaMensagemUtils', 'SweetAlert'];
	
	function OcorrenciaDetalheController($rootScope, $scope, $interval, controller, $routeParams, $uibModal, $location, 
		dataservice, OcorrenciaMensagemUtils, SweetAlert) {
		/* jshint validthis: true */

		var vm = this;

		vm.mensagemList = [];
		vm.encerrar = encerrar;
		vm.visualizarImagens = visualizarImagens;
		vm.enviarMensagem = enviarMensagem;
		vm.interval;

		iniciar();
		
		function iniciar() {

			vm.idOcorrencia = $routeParams.id;
			if(!vm.idOcorrencia) {
				redirecionarListagem();
			}

			buscarOcorrencia();
			buscarMensagens();
			iniciarInterval();

		}

		function buscarOcorrencia() {

			dataservice.buscar(vm.idOcorrencia).then(success).catch(error);

			function success(response) {
				vm.ocorrencia = controller.ler(response, 'data');
			}

			function error(response) {
				controller.feed('error', 'Erro ao buscar ocorrência.');
				redirecionarListagem();
			}
			
		}

		function buscarMensagens(ignoreLoadingBar) {

			OcorrenciaMensagemUtils.buscarPorOcorrencia(vm.idOcorrencia, ignoreLoadingBar).then(success).catch(error);

			function success(response) {
				if(vm.mensagemList.length !== response.objeto.length) {
					vm.mensagemList = response.objeto;
				}
			}

			function error(response) {
				controller.feed('error', 'Erro ao carregar mensagens.');
				redirecionarListagem();
			}

		}

		function enviarMensagem() {

			if(!vm.mensagem) {
				controller.feed('error', 'Erro ao enviar mensagem.');
				return;
			}

			var model = {
				idOcorrencia: vm.idOcorrencia,
				mensagem: vm.mensagem
			};

			OcorrenciaMensagemUtils.inserir(model).then(success).catch(error);

			function success(response) {
				vm.mensagem = null;
				buscarMensagens(true);
			}

			function error(response) {
				console.log(response);
				controller.feed('error', 'Erro ao enviar mensagem.');
				buscarMensagens();
			}

		}

		function visualizarImagens() {

            vm.myInterval = 5000;
            vm.noWrapSlides = false;

            $uibModal.open({
                animation: true,
                windowClass: 'modal-arquivos',
                template: `
                    <div class="modal-body p-0">
                        <div uib-carousel active="vm.active">
                            <div uib-slide ng-repeat="arquivo in vm.ocorrencia.arquivos" index="$index">
                                <img class="img-fluid" src="data:image/jpg;base64,{{arquivo.base64}}">
                                <div class="carousel-caption">
                                    <h4>{{arquivo.filename}}</h4>
                                </div>
                            </div>
                        </div>
                    </div>`,
                backdrop: true,
                scope: $scope,
                size: 'lg',
				keyboard: false,
            });

		}

		function encerrar() {

			if(vm.ocorrencia.flagEncerrado || $rootScope.usuario.usuarioOrigem.codigo != 'ue') {
				return;
			}

			SweetAlert.swal({
                title: "Tem certeza?",	
                text: "Após encerrar, não será possível reverter essa ação.",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: '#3f51b5',
                cancelButtonColor: '#ff4081',
                confirmButtonText: "Sim, encerrar" + (vm.ocorrencia.flagGerarDesconto ? ' e gerar desconto' : ''),
                cancelButtonText: 'Cancelar',
                closeOnConfirm: true,
			}, (isConfirm) => { if(isConfirm) 
				dataservice.encerrar(
					vm.idOcorrencia, 
					vm.ocorrencia
				).then(success).catch(error); 
			});

			
			function success(response) {
				controller.feed('success', 'Ocorrência encerrada com sucesso');
				buscarOcorrencia();
				buscarMensagens();
			}

			function error(response) {
				controller.feed('error', 'Erro ao encerrar ocorrência.');
			}

		}
		
		function redirecionarListagem() {
			$rootScope.$evalAsync(function () {
				$location.path('ocorrencia');
			});
		}

		function iniciarInterval() {
			vm.interval = $interval(() => {
				if(!vm.mensagem) {
					buscarMensagens(true);
				}
			}, 5000);
		}

		$scope.$on('$destroy', function() {
			$interval.cancel(vm.interval);
		});

	}
	
})();