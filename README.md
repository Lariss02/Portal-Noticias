# Portal-Noticias

Portal web com uma interface de mural de notícias do IFMS e um backend Express conectado ao MongoDB. O repositório contém duas partes em estágios diferentes: a API atualmente iniciada pelo servidor implementa tarefas; a interface e as rotas de notícias representam um fluxo ainda não integrado ao backend ativo.

## Estado atual

- **Backend ativo:** Express 5, MongoDB e endpoints de tarefas em `/tarefas`.
- **Interface:** páginas estáticas de notícias, cadastro/login e perfil em `frontend/`. Elas fazem requisições para `/posts`, `/comentarios` e `/autores`.
- **Integração pendente:** `src/backend/app.js` registra somente `/tarefas` e não serve os arquivos de `frontend/`. Portanto, os fluxos da interface não funcionam com o servidor atual sem implementar e registrar as respectivas rotas e configurar a hospedagem/proxy da interface.
- **Rotas de notícias presentes no código:** `autorRoutes.js`, `postRoutes.js` e `comentarioRoutes.js` não são importadas pelo app ativo e dependem de `../database/db`, arquivo que não existe neste repositório. Elas servem como referência do modelo pretendido, não como endpoints disponíveis.

## Tecnologias

- Node.js com módulos ES (ESM)
- Express 5
- MongoDB com o driver oficial `mongodb`
- HTML, CSS e JavaScript no frontend, sem framework

## Estrutura

```text
frontend/                     Páginas e scripts da interface
	index.html                  Mural de notícias e busca por tag
	cadastro.html               Cadastro e login
	perfil.html                 Perfil, edição de nome e ações de conta
	comum.js                    Requisições HTTP e escape de texto
backend/
	server.js                   Inicialização HTTP e rotas da interface
	database/db.js              Dados em memória
	routes/autorRoutes.js       Rotas de autores
	routes/postRoutes.js        Rotas de posts
	routes/comentarioRoutes.js  Rotas de comentários
```

## Executar localmente

Requisitos: Node.js e npm. O servidor atual mantém seus dados em memória e não precisa de MongoDB nem de variáveis no `.env`.

```bash
npm install
npm start
```

Para desenvolvimento com reinicialização automática:

```bash
npm run dev
```

O servidor fica em `http://localhost:3000`. O arquivo `backend/package.json` mantém as rotas CommonJS compatíveis com o projeto, que usa módulos ES em outros pontos. Os scripts de Docker ainda existem, mas não são necessários para este backend.

## Modelo de dados

### Entidade ativa: Tarefa

Cada documento é armazenado na coleção `tarefas` do banco configurado. O MongoDB usa `_id` internamente; a API o expõe como `id` textual.

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | Identificador do documento MongoDB na resposta da API |
| `titulo` | string | Título aparado; precisa conter pelo menos 3 caracteres |
| `concluida` | boolean | Estado da tarefa; começa como `false` |

### Entidades previstas nas rotas de notícias

As estruturas abaixo são inferidas das rotas e da interface existentes. Elas ainda não são persistidas pelo backend ativo; as rotas de referência usam arrays em memória e não têm o módulo de banco esperado.

| Entidade | Campos observados | Relações e regras observadas |
| --- | --- | --- |
| Autor | `id`, `name`, `email`, `senha`, `nivel` | Níveis: `aluno_comum`, `aluno_lider` e `servidor`. O retorno público também inclui `verificado`, verdadeiro para servidor. E-mail é único na implementação de referência. |
| Post/notícia | `id`, `title`, `content`, `tags`, `autorId`, `semana` | Pertence a um autor; tags são normalizadas para minúsculas e sem duplicatas. Aluno comum não publica; representante pode publicar até 2 posts por semana. |
| Comentário | `id`, `postId`, `autorId`, `texto` | Pertence a um post e a um autor. O retorno da rota adiciona `autorNome` e `verificado`. |

Na referência atual, apenas servidor verificado ou o próprio autor pode apagar posts; apenas servidor ou o autor do comentário pode apagá-lo. A interface mantém o usuário no `localStorage`. Essas regras não substituem autenticação/autorização no servidor. A rota de referência compara senha diretamente e não implementa sessão ou token; ela não deve ser exposta em produção sem revisão de segurança e armazenamento adequado de senhas.

## API ativa: tarefas

Base URL local: `http://localhost:3000/tarefas`.

| Método e caminho | Descrição | Resposta esperada |
| --- | --- | --- |
| `GET /tarefas` | Lista as tarefas | `200` e array de tarefas |
| `POST /tarefas` | Cria uma tarefa | `201` e a tarefa criada |

Exemplo de criação:

```bash
curl -X POST http://localhost:3000/tarefas \
	-H 'Content-Type: application/json' \
	-d '{"titulo":"Estudar"}'
```

Resposta de exemplo:

```json
{
	"id": "ID gerado pelo MongoDB",
	"titulo": "Estudar",
	"concluida": false
}
```

Um título ausente, que não seja texto ou tenha menos de 3 caracteres retorna `400` com `{ "error": "O título deve ter ao menos 3 caracteres." }`. Falhas internas retornam `500`.

## Rotas de notícias previstas

As rotas abaixo são implementadas nos arquivos de referência, mas **não estão disponíveis no servidor ativo**:

| Método e caminho | Operação prevista |
| --- | --- |
| `GET /autores` | Lista autores sem expor senha |
| `POST /autores` | Cadastra autor; níveis privilegiados exigem código de verificação |
| `POST /autores/login` | Valida e-mail e senha |
| `PUT /autores/:id` | Altera o nome do autor |
| `DELETE /autores/:id` | Exclui autor, posts e comentários relacionados |
| `GET /posts?tag=...` | Lista posts, opcionalmente filtrados por tag |
| `POST /posts` | Cria post conforme nível do autor e limite semanal |
| `PUT /posts/:id` | Edita post pelo próprio autor |
| `DELETE /posts/:id?autorId=...` | Exclui post pelo autor ou servidor e remove comentários associados |
| `GET /comentarios` | Lista comentários |
| `POST /comentarios` | Cria comentário para um post existente |
| `DELETE /comentarios/:id?autorId=...` | Exclui comentário pelo autor ou servidor |

## Interface

Abra `frontend/index.html` para inspecionar as páginas estáticas. No estado atual, elas não são servidas por Express e chamam endpoints relativos à origem da página. Para integração local, será necessário servir `frontend/` na mesma origem da API (ou configurar um proxy e as rotas de notícias correspondentes). A interface inclui mural com filtro por tag, cadastro/login, perfil, publicação/edição/exclusão de notícias e comentários conforme o nível do autor.

O título deve conter ao menos 3 caracteres.
