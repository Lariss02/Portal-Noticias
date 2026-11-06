# Portal de Notícias IFMS

Aplicação web demonstrativa para publicar notícias e avisos, pesquisar publicações por tags, comentar e administrar um perfil. A interface é servida pelo próprio backend Express, e o frontend acessa a API no mesmo endereço.

## Requisitos

- Node.js 18 ou superior
- npm

## Instalação e execução

Na raiz do projeto, instale as dependências e inicie o servidor:

```bash
npm install
npm start
```

Acesse `http://localhost:3000`. Para usar outra porta, defina a variável de ambiente `PORT` antes de iniciar. Também é possível executar diretamente com `node backend/server.js`.

O banco atual é mantido em memória. Os registros iniciais incluem o servidor de demonstração `patricia@ifms.edu.br`, com senha `123456`; novos cadastros também podem ser feitos pela tela “Entrar”. Todos os dados criados durante a execução são perdidos ao reiniciar o processo.

### Desenvolvimento e scripts disponíveis

`npm run dev` inicia o servidor com `node --watch` para reiniciar após alterações. O script `predev` é executado automaticamente antes dele e chama `npm run db:up`; portanto, esse comando também requer Docker. Os comandos `db:up`, `db:down`, `db:logs` e `db:reset` iniciam, param, exibem logs ou removem um contêiner/volume MongoDB chamado `Portal-Noticias`.

**O backend atual não se conecta ao MongoDB.** Mesmo que o contêiner seja iniciado, autores, notícias e comentários continuam apenas em memória e são perdidos quando o processo Node.js é encerrado. Para executar sem Docker, use `npm start` (ou `node backend/server.js`). `npm test` ainda é apenas um placeholder e termina com erro porque não há testes configurados.

## Funcionalidades

- Cadastro e login por e-mail e senha.
- Publicação de notícias com título, conteúdo e tags opcionais separadas por vírgula.
- Pesquisa de notícias por uma tag, sem diferenciar maiúsculas e minúsculas. As tags são armazenadas em minúsculas, sem espaços nas extremidades e sem duplicatas.
- Comentários em notícias para usuários que entraram pela interface.
- Edição de publicações pelo autor e remoção pelo autor ou por um servidor.
- Edição de nome, encerramento de sessão e exclusão de conta. Excluir uma conta também remove seus posts e comentários.

### Telas e fluxo de uso

- **Mural (`frontend/index.html`)**: lista notícias da mais recente para a mais antiga, permite filtrar por uma tag, mostra comentários e oferece os formulários de publicação/comentário conforme o estado local de login e o nível do usuário.
- **Entrar e cadastro (`frontend/cadastro.html`)**: autentica uma conta ou cria outra. Após o cadastro, a interface inicia sessão automaticamente.
- **Perfil (`frontend/perfil.html`)**: mostra os dados do usuário, permite alterar o nome, sair e excluir a conta.

O navegador guarda o usuário retornado pela API em `localStorage` sob a chave `usuario`. Sair remove esse registro local; não há endpoint de logout nem sessão mantida pelo servidor.

## Entidades

### Autor

Representa uma conta da comunidade. O registro interno contém:

| Campo | Descrição |
| --- | --- |
| `id` | Identificador numérico gerado pelo processo. |
| `name` | Nome exibido no perfil, nas notícias e nos comentários. |
| `email` | E-mail usado no login; o cadastro impede e-mails exatamente iguais. |
| `senha` | Senha fornecida no cadastro, armazenada em texto puro no protótipo. |
| `nivel` | Papel que define as permissões da conta. |

A API não devolve `senha` nas respostas de autor. Os níveis disponíveis são:

| Nível | Permissões |
| --- | --- |
| `aluno_comum` | Comentar em notícias. Não pode publicar. |
| `aluno_lider` | Comentar e publicar até duas notícias por semana. |
| `servidor` | Comentar, publicar e remover notícias ou comentários de outros autores. |

O cadastro de `aluno_lider` e `servidor` exige um código de verificação. No protótipo, os códigos são `LIDER2026` e `SERVIDOR2026`, respectivamente.

### Post (notícia)

Contém `id`, `title`, `content`, `tags` (lista de textos), `autorId` e `semana` (referência usada para limitar publicações de representantes). Nas respostas da API também são incluídos `autorNome` e `verificado`. As tags são separadas por vírgula ao criar/editar e normalizadas removendo espaços nas extremidades, convertendo para minúsculas e descartando valores vazios e duplicados.

### Comentário

Contém `id`, `postId`, `autorId` e `texto`. Nas respostas da API também são incluídos `autorNome` e `verificado`. Comentários pertencem a uma notícia e a um autor.

### Relacionamentos e regras

