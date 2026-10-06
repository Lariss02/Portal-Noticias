const express = require('express');
const router = express.Router();
const db = require('../database/db');

function comAutor(comentario) {
    const autor = db.autores.find(a => a.id === comentario.autorId);
    return { ...comentario, autorNome: autor.name, verificado: autor.nivel === 'servidor' };
}

router.get('/', (req, res) => {
    res.json(db.comentarios.map(comAutor));
});

router.post('/', (req, res) => {
    const { postId, autorId, texto } = req.body || {};
    const autor = db.autores.find(a => a.id === Number(autorId));

    if (!autor) return res.status(401).json({ error: "Faça login para comentar." });
    if (!db.posts.some(p => p.id === Number(postId))) return res.status(404).json({ error: "Post não encontrado." });
    if (!texto) return res.status(400).json({ error: "Escreva o comentário." });

    const novo = { id: db.proximoId.comentarios++, postId: Number(postId), autorId: autor.id, texto };
    db.comentarios.push(novo);
    res.status(201).json(comAutor(novo));
});

router.delete('/:id', (req, res) => {
    const comentario = db.comentarios.find(c => c.id === Number(req.params.id));
    const quem = db.autores.find(a => a.id === Number(req.query.autorId));

    if (!comentario) return res.status(404).json({ error: "Comentário não encontrado." });
    if (!quem || (quem.id !== comentario.autorId && quem.nivel !== 'servidor')) {
        return res.status(403).json({ error: "Você não pode apagar este comentário." });
    }

    db.comentarios = db.comentarios.filter(c => c.id !== comentario.id);
    res.status(204).send();
});

module.exports = router;