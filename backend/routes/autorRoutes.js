const express = require('express');
const router = express.Router();
const db = require('../database/db');
const CODIGOS = { aluno_lider: 'LIDER2026', servidor: 'SERVIDOR2026' };

function publico(a) {
    return { id: a.id, name: a.name, email: a.email, nivel: a.nivel, verificado: a.nivel === 'servidor' };
}

router.get('/', (req, res) => {
    res.json(db.autores.map(publico));
});


router.post('/', (req, res) => {
    const { name, email, senha, nivel = 'aluno_comum', codigo } = req.body || {};

    if (!name || !email || !senha) {
        return res.status(400).json({ error: "Preencha nome, e-mail e senha." });
    }
    if (db.autores.some(a => a.email === email)) {
        return res.status(409).json({ error: "E-mail já cadastrado." });
    }
    if (nivel !== 'aluno_comum' && (!CODIGOS[nivel] || codigo !== CODIGOS[nivel])) {
        return res.status(403).json({ error: "Código de verificação incorreto." });
    }

    const novo = { id: db.proximoId.autores++, name, email, senha, nivel };
    db.autores.push(novo);
    res.status(201).json(publico(novo));
});

router.post('/login', (req, res) => {
    const { email, senha } = req.body || {};
    const autor = db.autores.find(a => a.email === email && a.senha === senha);

    if (!autor) return res.status(401).json({ error: "E-mail ou senha incorretos." });
    res.json(publico(autor));
});

router.put('/:id', (req, res) => {
    const autor = db.autores.find(a => a.id === Number(req.params.id));
    if (!autor) return res.status(404).json({ error: "Autor não encontrado." });

    autor.name = req.body?.name || autor.name;
    res.json(publico(autor));
});

router.delete('/:id', (req, res) => {
    const id = Number(req.params.id);
    db.autores = db.autores.filter(a => a.id !== id);
    db.posts = db.posts.filter(p => p.autorId !== id);
    db.comentarios = db.comentarios.filter(c => c.autorId !== id);
    res.status(204).send();
});

module.exports = router;