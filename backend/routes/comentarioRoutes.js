const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/', (req, res) => {
    res.json(db.comentarios);
});

router.post('/', (req, res) => {
    const { postId, autorId, texto } = req.body;

    if (!postId || !autorId || !texto) {
        return res.status(400).json({ error: "postId, autorId e texto são obrigatórios." });
    }

    const post = db.posts.find(p => p.id === Number(postId));
    if (!post) {
        return res.status(404).json({ error: "Post não encontrado." });
    }

    const autor = db.autores.find(a => a.id === Number(autorId));
    if (!autor) {
        return res.status(404).json({ error: "Autor não encontrado." });
    }

    const novoComentario = {
        id: db.comentarios.length + 1,
        postId: Number(postId),
        autorId: Number(autorId),
        texto,
        autorNome: autor.name
    };

    db.comentarios.push(novoComentario);
    res.status(201).json(novoComentario);
});

router.delete('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = db.comentarios.findIndex(c => c.id === id);

    if (index === -1) {
        return res.status(404).json({ error: "Comentário não encontrado." });
    }

    db.comentarios.splice(index, 1);
    res.status(204).send();
});

module.exports = router;
