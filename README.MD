
# Gestão de Limpeza - SME-SP

O sistema para gestão das atividades de limpeza dos ambientes das unidades escolares possui duas ferramentas:


- **Aplicativo Mobile:** de uso exclusivo dos Prestadores de Serviço para o registro da realização das atividades.
- **Retaguarda Web:** para cadastros gerais e acomapnhamento dos monitoramentos, fiscalização e faturamento.


## Backend

Desenvolvido com NodeJS + Express em versão 14.15.1.

Para executar o projeto, configurar as variáveis de ambiente conforme o arquivo **.env.example** e após executar os seguintes comandos:

```bash
npm i
npm start
```

Para o funcionamento do recurso de agendamento automáticos dos monitoramentos, deverá ser adicionado a seguinte chamada no Crontab do servidor que executa a aplicação.

```bash
  1 0 * * * curl http://localhost:$SERVER_PORT/api/system/agendar-monitoramentos-automaticos >> $LOG_PATH/agendamento-automatico-`date +\%F`.log 2>&1
```

No quinto dia corrido de cada mês deverão ser gerados os Relatórios Gerenciais referentes ao mês imediatamente anterior, para tal deverá ser adicionado a seguinte chamada no Crontab do servidor que executa a aplicação.

```bash
  1 0 5 * * curl http://localhost:$SERVER_PORT/api/system/gerar-relatorio-gerencial >> $LOG_PATH/relatorio-gerencial-`date +\%F`.log 2>&1
```

## Frontend

Desenvolvido com AngularJS.

Para executar o projeto, siga os seguintes passos: 
- Configurar um subdomínio apontando no path root do **/webapp**
- Configurar a URL base e a porta da API no arquivo **rest.constantes.js**
- Executar o seguinte comando:

```bash
  npm i
```
 _Obs: não foi desenvolvido geração de build, minificação, entre outros..._

