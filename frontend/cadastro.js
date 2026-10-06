async function entrar(email, senha) {
    try {
        const autor = await chamar('/autores/login', { method: 'POST', body: JSON.stringify({ email, senha }) });
        localStorage.setItem('usuario', JSON.stringify(autor));
        location.href = 'index.html';
    } catch (erro) {
        alert(erro.message);
    }
}

function fazerLogin(event) {
    event.preventDefault();
    entrar(document.getElementById('loginEmail').value, document.getElementById('loginSenha').value);
}

async function cadastrar(event) {
    event.preventDefault();
    const email = document.getElementById('cadEmail').value;
    const senha = document.getElementById('cadSenha').value;

    try {
        await chamar('/autores', {
            method: 'POST',
            body: JSON.stringify({
                name: document.getElementById('cadNome').value,
                email,
                senha,
                nivel: document.getElementById('cadNivel').value,
                codigo: document.getElementById('cadCodigo').value
            })
        });
        entrar(email, senha);
    } catch (erro) {
        alert(erro.message);
    }
}