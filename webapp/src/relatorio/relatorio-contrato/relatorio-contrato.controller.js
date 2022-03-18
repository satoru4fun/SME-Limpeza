(() => {
	
	'use strict';
	
	angular
	.module('relatorio.relatorio-contrato')
	.controller('RelatorioContratoController', RelatorioContratoController);
	
	RelatorioContratoController.$inject = ['$rootScope', '$scope', '$location', 'controller', 'RelatorioContratoRest', 'tabela', '$uibModal', 
		'PrestadorServicoUtils'];
	
	function RelatorioContratoController($rootScope, $scope, $location, controller, dataservice, tabela, $uibModal, 
			PrestadorServicoUtils) {
		/* jshint validthis: true */

		var vm = this;
		
		vm.instancia = {};
		vm.tabela = {};

		vm.recarregarTabela = recarregarTabela;

		iniciar();
		
		function iniciar() {
			carregarCombosDatas();
			montarTabela();
		}

		function montarTabela() {

			criarOpcoesTabela();

			function criarColunasTabela() {

				const colunas = [
					{data: '', title: 'Referência', renderWith: (v1, v2, data) => 
						`${data.mes}/${data.ano}`
					}, 
					{data: '', title: 'Contrato', renderWith: (v1, v2, data) =>
						`
							<h5 style="font-weight: 100">${data.contrato.codigo}</h5>
							<small>${data.contrato.descricao}</small>
						`
					},
					{data: '', title: 'Prestador de Serviço', renderWith: (v1, v2, data) =>
						`
							<h5 style="font-weight: 100">${data.prestadorServico.razaoSocial}</h5>
							<small>CNPJ: ${controller.formatarCnpj(data.prestadorServico.cnpj)}</small>
						`
					},
					{data: 'valorTotal', title: 'Valor Contrato', cssClass: 'text-right', renderWith: (value) =>
						(value === null || value === undefined) ? ' - ' : value.toLocaleString('pt-br',{style: 'currency', currency: 'BRL'})
					},
					{data: 'valorLiquido', title: 'Valor Líquido', cssClass: 'text-right', renderWith: (value) =>
						(value === null || value === undefined) ? ' - ' : value.toLocaleString('pt-br',{style: 'currency', currency: 'BRL'})
					},
					{data: '', title: 'Ação', width: 15, cssClass: 'text-right', renderWith: (v1, v2, data) =>
						`<button class="btn btn-outline-primary btn-sm visualizar" title="Visualizar"><i class="icon-eye"></i></button>`
					}
				];

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

				function rowCallback(nRow, aData) {
	
					$('.visualizar', nRow).off('click');
					$('.visualizar', nRow).on('click', () =>
						$rootScope.$evalAsync(() => 
							$location.path(`/relatorio/contrato/detalhe/${aData.ano}/${aData.mes}/${aData.idContrato}`))
					);
	
				}


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