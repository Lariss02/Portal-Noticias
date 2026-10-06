const usuario = JSON.parse(localStorage.getItem('usuario'));

async function chamar(url, options = {}) {
    const resposta = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
    const texto = await resposta.text();
    const dados = texto ? JSON.parse(texto) : null;
    if (!resposta.ok) throw new Error(dados?.error || 'Erro no servidor.');
    return dados;
};
function esc(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
};