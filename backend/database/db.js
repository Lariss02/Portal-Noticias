const db = {
    autores: [
        { id: 1, name: "Patricia", email: "patricia@ifms.edu.br", senha: "123456", nivel: "servidor" }
    ],
    posts: [],
    comentarios: [],
    proximoId: { autores: 2, posts: 1, comentarios: 1 }
};

module.exports = db;