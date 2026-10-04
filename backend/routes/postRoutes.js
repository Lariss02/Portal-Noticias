const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/', (req, res) => {
    res.json(db.posts);
});

router.post('/', (req, res) => {
    const { title, content, autorId, semana } = req.body;

    const autor = db.autores.find(a => a.id === autorId);
    if (!autor) return res.status(404).json({ error: "Autor não encontrado" });

    if (autor.nivel === 'aluno_comum') {
        return res.status(403).json({ error: "Alunos comuns não podem publicar posts, apenas comentar." });
    }

    if (autor.nivel === 'aluno_lider') {
        const postsDaSemana = db.posts.filter(p => p.autorId === autorId && p.semana === semana);
        if (postsDaSemana.length >= 2) {
            return res.status(422).json({ error: "Limite atingido: Alunos líderes podem publicar no máximo 2 posts por semana." });
        }
    }

    const novoPost = {
        id: db.posts.length + 1,
        title,
        content,
        autorId,
        semana: semana || 1
    };

    db.posts.push(novoPost);
    res.status(201).json(novoPost);
});

router.delete('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = db.posts.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ error: "Post não encontrado" });

    db.posts.splice(index, 1);
    res.status(204).send();
});

module.exports = router;