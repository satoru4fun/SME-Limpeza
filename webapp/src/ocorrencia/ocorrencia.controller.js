(function () {
	
	'use strict';
	
	angular
	.module('app.ocorrencia')
	.controller('OcorrenciaLista', OcorrenciaLista);
	
	OcorrenciaLista.$inject = ['$rootScope', '$location', 'controller', 'OcorrenciaRest', 'tabela', '$uibModal',
		'OcorrenciaTipoUtils', 'UnidadeEscolarUtils', 'PrestadorServicoUtils'];
	
	function OcorrenciaLista($rootScope, $location, controller, dataservice, tabela, $uibModal,
		OcorrenciaTipoUtils, UnidadeEscolarUtils, PrestadorServicoUtils) {
		/* jshint validthis: true */

		var vm = this;
		
		vm.instancia = {};
		vm.tabela = {};
	
		vm.recarregarTabela = recarregarTabela;
		
		vm.abrirModal = abrirModal;
		vm.fecharModal = fecharModal;

		vm.flagPodeCadastrar = $rootScope.usuario.usuarioOrigem.codigo == 'ue' && $rootScope.usuario.usuarioCargo.id == 3;

		iniciar();
		
		function iniciar() {
			carregarComboTipoOcorrencia();
			carregarComboPrestadorServico();
			carregarComboUnidadeEscolar();
			montarTabela();
		}

		function carregarComboTipoOcorrencia() {

			OcorrenciaTipoUtils.carregarCombo().then(success).catch(error);

			function success(response) {
				vm.idOcorrenciaTipoList = response.objeto;
			}

			function error(response) {
				vm.idOcorrenciaTipoLista = [];
				controller.feed('error', 'Erro ao buscar combo de tipos de ocorrência.');
			}

		}

		function carregarComboPrestadorServico() {

			PrestadorServicoUtils.carregarCombo().then(success).catch(error);

			function success(response) {
				vm.prestadorServicoList = response.objeto;
			}

			function error(response) {
				controller.feed('error', 'Erro ao buscar combo de prestadores.');
				vm.prestadorServicoList = [];
			}

		}

		function carregarComboUnidadeEscolar() {

			UnidadeEscolarUtils.carregarComboTodos().then(success).catch(error);

			function success(response) {
				vm.unidadeEscolarList = response.objeto;
			}

			function error(response) {
				vm.unidadeEscolarLista = [];
				controller.feed('error', 'Erro ao buscar combo de unidades escolares.');
			}

		}
		
		function montarTabela() {

			criarOpcoesTabela();

			function criarColunasTabela() {

				var colunas = [
					{data: 'data', title: 'Data', renderWith: tabela.formatarData },
					{data: 'tipo', title: 'Variável Gerencial' }
				];

				if($rootScope.usuario.usuarioOrigem.codigo != 'ps') {
					colunas.push({data: '', title: 'Prestador de Serviço', renderWith: (var1, var2, data) => {
						return `
							<h5 style="font-weight: 100">${data.prestadorServico.razaoSocial}</h5>
							<small>CNPJ: ${controller.formatarCnpj(data.prestadorServico.cnpj)}</small>
						`;
					}});
				}

				if($rootScope.usuario.usuarioOrigem.codigo != 'ue') {
					colunas.push({data: '', title: 'Unidade Escolar', renderWith: (var1, var2, data) => {
						return `
							<h5 style="font-weight: 100">${data.unidadeEscolar.descricao}</h5>
							<small>${data.unidadeEscolar.endereco}</small>
						`;
					}});
				}

				colunas.push({data: 'flagEncerrado', title: 'Encerrado', width: 15, cssClass: 'text-right', renderWith: tabela.booleanParaBadgeSimNao});
				colunas.push({data: 'id', title: 'Ações', width: 15, cssClass: 'text-right', renderWith: (var1, var2, data) => {
					return `<button class="btn btn-outline-primary btn-sm visualizar" title="Visualizar"><i class="icon-eye"></i></button>`;
				}});

				vm.tabela.colunas = tabela.adicionarColunas(colunas);

			}

			function criarOpcoesTabela() {

				vm.tabela.opcoes = tabela.criarTabela(ajax, vm, null, 'data');
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
	
					$('.visualizar', nRow).unbind('click');
					$('.visualizar', nRow).bind('click', function () {
						$rootScope.$evalAsync(function () {
							$location.path('ocorrencia/detalhe/' + aData.id);
						});
					});
	
				}

			}

		}

		function abrirModal(id, ocorrencia) {

			if(!vm.flagPodeCadastrar) {
				return;
			}

			vm.modal = $uibModal.open({
				templateUrl: 'src/ocorrencia/ocorrencia-form/ocorrencia-form-modal.html?' + new Date(),
				bindToController: true,
				backdrop: 'static',
				controller: 'OcorrenciaForm',
				controllerAs: 'vm',
				size: 'lg',
				keyboard: false,
			}).result.then(() => {
				recarregarTabela();
			});

		}

		function fecharModal() {
			vm.modal.close();
			delete vm.modal;
		}

		function recarregarTabela() {
			tabela.recarregarDados(vm.instancia);
		}

	}
	
})();