if (usuario) {
    document.getElementById('dados').innerHTML = `
        <h2>${esc(usuario.name)} ${usuario.verificado ? '✔' : ''}</h2>
        <p class="subtitulo-secao">${esc(usuario.email)} · ${usuario.nivel}</p>`;
} else {
    location.href = 'cadastro.html'; 
}

function sair() {
    localStorage.removeItem('usuario');
    location.href = 'cadastro.html';
}

async function mudarNome() {
    const name = prompt('Novo nome:', usuario.name);
    if (!name) return;

    try {
        const atualizado = await chamar(`/autores/${usuario.id}`, { method: 'PUT', body: JSON.stringify({ name }) });
        localStorage.setItem('usuario', JSON.stringify(atualizado));
        location.reload();
    } catch (erro) {
        alert(erro.message);
    }
}

async function excluirConta() {
    if (!confirm('Isso apaga sua conta, seus posts e seus comentários. Continuar?')) return;
    await chamar(`/autores/${usuario.id}`, { method: 'DELETE' });
    sair();
}