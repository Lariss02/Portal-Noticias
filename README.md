# Portal-Noticias

## Executar localmente

Com o Node.js e as dependências instaladas, inicie o servidor na pasta do projeto:

```bash
node backend/server.js
```

Abra `http://localhost:3000` no navegador. Ao publicar uma notícia, informe tags separadas por vírgulas (opcional), com até 10 tags de 30 caracteres cada. Use a pesquisa do mural para encontrar notícias por uma tag; a busca não diferencia maiúsculas de minúsculas. Também é possível clicar em uma tag exibida no post para filtrar o mural.

Para editar uma notícia, informe no campo “ID do Autor” o mesmo ID usado na publicação e clique em “Editar notícia” no post. O formulário será preenchido com os dados atuais; salve as alterações ou cancele a edição. Como este projeto ainda não tem login, o ID informado identifica o autor apenas para fins de demonstração e não substitui autenticação.

Os dados ficam em memória e são apagados quando o servidor é reiniciado.
