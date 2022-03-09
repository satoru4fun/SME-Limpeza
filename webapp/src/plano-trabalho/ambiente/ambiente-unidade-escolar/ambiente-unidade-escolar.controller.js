(function () {
	
	'use strict';
	
	angular
	.module('ambiente.ambiente-unidade-escolar')
	.controller('AmbienteUnidadeEscolarController', AmbienteUnidadeEscolarController);
	
	AmbienteUnidadeEscolarController.$inject = ['$scope', 'controller', 'AmbienteUnidadeEscolarRest', 'tabela', '$uibModal', 'TipoAmbienteUtils', 'AmbienteGeralUtils'];
	
	function AmbienteUnidadeEscolarController($scope, controller, dataservice, tabela, $uibModal, TipoAmbienteUtils, AmbienteGeralUtils) {
		/* jshint validthis: true */

		var vm = this;
		
		vm.instancia = {};
		vm.tabela = {};

		vm.gerarTodosQRCode = gerarTodosQRCode;
		vm.abrirModal = abrirModal;
		vm.fecharModal = fecharModal;
		vm.salvar = salvar;
		vm.recarregarTabela = recarregarTabela;
		vm.evtChangeAmbienteGeral = evtChangeAmbienteGeral;

		iniciar();
		
		function iniciar() {
			carregarComboTipoAmbiente();
			carregarComboAmbienteGeral();
			montarTabela();
		}
		
		function montarTabela() {

			criarOpcoesTabela();

			function carregarObjeto(aData) {
				dataservice.buscar(aData.id).then((response) => {
					abrirModal(aData.id, controller.ler(response, 'data'));
				});
			}

			function criarColunasTabela() {

				var colunas = [
					{data: 'descricao', title: 'Descrição'},
					{data: 'tipoAmbiente', title: 'Tipo de Ambiente', cssClass: 'text-right'},
					{data: 'areaAmbiente', title: 'Área do Ambiente', cssClass: 'text-right', renderWith: function (areaAmbiente) {
						return areaAmbiente ? (areaAmbiente + ' m²') : '-';
					}},
					{data: 'id', title: 'Ação', width: 20, cssClass: 'text-right', renderWith: function (id) {
						return `
							<button class="mr-1 btn btn-outline-dark btn-sm qrcode"><i class="icon-cloud-download"></i></button>
							<button class="mr-1 btn btn-outline-primary btn-sm editar"><i class="icon-pencil"></i></button>
							<button class="btn btn-outline-danger btn-sm remover"><i class="icon-trash"></i></button>
						`;
					}}
				];

				vm.tabela.colunas = tabela.adicionarColunas(colunas);

			}

			function criarOpcoesTabela() {

				vm.tabela.opcoes = tabela.criarTabela(ajax, vm, remover, 'data', carregarObjeto);
				vm.tabela.opcoes.withOption('rowCallback', rowCallback);
				criarColunasTabela();

				function ajax(data, callback, settings) {

					dataservice.tabela(tabela.criarParametros(data, vm.filtros)).then(success).catch(error);

					function success(response) {
						callback(controller.lerRetornoDatatable(response));
					}

					function error(response) {
						callback(tabela.vazia());
					}

				}

				function rowCallback(nRow, aData, iDisplayIndex, iDisplayIndexFull) {
                
					$('.remover', nRow).unbind('click');
					$('.remover', nRow).bind('click', function () {
						tabela.evtRemover(aData, remover);
					});
	
					$('.editar', nRow).unbind('click');
					$('.editar', nRow).bind('click', function () {
						carregarObjeto(aData);
					});

					$('.qrcode', nRow).unbind('click');
					$('.qrcode', nRow).bind('click', function () {
						gerarQRCode(aData.id);
					});
	
				}

				function remover(id) {
					
					dataservice.remover(id).then(success).catch(error);

					function success(response) {
						controller.feed('success', 'Registro removido com sucesso.');
						tabela.recarregarDados(vm.instancia);
					}

					function error(response) {
						controller.feed('error', 'Erro ao remover registro.');				
					}

				}

			}

		}

		function gerarTodosQRCode() {

			dataservice.gerarTodosQRCode().then(success).catch(error);

			function success(response) {
				response = controller.ler(response, 'data');
				controller.downloadArquivo(response);
			}

			function error(response) {
				controller.feed('error', 'Erro ao gerar ao baixar o arquivo.');	
			}

		}

		function gerarQRCode(idAmbienteUnidadeEscolar) {

			dataservice.gerarQRCode(idAmbienteUnidadeEscolar).then(success).catch(error);

			function success(response) {
				response = controller.ler(response, 'data');
				controller.downloadArquivo(response);
			}

			function error(response) {
				console.log(response)
				controller.feed('error', 'Erro ao gerar o QRCode.');	
			}

		}

		function carregarComboTipoAmbiente() {
			
			TipoAmbienteUtils.carregarCombo().then(success).catch(error);

			function success(response) {
				vm.tipoAmbienteList = response.objeto;
			}

			function error(response) {
				vm.tipoAmbienteList = [];
				controller.feed(false, 'Erro ao carregar tipos de ambiente.');
			}
			
		}

		function carregarComboAmbienteGeral() {
			
			AmbienteGeralUtils.carregarCombo().then(success).catch(error);

			function success(response) {
				vm.ambienteGeralList = response.objeto;
			}

			function error(response) {
				vm.ambienteGeralList = [];
				controller.feed(false, 'Erro ao carregar ambientes da matriz.');
			}
		}

		function salvar(formulario) {

			if(formulario.$invalid) {
				return;
			}

			if(vm.modal.isEditar) {
				dataservice.atualizar(vm.modal.model.id, vm.modal.model).then(success).catch(error);
			} else {
				dataservice.inserir(vm.modal.model).then(success).catch(error);
			}

			function success(response) {
				controller.feed('success', 'Registro salvo com sucesso.');
				tabela.recarregarDados(vm.instancia);
				fecharModal();
			}

			function error(response) {
				controller.feed('error', 'Erro ao salvar registro.');
				tabela.recarregarDados(vm.instancia);
			}

		}

		function abrirModal(id, ambienteUnidadeEscolar) {

			vm.modal = $uibModal.open({
				templateUrl: 'src/plano-trabalho/ambiente/ambiente-unidade-escolar/ambiente-unidade-escolar-form.html?' + new Date(),
				backdrop: 'static',
				scope: $scope,
				size: 'md',
				keyboard: false,
			});

			vm.modal.model = angular.isDefined(ambienteUnidadeEscolar) ? angular.copy(ambienteUnidadeEscolar) : {};
			vm.modal.model.id = id;
			vm.modal.isEditar = angular.isDefined(ambienteUnidadeEscolar);

			if(vm.modal.isEditar) {
				vm.modal.model.tipoAmbiente = vm.ambienteGeralList.find((a) => a.id == vm.modal.model.idAmbienteGeral).tipoAmbiente;
			}

		}

		function fecharModal() {
			vm.modal.close();
			delete vm.modal;
		}

		function recarregarTabela() {
			tabela.recarregarDados(vm.instancia);
		}

		function evtChangeAmbienteGeral() {

			if(!vm.modal.model.idAmbienteGeral) {
				return '';
			}

			vm.modal.model.descricao = vm.ambienteGeralList.find((a) => a.id == vm.modal.model.idAmbienteGeral).descricao;
			vm.modal.model.tipoAmbiente = vm.ambienteGeralList.find((a) => a.id == vm.modal.model.idAmbienteGeral).tipoAmbiente;

		}

	}
	
})();