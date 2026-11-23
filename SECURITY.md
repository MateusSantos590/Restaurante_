# Segurança

## Como reportar uma falha
Envie um e-mail para **seguranca@horadorango.com.br** (EDITAR) descrevendo o problema.
Não divulgue publicamente antes de recebermos e corrigirmos. O mesmo contato está em
`/.well-known/security.txt` (padrão RFC 9116).

## Modelo de ameaças (resumo)
O site é **estático**: não há servidor de aplicação, banco de dados, login nem painel
administrativo. Isso elimina as classes de ataque mais comuns (SQL injection, roubo de
sessão, senha vazada, servidor desatualizado). O que sobra, e como tratamos:

| Risco | Defesa |
|---|---|
| Script malicioso injetado (XSS) | CSP estrita sem `unsafe-inline`/`unsafe-eval`; nenhum script de terceiros; JS nunca usa `innerHTML` com dados digitados |
| Site embutido em outro para enganar cliques (clickjacking) | `frame-ancestors 'none'` + `X-Frame-Options: DENY` |
| Rebaixamento para HTTP / Wi-Fi público | HTTPS obrigatório + HSTS (2 anos, preload) + `upgrade-insecure-requests` |
| Navegador "adivinhando" tipo de arquivo | `X-Content-Type-Options: nosniff` |
| Vazamento de URL para outros sites | `Referrer-Policy: strict-origin-when-cross-origin`; links externos com `rel="noopener noreferrer"` |
| Abuso de câmera/microfone/localização | `Permissions-Policy` bloqueando tudo |
| Spam/robôs no formulário | honeypot, tempo mínimo de preenchimento, intervalo entre envios, validação e limites de tamanho |
| Mensagem com caracteres invisíveis/bidi (golpe visual) | limpeza de caracteres de controle e bidi antes de montar a mensagem |
| Dados pessoais (LGPD) | nada é armazenado; sem cookies; nenhum mapa ou conteúdo do Google embutido; política de privacidade publicada |
| Conteúdo de terceiros embutido | nenhum: `frame-src 'none'`; o mapa abre no Google Maps |
| Arquivos de configuração expostos (Apache) | `.htaccess` bloqueia arquivos ocultos, `.md`, `.json`, `.toml`, listagem de diretório |
| CI comprometido | workflow com `permissions: contents: read` |

## O que continua sendo sua responsabilidade
- Ativar **autenticação em dois fatores** na conta do GitHub, da hospedagem e do registro do domínio (Registro.br).
- Ativar o **bloqueio de transferência** do domínio no Registro.br.
- Nunca colocar senhas, tokens ou `.env` no repositório.
- Depois de publicar, conferir a nota em https://securityheaders.com e https://observatory.mozilla.org (meta: A ou A+).
- Só enviar o domínio para a lista de HSTS preload (hstspreload.org) depois de ter certeza de que **todos** os subdomínios funcionam com HTTPS.
