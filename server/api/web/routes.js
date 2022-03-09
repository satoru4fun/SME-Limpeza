
require('express-group-routes');

const express = require('express');

const checkAuthorization = require('./auth/check-auth.js');

const app = express();

app.use('/api/web/auth', require('./auth/auth-controller'));
app.use('/api/web/aplicativo', require('./aplicativo/aplicativo-controller'));

app.group("/api/web", (app) => {


    app.use(checkAuthorization._usuario);

    app.use('/usuario', require('./usuario/usuario/usuario-controller'));
    app.use('/usuario/origem', require('./usuario/usuario-origem/usuario-origem-controller'));
    app.use('/usuario/cargo', require('./usuario/usuario-cargo/usuario-cargo-controller'));
    app.use('/usuario/status', require('./usuario/usuario-status/usuario-status-controller'));

    app.use('/endereco', require('./endereco/endereco-controller'));

    app.use('/diretoria-regional', require('./diretoria-regional/diretoria-regional-controller'));
    app.use('/unidade-escolar', require('./unidade-escolar/unidade-escolar-controller'));
    app.use('/prestador-servico', require('./prestador-servico/prestador-servico-controller'));
    app.use('/contrato', require('./contrato/contrato-controller'));
    app.use('/feriado', require('./feriado/feriado-controller'));

    app.use('/plano-trabalho/periodicidade', require('./plano-trabalho/periodicidade/periodicidade-controller'));
    app.use('/plano-trabalho/turno', require('./plano-trabalho/turno/turno-controller'));
    app.use('/plano-trabalho/ambiente/tipo-ambiente', require('./plano-trabalho/ambiente/tipo-ambiente/tipo-ambiente-controller'));
    app.use('/plano-trabalho/ambiente/ambiente-geral', require('./plano-trabalho/ambiente/ambiente-geral/ambiente-geral-controller'));
    app.use('/plano-trabalho/ambiente/ambiente-unidade-escolar', require('./plano-trabalho/ambiente/ambiente-unidade-escolar/ambiente-unidade-escolar-controller'));
    app.use('/plano-trabalho/matriz', require('./plano-trabalho/plano-trabalho-matriz/plano-trabalho-matriz-controller'));
    app.use('/plano-trabalho/unidade-escolar', require('./plano-trabalho/plano-trabalho-unidade-escolar/plano-trabalho-unidade-escolar-controller'));

    app.use('/monitoramento', require('./monitoramento/monitoramento-controller'));

    app.use('/ocorrencia', require('./ocorrencia/ocorrencia-controller'));
    app.use('/ocorrencia/ocorrencia-mensagem', require('./ocorrencia/ocorrencia-mensagem/ocorrencia-mensagem-controller'));
    app.use('/ocorrencia/ocorrencia-tipo', require('./ocorrencia/ocorrencia-tipo/ocorrencia-tipo-controller'));
    app.use('/ocorrencia/ocorrencia-situacao', require('./ocorrencia/ocorrencia-situacao/ocorrencia-situacao-controller'));
    app.use('/ocorrencia/ocorrencia-variavel', require('./ocorrencia/ocorrencia-variavel/ocorrencia-variavel-controller'));

    app.use('/relatorio/relatorio-gerencial', require('./relatorio/relatorio-gerencial/relatorio-gerencial-controller'));

});

module.exports = app;