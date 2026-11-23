# Plano de marketing local: Casa de Carnes RB

Objetivo: virar o açougue que o bairro lembra quando vai fazer churrasco.
Métrica principal: **ligações, mensagens e rotas pedidas por semana.**

## O que encontramos no Google Maps (23/11/2026)
| Situação | Por que importa | O que fazer |
|---|---|---|
| A ficha aparece como **"Reivindicar esta empresa"** | Ninguém administra o perfil: qualquer pessoa pode sugerir mudanças, e o dono não responde avaliações | O dono reivindica a ficha e verifica (Perfil da Empresa no Google) |
| Categoria cadastrada: **"Supermercado"** | Quem busca "açougue perto de mim" pode não encontrar a loja | Categoria principal "Açougue"; secundária "Loja de carnes", se fizer sentido |
| Sem site na ficha | O Google mostra "Adicionar website" | Colocar o link deste site |
| Poucas ou nenhuma foto do dono | Foto de balcão e de carne vende | Subir fachada, balcão, cortes, estacionamento |
| Google mostra domingo até 14h; os encartes da loja dizem domingo e feriados até 13h | Cliente que chega às 13h30 encontra a porta fechada | Corrigir o horário no Google (o site já usa 13h) |
| Nota 4,1 | Boa, mas dá para subir respondendo e pedindo avaliações | Responder todas e pedir avaliação no balcão |

## O que o site faz para vender
1. **Calculadora de churrasco**: a pessoa diz quantos vão e recebe a lista por tipo de carne. Um botão manda a lista pronta. É o principal gerador de pedido grande.
2. **"Preço de hoje" em cada corte**: o cliente pergunta o preço do corte específico, sem o site precisar mostrar preço desatualizado.
3. **Aberto agora / fechado**, com o dia atual destacado no horário.
4. **Aberto domingo de manhã** em destaque: é quando o churrasco é decidido.
5. Barra fixa no celular com **Ligar** e **Calcular churrasco**.

## Cardápio com preços
O site mostra os 25 itens dos encartes do Facebook (out/2025) com o preço da última oferta e um aviso para confirmar o valor do dia. A cada novo encarte, atualize os preços em `public/index.html` (seção `#cortes`) e a data na nota abaixo da lista.

## Rotina semanal (30 minutos)
| Quando | Ação |
|---|---|
| Quinta | Post no status do WhatsApp e no Google: "Separe a carne do churrasco de sábado" com o link da calculadora |
| Sexta | Foto do balcão cheio no status e no Google |
| Sábado e domingo de manhã | Status: "Aberto hoje até 20h / até 14h" |
| Segunda | Responder avaliações da semana |

## Ideias de oferta (testar uma por vez)
Os valores são do dono. Só ofereça o que a loja consegue cumprir.
- **Kit churrasco** por número de pessoas (a calculadora já monta a lista).
- **Corte do dia** com preço especial, anunciado só no WhatsApp.
- **Carne moída na hora** como diferencial (se for verdade na loja).
- **Cartão fidelidade** para quem compra toda semana.

## Medição
Os eventos já estão no site (veja o README). Para o GA4: preencha `GA4_ID` em `public/js/analytics.js`, libere `https://www.googletagmanager.com` no `script-src` e os domínios do Google Analytics no `connect-src` (em `index.html`, `_headers` e `.htaccess`), atualize a política de privacidade e marque `generate_lead`, `phone_click`, `whatsapp_click` e `price_request_click` como eventos principais.

## Regras de texto
Fato verificável, sem adjetivo vazio. "Aberto domingo até 14h" vende mais que "a melhor carne da região". Nada de depoimento inventado nem preço que o balcão não pratica.
