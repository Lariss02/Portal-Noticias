const express = require('express');
const router = express.Router();
const db = require('../database/db');
const semanaAtual = () => Math.floor((Date.now() / 86400000 + 3) / 7);
const listaTags = tags => [...new Set(String(tags || '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean))];


function comAutor(post) {
    const autor = db.autores.find(a => a.id === post.autorId);
    return { ...post, autorNome: autor.name, verificado: autor.nivel === 'servidor' };
}
router.get('/', (req, res) => {
    const tag = String(req.query.tag || '').trim().toLowerCase();
    const posts = tag ? db.posts.filter(p => p.tags.includes(tag)) : db.posts;
    res.json(posts.map(comAutor).reverse());
});

router.post('/', (req, res) => {
    const { title, content, tags, autorId } = req.body || {};
    const autor = db.autores.find(a => a.id === Number(autorId));

    if (!autor) return res.status(401).json({ error: "Faça login para publicar." });
    if (!title || !content) return res.status(400).json({ error: "Preencha título e conteúdo." });

    if (autor.nivel === 'aluno_comum') {
        return res.status(403).json({ error: "Alunos comuns só podem comentar." });
    }

    if (autor.nivel === 'aluno_lider') {
        const daSemana = db.posts.filter(p => p.autorId === autor.id && p.semana === semanaAtual());
        if (daSemana.length >= 2) {
            return res.status(422).json({ error: "Limite atingido: no máximo 2 posts por semana." });
        }
    }

    const novo = { id: db.proximoId.posts++, title, content, tags: listaTags(tags), autorId: autor.id, semana: semanaAtual() };
    db.posts.push(novo);
    res.status(201).json(comAutor(novo));
});

router.put('/:id', (req, res) => {
    const post = db.posts.find(p => p.id === Number(req.params.id));
    const { title, content, tags, autorId } = req.body || {};

    if (!post) return res.status(404).json({ error: "Post não encontrado." });
    if (Number(autorId) !== post.autorId) return res.status(403).json({ error: "Só o autor pode editar." });
    if (!title || !content) return res.status(400).json({ error: "Preencha título e conteúdo." });

    post.title = title;
    post.content = content;
    post.tags = listaTags(tags);
    res.json(comAutor(post));
});

router.delete('/:id', (req, res) => {
    const post = db.posts.find(p => p.id === Number(req.params.id));
    const quem = db.autores.find(a => a.id === Number(req.query.autorId));

    if (!post) return res.status(404).json({ error: "Post não encontrado." });
    if (!quem || (quem.id !== post.autorId && quem.nivel !== 'servidor')) {
        return res.status(403).json({ error: "Você não pode apagar este post." });
    }

    db.posts = db.posts.filter(p => p.id !== post.id);
    db.comentarios = db.comentarios.filter(c => c.postId !== post.id);
    res.status(204).send();
});

module.exports = router;