const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/', (req, res) => {
    res.json(db.autores);
});


router.post('/', (req, res) => {
    const { name, nivel, verificado } = req.body;

    if (!name || !nivel) {
        return res.status(400).json({ error: "Nome e nível são obrigatórios." });
    }

    const newAutor = {
        id: db.autores.length + 1,
        name,
        nivel,
        verificado: nivel === 'servidor' ? true : Boolean(verificado)
    };

    db.autores.push(newAutor);
    res.status(201).json(newAutor);
});

router.put('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const autor = db.autores.find(a => a.id === id);
    if (!autor) return res.status(404).json({ error: "Autor não encontrado" });

    const { name, nivel, verificado } = req.body;
    autor.name = name || autor.name;
    autor.nivel = nivel || autor.nivel;
    autor.verificado = nivel === 'servidor' ? true : (verificado ?? autor.verificado);

    res.json(autor);
});

router.delete('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = db.autores.findIndex(a => a.id === id);
    if (index === -1) return res.status(404).json({ error: "Autor não encontrado" });

    db.autores.splice(index, 1);
    res.status(204).send();
});

module.exports = router;