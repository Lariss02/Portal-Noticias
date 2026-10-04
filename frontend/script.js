document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('postForm');

    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const novoPost = {
                title: document.getElementById('title').value.trim(),
                content: document.getElementById('content').value.trim(),
                autorId: Number(document.getElementById('autorId').value),
                semana: Number(document.getElementById('semana').value)
            };

            if (!novoPost.title || !novoPost.content || !novoPost.autorId || !novoPost.semana) {
                alert('Preencha todos os campos antes de publicar.');
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

        container.replaceChildren();

        if (posts.length === 0) {
            container.appendChild(criarTexto('p', 'post-empty', 'Nenhuma notícia encontrada.'));
            return;
        }

        posts.forEach(post => {
            const autor = autores.find(item => item.id === post.autorId);
            const comentariosDoPost = comentarios.filter(comentario => comentario.postId === post.id);
            container.appendChild(criarPost(post, autor, comentariosDoPost, autores));
        });
    } catch (erro) {
        container.replaceChildren(
            criarTexto('p', 'post-empty', `Não foi possível carregar o mural: ${erro.message}`)
        );
    }
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
        rodape,
        criarSecaoComentarios(post.id, comentarios, autores)
    );

    return artigo;
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
