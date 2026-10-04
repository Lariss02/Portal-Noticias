const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

app.use(express.static('frontend'));

const autorRoutes = require('./routes/autorRoutes');
const postRoutes = require('./routes/postRoutes');

app.use('/autores', autorRoutes);
app.use('/posts', postRoutes);

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});