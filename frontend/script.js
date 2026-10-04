document.addEventListener('DOMContentLoaded', carregarPosts);

async function carregarPosts() {
    const resposta = await fetch('/posts');
    const posts = await resposta.json();
    
    const container = document.getElementById('postsList');
    container.innerHTML = '';
    
    posts.forEach(post => {
        const div = document.createElement('div');
        div.innerHTML = `
            <h3>${post.title} (Semana: ${post.semana})</h3>
            <p>${post.content}</p>
            <hr>
        `;
        container.appendChild(div);
    });
}

document.getElementById('postForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const novoPost = {
        title: document.getElementById('title').value,
        content: document.getElementById('content').value,
        autorId: Number(document.getElementById('autorId').value),
        semana: Number(document.getElementById('semana').value)
    };

    const resposta = await fetch('/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoPost)
    });

    if (resposta.ok) {
        alert('Post publicado com sucesso!');
        document.getElementById('postForm').reset();
        carregarPosts();
    } else {
        const erro = await resposta.json();
        alert('Erro: ' + erro.error);
    }
});