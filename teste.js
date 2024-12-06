const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Sessão de usuário
app.use(session({
    secret: 'chatappsecret',
    resave: false,
    saveUninitialized: true
}));

// Banco de dados simulado (em memória)
let users = [];
let messages = [];

// Middleware para verificar se o usuário está logado
function checkLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
}

// Rota de login (GET) - alterado para buscar o arquivo login.html na pasta 'logar'
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'logar', 'login.html'));
});

// Rota POST de login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    // Lógica de autenticação simples: verifique se o usuário e a senha existem
    if (username && password) {
        req.session.user = { username };
        res.redirect('/');
    } else {
        res.redirect('/login');
    }
});

// Função para renderizar o menu
function menu() {
    return `
        <nav class="navbar navbar-expand-lg navbar-light bg-light">
            <div class="container-fluid">
                <a class="navbar-brand" href="#">Menu</a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav">
                        <li class="nav-item">
                            <a class="nav-link" href="/cadastroUsuario">Cadastro de Usuários</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="/chat">Bate-papo</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="/logout">Sair</a>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    `;
}

// Rota principal (Menu)
app.get('/', checkLogin, (req, res) => {
    const user = req.session.user;
    const lastAccess = req.cookies.lastAccess || "Nunca";
    res.cookie('lastAccess', new Date().toLocaleString());
    res.send(`
        <html>
            <head>
                <title>Menu</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
            </head>
            <body>
                ${menu()}
                <div class="container mt-5">
                    <h2>Bem-vindo, ${user.username}</h2>
                    <p>Último acesso: ${lastAccess}</p>
                    <div class="btn-group" role="group" aria-label="Menu de navegação">
                        <a href="/cadastroUsuario" class="btn btn-secondary">Cadastro de Usuários</a>
                        <a href="/chat" class="btn btn-primary">Bate-papo</a>
                        <a href="/logout" class="btn btn-danger">Sair</a>
                    </div>
                </div>
            </body>
        </html>
    `);
});

// Rota de cadastro de usuário
app.get('/cadastroUsuario', checkLogin, (req, res) => {
    res.send(`
        <html>
            <head>
                <title>Cadastro de Usuário</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
            </head>
            <body>
                ${menu()}
                <div class="container mt-5">
                    <h1>Cadastro de Usuário</h1>
                    <form action="/cadastrarUsuario" method="POST">
                        <div class="mb-3">
                            <label for="nome" class="form-label">Nome</label>
                            <input type="text" class="form-control" id="nome" name="nome" required>
                        </div>
                        <div class="mb-3">
                            <label for="dataNascimento" class="form-label">Data de Nascimento</label>
                            <input type="date" class="form-control" id="dataNascimento" name="dataNascimento" required>
                        </div>
                        <div class="mb-3">
                            <label for="nickname" class="form-label">Nickname</label>
                            <input type="text" class="form-control" id="nickname" name="nickname" required>
                        </div>
                        <button type="submit" class="btn btn-primary">Cadastrar</button>
                    </form>
                </div>
            </body>
        </html>
    `);
});

app.post('/cadastrarUsuario', checkLogin, (req, res) => {
    const { nome, dataNascimento, nickname } = req.body;
    if (nome && dataNascimento && nickname) {
        users.push({ nome, dataNascimento, nickname });
        res.send(`
            <html>
                <head>
                    <title>Cadastro Realizado</title>
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
                </head>
                <body>
                    ${menu()}
                    <div class="container mt-5">
                        <h1>Cadastro realizado com sucesso!</h1>
                        <p>Usuários cadastrados:</p>
                        <ul>
                            ${users.map(user => `<li>${user.nome} (${user.nickname})</li>`).join('')}
                        </ul>
                        <a href="/cadastroUsuario" class="btn btn-secondary">Voltar ao cadastro</a><br>
                        <a href="/" class="btn btn-primary">Voltar ao menu</a>
                    </div>
                </body>
            </html>
        `);
    } else {
        res.send(`<h1>Erro no cadastro! Todos os campos são obrigatórios.</h1>`);
    }
});

// Rota do bate-papo
app.get('/chat', checkLogin, (req, res) => {
    res.send(`
        <html>
            <head>
                <title>Bate-papo</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
            </head>
            <body>
                ${menu()}
                <div class="container mt-5">
                    <h1>Bate-papo</h1>
                    <form action="/postarMensagem" method="POST">
                        <div class="mb-3">
                            <label for="usuario" class="form-label">Selecione um usuário:</label>
                            <select class="form-control" name="usuario" required>
                                <option value="">Selecione um usuário</option>
                                ${users.map(user => `<option value="${user.nickname}">${user.nickname}</option>`).join('')}
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="mensagem" class="form-label">Mensagem</label>
                            <textarea class="form-control" id="mensagem" name="mensagem" rows="4" required></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary">Enviar</button>
                    </form>
                    <div class="mt-5">
                        <h3>Mensagens</h3>
                        <ul>
                            ${messages.map(msg => `<li><b>${msg.usuario}:</b> ${msg.texto} <span class="text-muted">[${msg.dataHora}]</span></li>`).join('')}
                        </ul>
                    </div>
                </div>
            </body>
        </html>
    `);
});

// Rota de postagem de mensagem
app.post('/postarMensagem', checkLogin, (req, res) => {
    const { usuario, mensagem } = req.body;
    if (usuario && mensagem) {
        const dataHora = new Date().toLocaleString();
        messages.push({ usuario, texto: mensagem, dataHora });
        res.redirect('/chat');
    } else {
        res.send('<h1>Erro ao enviar mensagem. Tente novamente.</h1>');
    }
});

// Rota de logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.clearCookie('lastAccess');
    res.redirect('/login');
});

// Iniciar o servidor
const port = 3000;
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
