# Plano de marketing local: Hora do Rango

Objetivo: transformar quem procura "restaurante perto de mim" em quem manda mensagem no WhatsApp ou aparece na porta.
Métrica principal: **mensagens no WhatsApp e rotas pedidas no Google Maps por semana.**

## O que o site já faz por você
| Ação | Onde |
|---|---|
| Botão de WhatsApp em 5 lugares (topo, hero, meio, final, flutuante no celular) | `index.html` |
| A mensagem já sai com o **prato do dia** ("Vi o prato de hoje no site (Feijoada completa)...") | `main.js` |
| Status "Aberto agora / Fechado" e dia atual destacado | `main.js` |
| Botão "Mandar o cardápio para um amigo" (indicação boca a boca) | seção Cardápio |
| Dados estruturados de restaurante + perguntas frequentes (FAQPage) para a busca do Google | `index.html` |
| Imagem própria quando o link é compartilhado | `img/og-image.png` |
| Formulário de encomenda para empresas e eventos | seção Encomendas |

## 1. Google Perfil da Empresa (o que mais traz cliente de bairro)
1. Coloque o **link do site** no perfil (campo "Site") e o botão de WhatsApp.
2. Confira horário (7h30 às 18h20, domingo fechado) e telefone iguais ao site.
3. Suba **fotos reais**: fachada, prato do dia, salão. Mínimo 10; troque algumas todo mês.
4. Publique o prato da semana em "Atualizações" 1 vez por semana.
5. Peça avaliação a quem elogiar no balcão. Responda **todas**, inclusive as ruins, com educação.
6. Link direto para avaliar: no Maps, abra o perfil > "Pedir avaliações" > copie o link e imprima em QR code.

## 2. Links rastreáveis (saber o que funciona)
Use um link diferente em cada lugar, assim você vê de onde vêm os pedidos:

| Onde usar | Link |
|---|---|
| Bio do Instagram | `https://SEU-DOMINIO/?utm_source=instagram&utm_medium=bio` |
| Perfil do Google | `https://SEU-DOMINIO/?utm_source=google&utm_medium=perfil` |
| Panfleto / QR code | `https://SEU-DOMINIO/?utm_source=panfleto&utm_medium=qr` |
| Status do WhatsApp | `https://SEU-DOMINIO/?utm_source=whatsapp&utm_medium=status` |

## 2.1 Medir as conversões
O site registra estes eventos sozinho. Eles ficam no `dataLayer` e não enviam nada para a internet enquanto o Analytics estiver desligado.

| Evento | Quando acontece |
|---|---|
| `whatsapp_click` | clique em qualquer botão de WhatsApp (o campo `link_location` diz qual: cabeçalho, hero, botão flutuante...) |
| `phone_click` | clique em "Ligar" |
| `directions_click` | clique em "Como chegar" |
| `maps_profile_click` | clique para ver a ficha ou as avaliações no Google |
| `share_click` | clique em "Mandar o cardápio para um amigo" |
| `menu_tab_view` | troca de aba do cardápio |
| `form_start`, `form_error` | começou a preencher / errou um campo da encomenda |
| `generate_lead` | formulário de encomenda enviado (a conversão principal) |

**Para ligar a medição no Google Analytics 4:**
1. Crie uma propriedade GA4 e copie o ID (`G-XXXXXXXXXX`).
2. Em `public/js/analytics.js`, preencha `GA4_ID`.
3. Libere o Google nos 4 arquivos de cabeçalhos (`public/index.html`, `public/_headers`, `vercel.json`, `public/.htaccess`): acrescente `https://www.googletagmanager.com` em `script-src` e `https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com` em `connect-src`.
4. Atualize a política de privacidade (o Analytics grava cookies).
5. No GA4, marque `generate_lead` e `whatsapp_click` como "eventos principais" (conversões).

Com o ID preenchido aparece um aviso de cookies e o Google só carrega se o visitante aceitar (LGPD). Quem recusa continua usando o site normalmente.

## 3. Rotina semanal (30 minutos)
| Dia | Ação |
|---|---|
| Domingo | Fotografar o prato de cada dia da próxima semana |
| Segunda | Postar o prato da semana no Instagram e no status do WhatsApp |
| Diário, 10h | Status do WhatsApp com o prato do dia e o link do site |
| Sexta | Responder avaliações da semana |

## 4. Ofertas para testar (uma por vez, 4 semanas cada)
Escolha só o que o restaurante consegue cumprir. Os números abaixo são exemplos, defina os seus.
- **Marmita para equipe:** a partir de X marmitas, desconto ou entrega grátis (use a seção Encomendas).
- **Cartão fidelidade:** a cada 10 pratos, 1 sobremesa ou bebida.
- **Indicação:** quem mandar o cardápio e trouxer um amigo ganha suco.
- **Café da manhã:** se já vendem de manhã (o Maps mostra abertura às 7h30), crie uma seção e divulgue; é um horário com pouca concorrência de restaurante.

## 5. Público e canais
- **Quem compra:** trabalhadores de comércio, escritórios e obras num raio de poucos quarteirões; famílias no sábado.
- **Canais, por ordem de retorno:** Google Maps, WhatsApp (status e grupos de trabalho/condomínio), Instagram, faixa ou placa na fachada com o QR code do site, panfleto em empresas próximas.
- **Parcerias:** deixar cardápio impresso com QR code em lojas, oficinas e escritórios vizinhos, em troca de divulgar a loja deles.

## 6. O que medir todo mês
Mensagens recebidas no WhatsApp Business, cliques em "Como chegar", ligações e visualizações do Perfil Google (aba "Desempenho"), nota média e número de avaliações novas.

## Regras de texto do site
Escreva fato verificável, não adjetivo. "Abre às 7h30" convence mais que "o melhor tempero". Não publique depoimento que o cliente não escreveu nem número que não existe.
