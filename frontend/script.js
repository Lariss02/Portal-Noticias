let postsDoMural = [];
let comentariosDoMural = [];
let autoresDoMural = [];
let tagPesquisada = '';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('postForm');
    const buscaForm = document.getElementById('tagSearchForm');
    const campoBusca = document.getElementById('tagSearch');
    const botaoLimparBusca = document.getElementById('clearTagSearch');

    if (buscaForm && campoBusca) {
        buscaForm.addEventListener('submit', event => {
            event.preventDefault();
            tagPesquisada = campoBusca.value.trim();
            renderizarPosts();
        });
    }

    if (botaoLimparBusca && campoBusca) {
        botaoLimparBusca.addEventListener('click', () => {
            campoBusca.value = '';
            tagPesquisada = '';
            renderizarPosts();
        });
    }

    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const novoPost = {
                title: document.getElementById('title').value.trim(),
                content: document.getElementById('content').value.trim(),
                autorId: Number(document.getElementById('autorId').value),
                semana: Number(document.getElementById('semana').value),
                tags: normalizarTags(document.getElementById('tags').value)
            };

            if (!novoPost.title || !novoPost.content || !novoPost.autorId || !novoPost.semana) {
                alert('Preencha todos os campos antes de publicar.');
                return;
            }

            if (novoPost.tags.length > 10 || novoPost.tags.some(tag => tag.length > 30)) {
                alert('Use no máximo 10 tags, com até 30 caracteres cada.');
                return;
            }

            try {
                await requisicaoJson('/posts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(novoPost)
                });

                alert('Post publicado com sucesso!');
                form.reset();
                await carregarPosts();
            } catch (erro) {
                alert(`Erro: ${erro.message}`);
            }
        });
    }

    carregarPosts();
});

function normalizarTags(valor) {
    const tags = valor.split(',').map(tag => tag.trim()).filter(Boolean);
    const tagsVistas = new Set();
    return tags.filter(tag => {
        const chave = tag.toLocaleLowerCase();
        if (tagsVistas.has(chave)) return false;
        tagsVistas.add(chave);
        return true;
    });
}

async function requisicaoJson(url, options) {
    const resposta = await fetch(url, options);
    const dados = await resposta.json().catch(() => null);

    if (!resposta.ok) {
        throw new Error(dados?.error || 'Não foi possível concluir a solicitação.');
    }

    if (dados === null) {
        throw new Error('O servidor retornou uma resposta inválida.');
    }

    return dados;
}

async function carregarPosts() {
    const container = document.getElementById('postsList');
    if (!container) return;

    container.innerHTML = '<p class="post-empty">Carregando notícias...</p>';

    try {
        const [posts, comentarios, autores] = await Promise.all([
            requisicaoJson('/posts'),
            requisicaoJson('/comentarios'),
            requisicaoJson('/autores')
        ]);

        if (!Array.isArray(posts) || !Array.isArray(comentarios) || !Array.isArray(autores)) {
            throw new Error('O servidor retornou dados inválidos para o mural.');
        }

        postsDoMural = posts;
        comentariosDoMural = comentarios;
        autoresDoMural = autores;
        renderizarPosts();
    } catch (erro) {
        container.replaceChildren(
            criarTexto('p', 'post-empty', `Não foi possível carregar o mural: ${erro.message}`)
        );
    }
}

function renderizarPosts() {
    const container = document.getElementById('postsList');
    if (!container) return;

    const tag = tagPesquisada.toLocaleLowerCase();
    const postsFiltrados = tag
        ? postsDoMural.filter(post =>
            (Array.isArray(post.tags) ? post.tags : [])
                .some(postTag => postTag.toLocaleLowerCase() === tag)
        )
        : postsDoMural;

    container.replaceChildren();

    if (postsFiltrados.length === 0) {
        const mensagem = tag
            ? `Nenhum post encontrado com a tag "${tagPesquisada}".`
            : 'Nenhuma notícia encontrada.';
        container.appendChild(criarTexto('p', 'post-empty', mensagem));
        return;
    }

    postsFiltrados.forEach(post => {
        const autor = autoresDoMural.find(item => item.id === post.autorId);
        const comentarios = comentariosDoMural.filter(comentario => comentario.postId === post.id);
        container.appendChild(criarPost(post, autor, comentarios, autoresDoMural));
    });
}

function criarPost(post, autor, comentarios, autores) {
    const artigo = document.createElement('article');
    artigo.className = 'post-card';

    const cabecalho = document.createElement('div');
    cabecalho.className = 'post-header';
    cabecalho.append(
        criarTexto('h3', 'post-titulo', post.title),
        criarTexto('span', 'badge-semana', `Semana ${post.semana || 1}`)
    );

    const rodape = document.createElement('div');
    rodape.className = 'post-footer';
    rodape.append(
        criarTexto('span', '', `Autor: ${autor?.name || `ID ${post.autorId}`}`),
        criarTexto('span', 'selo-verificado', autor?.verificado ? 'Verificado' : 'Publicação')
    );

    artigo.append(
        cabecalho,
        criarTexto('p', 'post-conteudo', post.content),
        criarListaTags(post.tags || []),
        rodape,
        criarSecaoComentarios(post.id, comentarios, autores)
    );

    return artigo;
}

