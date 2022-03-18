(function () {
	
	'use strict';
	
	angular
	.module('relatorio.relatorio-gerencial')
	.controller('RelatorioGerencialController', RelatorioGerencialController);
	
	RelatorioGerencialController.$inject = ['$rootScope', '$scope', '$location', 'controller', 'RelatorioGerencialRest', 'tabela', '$uibModal', 
		'PrestadorServicoUtils'];
	
	function RelatorioGerencialController($rootScope, $scope, $location, controller, dataservice, tabela, $uibModal, 
			PrestadorServicoUtils) {
		/* jshint validthis: true */

		var vm = this;
		
		vm.instancia = {};
		vm.tabela = {};

		vm.recarregarTabela = recarregarTabela;

		iniciar();
		
		function iniciar() {
			carregarComboTodosPrestadorServico();
			carregarCombosDatas();
			montarTabela();
		}

		function montarTabela() {

			criarOpcoesTabela();

			function criarColunasTabela() {

				var colunas = [
					{data: '', title: 'Referência', renderWith: function (var1, var2, data) {
						return `${data.mes}/${data.ano}`;
					}}
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
							<small>Tipo: ${data.unidadeEscolar.tipo}</small>
						`;
					}});
				}


				colunas.push({data: 'pontuacaoFinal', title: 'Pontuação', cssClass: 'text-right', renderWith: (value) => {
					return (value === null || value === undefined) ? ' - ' : parseFloat(value).toFixed(2);
				}});

				colunas.push({data: 'fatorDesconto', title: 'Desconto', cssClass: 'text-right', renderWith: (value) => {
					return (value === null || value === undefined) ? ' - ' : (parseFloat(value).toFixed(2) + '%');
				}});

				colunas.push({data: '', title: 'Situação', cssClass: 'text-right', renderWith: (v1, v2, data) => {

					if(!data.flagAprovadoFiscal) {
						return '<div class="badge bg-warning p-2 text-white ">Aguardando Fiscal</div>';
					}

					if(!data.flagAprovadoDre) {
						return '<div class="badge bg-info p-2 text-white ">Aguardando DRE</div>';
					}

					if(data.flagAprovadoDre) {
						return '<div class="badge bg-success p-2 text-white ">Aprovado</div>';
					}

				}});
				
				colunas.push({data: 'id', title: 'Ação', width: 15, cssClass: 'text-right', renderWith: (var1, var2, data) => {
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
	
					$('.visualizar', nRow).off('click');
					$('.visualizar', nRow).on('click', () => {
						$rootScope.$evalAsync(() => $location.path('/relatorio/gerencial/detalhe/' + aData.id))
					});
	
				}


			}

		}

		function carregarComboTodosPrestadorServico() {

			PrestadorServicoUtils.carregarComboTodos().then(success).catch(error);

			function success(response) {
				vm.prestadorServicoList = response.objeto;
			}

			function error(response) {
				controller.feed('error', 'Erro ao buscar combo de prestadores.');
				vm.prestadorServicoTodosList = [];
			}

		}

		function carregarCombosDatas() {

			vm.mesList = [
				{ mes:  1, descricao: 'Janeiro' 	},
				{ mes:  2, descricao: 'Fevereiro' 	},
				{ mes:  3, descricao: 'Março' 		},
				{ mes:  4, descricao: 'Abril' 		},
				{ mes:  5, descricao: 'Maio' 		},
				{ mes:  6, descricao: 'Junho' 		},
				{ mes:  7, descricao: 'Julho' 		},
				{ mes:  8, descricao: 'Agosto' 		},
				{ mes:  9, descricao: 'Setembro' 	},
				{ mes: 10, descricao: 'Outubro' 	},
				{ mes: 11, descricao: 'Novembro' 	},
				{ mes: 12, descricao: 'Dezembro'	}
			];

			vm.anoList = [];

			let anoAtual = 2020;
			while(anoAtual <= moment().format('YYYY')) {
				vm.anoList.push(anoAtual);
				anoAtual++;
			}

		}

		function recarregarTabela() {
			tabela.recarregarDados(vm.instancia);
		}

	}
	
})();