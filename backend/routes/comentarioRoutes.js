const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/', (req, res) => {
    res.json(db.comentarios);
});

router.post('/', (req, res) => {
    const { postId, autorId, texto } = req.body;

    if (
        !Number.isInteger(Number(postId)) ||
        Number(postId) < 1 ||
        !Number.isInteger(Number(autorId)) ||
        Number(autorId) < 1 ||
        typeof texto !== 'string' ||
        !texto.trim() ||
        texto.trim().length > 1000
    ) {
        return res.status(400).json({
            error: "postId e autorId devem ser válidos, e o comentário deve ter entre 1 e 1000 caracteres."
        });
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
        texto: texto.trim(),
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