function criarListaTags(tags) {
    const lista = document.createElement('div');
    lista.className = 'post-tags';
    lista.setAttribute('aria-label', 'Tags da notícia');

    if (!Array.isArray(tags)) return lista;

    tags.forEach(tag => {
        const botao = document.createElement('button');
        botao.type = 'button';
        botao.className = 'tag-chip';
        botao.textContent = `#${tag}`;
        botao.setAttribute('aria-label', `Pesquisar posts com a tag ${tag}`);
        botao.addEventListener('click', () => {
            const campoBusca = document.getElementById('tagSearch');
            if (campoBusca) campoBusca.value = tag;
            tagPesquisada = tag;
            renderizarPosts();
        });
        lista.appendChild(botao);
    });

    return lista;
}

function criarSecaoComentarios(postId, comentarios, autores) {
    const secao = document.createElement('section');
    secao.className = 'comentarios-secao';
    secao.setAttribute('aria-label', 'Comentários da notícia');
    secao.appendChild(criarTexto('h4', 'comentarios-titulo', 'Comentários'));

    const lista = document.createElement('ul');
    lista.className = 'comentarios-lista';

    if (comentarios.length === 0) {
        lista.appendChild(criarTexto('li', 'comentario-vazio', 'Ainda não há comentários.'));
    } else {
        comentarios.forEach(comentario => adicionarComentario(lista, comentario));
    }

    secao.appendChild(lista);

    const form = document.createElement('form');
    form.className = 'comentario-form';

    const autorLabel = document.createElement('label');
    const autorId = `comentario-autor-${postId}`;
    autorLabel.htmlFor = autorId;
    autorLabel.textContent = 'Seu nome';

    const seletorAutor = document.createElement('select');
    seletorAutor.id = autorId;
    seletorAutor.name = 'autorId';
    seletorAutor.required = true;

    if (autores.length === 0) {
        seletorAutor.appendChild(new Option('Nenhum autor disponível', ''));
        seletorAutor.disabled = true;
    } else {
        autores.forEach(autor => seletorAutor.add(new Option(autor.name, autor.id)));
    }

    const textoLabel = document.createElement('label');
    const textoId = `comentario-texto-${postId}`;
    textoLabel.htmlFor = textoId;
    textoLabel.textContent = 'Escreva um comentário';

    const texto = document.createElement('textarea');
    texto.id = textoId;
    texto.name = 'texto';
    texto.rows = 2;
    texto.maxLength = 1000;
    texto.placeholder = 'Compartilhe sua opinião...';
    texto.required = true;
    texto.disabled = autores.length === 0;

    const botao = document.createElement('button');
    botao.type = 'submit';
    botao.className = 'btn-comentario';
    botao.textContent = 'Comentar';
    botao.disabled = autores.length === 0;

    const status = document.createElement('p');
    status.className = 'comentario-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');

    form.append(autorLabel, seletorAutor, textoLabel, texto, botao, status);
    form.addEventListener('submit', async event => {
        event.preventDefault();
        const conteudo = texto.value.trim();

        if (!conteudo) {
            status.textContent = 'Digite um comentário antes de enviar.';
            return;
        }

        botao.disabled = true;
        status.textContent = 'Enviando comentário...';

        try {
            const comentario = await requisicaoJson('/comentarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    postId,
                    autorId: Number(seletorAutor.value),
                    texto: conteudo
                })
            });

            lista.querySelector('.comentario-vazio')?.remove();
            adicionarComentario(lista, comentario);
            texto.value = '';
            status.textContent = 'Comentário adicionado.';
        } catch (erro) {
            status.textContent = `Não foi possível adicionar o comentário: ${erro.message}`;
        } finally {
            botao.disabled = autores.length === 0;
        }
    });

    secao.appendChild(form);
    return secao;
}

function adicionarComentario(lista, comentario) {
    const item = document.createElement('li');
    item.className = 'comentario-item';

    const autor = document.createElement('strong');
    autor.textContent = comentario.autorNome || `Autor ${comentario.autorId}`;

    const texto = document.createElement('p');
    texto.textContent = comentario.texto;

    item.append(autor, texto);
    lista.appendChild(item);
}

function criarTexto(tag, className, texto) {
    const elemento = document.createElement(tag);
    if (className) elemento.className = className;
    elemento.textContent = texto ?? '';
    return elemento;
}
