document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('postForm');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

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
                const resposta = await fetch('/posts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(novoPost)
                });

                const dados = await resposta.json().catch(() => ({}));

                if (resposta.ok) {
                    alert('Post publicado com sucesso!');
                    form.reset();
                    carregarPosts();
                    return;
                }

                alert('Erro: ' + (dados.error || 'Não foi possível publicar o post.'));
            } catch (erro) {
                alert('Erro ao conectar com o servidor.');
            }
        });
    }

    carregarPosts();
});

async function carregarPosts() {
    const container = document.getElementById('postsList');
    if (!container) return;

    try {
        const resposta = await fetch('/posts');
        const posts = await resposta.json();

        container.innerHTML = '';

        if (!Array.isArray(posts) || posts.length === 0) {
            container.innerHTML = '<p class="post-empty">Nenhum post encontrado.</p>';
            return;
        }

        posts.forEach(post => {
            const div = document.createElement('article');
            div.className = 'post-card';
            div.innerHTML = `
                <div class="post-header">
                    <h3 class="post-titulo">${post.title}</h3>
                    <span class="badge-semana">Semana ${post.semana || 1}</span>
                </div>
                <p class="post-conteudo">${post.content}</p>
                <div class="post-footer">
                    <span>Autor ID: ${post.autorId}</span>
                    <span class="selo-verificado">${post.autorId === 2 ? 'Verificado' : 'Publicação'}</span>
                </div>
            `;
            container.appendChild(div);
        });
    } catch (erro) {
        container.innerHTML = '<p class="post-empty">Não foi possível carregar os posts.</p>';
    }
}