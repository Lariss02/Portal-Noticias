let posts = [];
let comentarios = [];

const logado = usuario !== null;
const ehServidor = logado && usuario.nivel === 'servidor';
const podePublicar = logado && usuario.nivel !== 'aluno_comum';

document.getElementById('postForm').hidden = !podePublicar;
document.getElementById('avisoPublicar').hidden = podePublicar;

async function carregar() {
    const tag = document.getElementById('tagSearch').value.trim();
    posts = await chamar('/posts?tag=' + encodeURIComponent(tag));
    comentarios = await chamar('/comentarios');

    const html = posts.map(montarPost).join('')
        || '<p>Nenhuma notícia encontrada.</p>';

    document.getElementById('postsList').innerHTML = html;
}

function montarPost(post) {
    const ehDono = logado && usuario.id === post.autorId;

    const botoes = `
        ${ehDono ? `<button class="btn-secundario" onclick="editarPost(${post.id})">Editar</button>` : ''}
        ${ehDono || ehServidor ? `<button class="btn-secundario" onclick="apagar('/posts/${post.id}')">Apagar</button>` : ''}`;

    return `
        <article class="post-card">
            <h3 class="post-titulo">${esc(post.title)}</h3>
            <p class="post-conteudo">${esc(post.content)}</p>
            <p>${post.tags.map(t => '#' + esc(t)).join(' ')}</p>
            <p class="post-footer">Autor: ${esc(post.autorNome)}
                ${post.verificado ? '<span class="selo-verificado">✔ Servidor verificado</span>' : ''}
            </p>
            ${botoes}
            ${montarComentarios(post.id)}
        </article>`;
}

function montarComentarios(postId) {
    const itens = comentarios
        .filter(c => c.postId === postId)
        .map(c => `
            <div class="comentario-item">
                <strong>${esc(c.autorNome)}</strong>
                <p>${esc(c.texto)}</p>
                ${ehServidor || (logado && usuario.id === c.autorId)
                    ? `<button class="btn-secundario" onclick="apagar('/comentarios/${c.id}')">Apagar</button>` : ''}
            </div>`)
        .join('');

    const form = logado
        ? `<form onsubmit="comentar(event, ${postId})">
               <textarea required placeholder="Escreva um comentário..."></textarea>
               <button class="btn-comentario">Comentar</button>
           </form>`
        : '<p>Entre na sua conta para comentar.</p>';

    return `<section class="comentarios-secao"><h4>Comentários</h4>${itens}${form}</section>`;
}
async function enviar(url, metodo, dados) {
    try {
        await chamar(url, { method: metodo, body: JSON.stringify(dados) });
        carregar();
        return true;
    } catch (erro) {
        alert(erro.message);
        return false;
    }
}

async function publicar(event) {
    event.preventDefault();
    const ok = await enviar('/posts', 'POST', {
        title: document.getElementById('title').value,
        content: document.getElementById('content').value,
        tags: document.getElementById('tags').value,
        autorId: usuario.id
    });
    if (ok) event.target.reset();
}

function editarPost(id) {
    const post = posts.find(p => p.id === id);
    const title = prompt('Novo título:', post.title);
    if (!title) return;
    const content = prompt('Novo conteúdo:', post.content);
    if (!content) return;

    enviar(`/posts/${id}`, 'PUT', { title, content, tags: post.tags.join(','), autorId: usuario.id });
}

function comentar(event, postId) {
    event.preventDefault();
    const texto = event.target.querySelector('textarea').value;
    enviar('/comentarios', 'POST', { postId, autorId: usuario.id, texto });
}

function apagar(url) {
    if (confirm('Tem certeza?')) enviar(url + '?autorId=' + usuario.id, 'DELETE');
}

function buscar(event) {
    event.preventDefault();
    carregar();
}

function limparBusca() {
    document.getElementById('tagSearch').value = '';
    carregar();
}

carregar();