const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

app.use(express.static('frontend'));

const autorRoutes = require('./routes/autorRoutes');
const postRoutes = require('./routes/postRoutes');
const comentarioRoutes = require('./routes/comentarioRoutes');

app.use('/autores', autorRoutes);
app.use('/posts', postRoutes);
app.use('/comentarios', comentarioRoutes);

app.use((erro, req, res, next) => {
    if (res.headersSent) {
        return next(erro);
    }

    if (erro.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'O corpo da requisição contém JSON inválido.' });
    }

    if (erro.type === 'entity.too.large') {
        return res.status(413).json({ error: 'O corpo da requisição é muito grande.' });
    }

    console.error('Erro interno ao processar a requisição:', erro);
    return res.status(500).json({ error: 'Erro interno do servidor. Consulte o terminal para mais detalhes.' });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});