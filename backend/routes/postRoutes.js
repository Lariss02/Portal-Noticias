const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/', (req, res) => {
    res.json(db.posts);
});

router.post('/', (req, res) => {
    const { title, content, autorId, semana, tags } = req.body || {};

    if (typeof title !== 'string' || !title.trim() || typeof content !== 'string' || !content.trim()) {
        return res.status(400).json({ error: "Título e conteúdo são obrigatórios." });
    }

    const autorIdNumerico = Number(autorId);
    if (!Number.isInteger(autorIdNumerico) || autorIdNumerico < 1) {
        return res.status(400).json({ error: "O ID do autor deve ser um número inteiro válido." });
    }

    const semanaNumerica = semana === undefined || semana === null || semana === '' ? 1 : Number(semana);
    if (!Number.isInteger(semanaNumerica) || semanaNumerica < 1) {
        return res.status(400).json({ error: "A semana deve ser um número inteiro positivo." });
    }

    let tagsNormalizadas;
    if (tags === undefined) {
        tagsNormalizadas = [];
    } else if (typeof tags === 'string') {
        tagsNormalizadas = tags.split(',');
    } else if (Array.isArray(tags) && tags.every(tag => typeof tag === 'string')) {
        tagsNormalizadas = tags;
    } else {
        return res.status(400).json({ error: "As tags devem ser enviadas como texto ou uma lista de textos." });
    }

    tagsNormalizadas = tagsNormalizadas
        .map(tag => tag.trim())
        .filter(Boolean);

    const tagsUnicas = [];
    const tagsVistas = new Set();
    for (const tag of tagsNormalizadas) {
        const chave = tag.toLocaleLowerCase();
        if (!tagsVistas.has(chave)) {
            tagsVistas.add(chave);
            tagsUnicas.push(tag);
        }
    }

    if (tagsUnicas.length > 10 || tagsUnicas.some(tag => tag.length > 30)) {
        return res.status(400).json({ error: "Use no máximo 10 tags, com até 30 caracteres cada." });
    }

    const autor = db.autores.find(a => a.id === autorIdNumerico);
    if (!autor) return res.status(404).json({ error: "Autor não encontrado" });

    if (autor.nivel === 'aluno_comum') {
        return res.status(403).json({ error: "Alunos comuns não podem publicar posts, apenas comentar." });
    }

    if (autor.nivel === 'aluno_lider') {
        const postsDaSemana = db.posts.filter(p =>
            p.autorId === autorIdNumerico && Number(p.semana || 1) === semanaNumerica
        );
        if (postsDaSemana.length >= 2) {
            return res.status(422).json({ error: "Limite atingido: Alunos líderes podem publicar no máximo 2 posts por semana." });
        }
    }

    const novoPost = {
        id: db.posts.length + 1,
        title: title.trim(),
        content: content.trim(),
        autorId: autorIdNumerico,
        semana: semanaNumerica,
        tags: tagsUnicas
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