- Um autor pode criar várias notícias e vários comentários.
- Cada notícia referencia um autor por `autorId` e pode ter vários comentários.
- Cada comentário referencia uma notícia por `postId` e um autor por `autorId`.
- Excluir uma notícia também exclui seus comentários; excluir um autor remove suas notícias e seus comentários.
- Um representante pode publicar no máximo duas notícias por semana (semana calculada em blocos iniciados na segunda-feira UTC); aluno comum não publica. Servidores não têm limite semanal.
- O autor pode editar sua notícia. O autor ou um servidor pode apagar notícia ou comentário.
- A propriedade `verificado` enviada ao cliente é verdadeira somente para nível `servidor`; não é um campo persistido separadamente.

## API

As rotas recebem e retornam JSON, exceto respostas `204`, que não têm corpo. Erros são enviados no formato `{ "error": "mensagem" }`. A API é servida no mesmo host e porta da interface.

| Método e rota | Descrição |
| --- | --- |
| `GET /autores` | Lista autores sem expor senhas. |
| `POST /autores` | Cadastra autor. Campos: `name`, `email`, `senha`, `nivel` (opcional, padrão `aluno_comum`) e `codigo` (para níveis restritos). |
| `POST /autores/login` | Autentica com `email` e `senha`. |
| `PUT /autores/:id` | Atualiza o nome do autor com `name`. |
| `DELETE /autores/:id` | Exclui o autor e suas publicações e comentários. |
| `GET /posts` | Lista notícias; aceita `?tag=eventos` para filtrar por uma tag. |
| `POST /posts` | Cria notícia com `title`, `content`, `tags` e `autorId`. |
| `PUT /posts/:id` | Atualiza `title`, `content` e `tags`; exige `autorId` do autor da publicação. |
| `DELETE /posts/:id?autorId=:id` | Exclui publicação do autor ou de um servidor. Também remove seus comentários. |
| `GET /comentarios` | Lista comentários. |
| `POST /comentarios` | Cria comentário com `postId`, `autorId` e `texto`. |
| `DELETE /comentarios/:id?autorId=:id` | Exclui comentário pelo autor ou por um servidor. |

Os IDs enviados nos corpos ou parâmetros são numéricos. O campo `autorId` em operações de escrita identifica o usuário que a interface afirma estar usando; no protótipo não há autenticação confiável no servidor para confirmar essa identidade. A rota de exclusão de conta retorna `204` mesmo quando o ID não existe. As validações de entrada e de permissão variam por rota; os principais erros retornam `400` (dados obrigatórios ou JSON inválido), `401` (conta ausente/login inválido), `403` (permissão/código), `404` (recurso ausente), `409` (e-mail já cadastrado), `413` (corpo muito grande) ou `422` (limite semanal). Erros inesperados retornam `500`.

### Exemplos de requisição

Criar uma notícia (o `autorId` precisa corresponder a uma conta existente que possa publicar):

```bash
curl -X POST http://localhost:3000/posts \
  -H 'Content-Type: application/json' \
  -d '{"title":"Aviso","content":"Reunião na sexta-feira.","tags":"avisos, eventos","autorId":1}'
```

Pesquisar notícias pela tag:

```bash
curl 'http://localhost:3000/posts?tag=eventos'
```

## Estrutura do projeto

```text
backend/
  database/db.js           Dados em memória e contadores de IDs
  routes/
    autorRoutes.js         Cadastro, login e operações de conta
    postRoutes.js          Listagem, publicação, edição e remoção de notícias
    comentarioRoutes.js    Listagem, criação e remoção de comentários
  server.js                Configuração e inicialização do Express
frontend/
  index.html               Mural e publicação de notícias
  cadastro.html            Login e criação de conta
  perfil.html              Perfil e ações da conta
  comum.js                 Comunicação com a API e escape de texto
  script.js                Lógica do mural e dos comentários
  cadastro.js              Lógica de login e cadastro
  perfil.js                Lógica do perfil
  style.css                Estilos da aplicação
package.json                Scripts e dependências do projeto
```

## Limitações e segurança

Este projeto é um protótipo didático, não um sistema pronto para produção. A autenticação usa dados enviados pelo cliente e não há sessão, token ou autorização robusta: um cliente pode tentar enviar o ID de outro usuário nas operações da API. Os códigos de cadastro e a conta inicial são públicos no código. As senhas são armazenadas sem hash, os dados não são persistidos e não há validação completa de tamanho/formato para todos os campos. A exclusão de uma conta remove suas notícias e comentários escritos por ela, mas não remove comentários de outras pessoas nessas notícias; sem integridade referencial, esses comentários podem ficar sem autor/notícia correspondente. Não use dados ou credenciais reais.

Uma implantação real precisa de banco persistente integrado ao backend, hash de senhas, autenticação e autorização verificadas no servidor, validação de entrada, proteção contra abuso e configuração segura de segredos.
