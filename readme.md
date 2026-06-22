# Planejador de Viagem - Manual do Usuário

## Índice
- Visão Geral
- Primeiros Passos
- Funcionalidades
  - Calendário e Dias
  - Países e Atividades
  - Passeios
  - Links
  - Hotéis
  - Mapa
  - Guia Diário
- Dicas e Truques

---

## Visão Geral

O Planejador de Viagem é uma aplicação web completa para organizar todos os aspectos da sua viagem. Com ele você pode:

- Planejar atividades dia a dia
- Organizar visitas por países/cidades
- Gerenciar passeios e excursões
- Salvar links importantes (passagens, reservas, etc.)
- Controlar check-in/check-out de hotéis
- Visualizar tudo em um mapa interativo
- Gerar um guia diário pronto para imprimir

---

## Primeiros Passos

1. Abra o sistema no seu navegador
2. Navegue pelo calendário usando as setas para escolher o mês
3. Clique em um dia para começar a planejar
4. Adicione um país clicando no botão "+ Adicionar país"
5. Preencha as atividades dentro de cada país

Todos os dados são salvos automaticamente no seu navegador (localStorage). Não é necessário login ou cadastro.

---

## Funcionalidades

### Calendário e Dias

O calendário fica na barra lateral esquerda e mostra:
- Dias com bolinha verde: possuem itens planejados (países, passeios ou hotéis)
- Dia selecionado: destacado em verde
- Hoje: indicado em negrito

#### Gerenciar Dias
- Lista de dias: abaixo do calendário, mostra todos os dias que têm conteúdo
- Remover dia: passe o mouse sobre um dia e clique no X para apagar todo o conteúdo daquele dia
- Navegação: use as setas para mudar o mês

---

### Países e Atividades

Cada dia pode ter múltiplos países/cidades, e cada país pode ter várias atividades.

#### Adicionar País
1. Selecione um dia no calendário
2. Clique em "+ Adicionar país"
3. Digite o nome do país/cidade
4. Clique na bandeira para mudar o emoji (20 opções disponíveis)

#### Localização no Mapa
- Campo de localização: digite cidade, endereço ou ponto turístico
- Fixar pin: clica em "Fixar pin" para buscar coordenadas automaticamente
- O ícone de localização fica verde quando o local está geocodificado

#### Atividades
Para cada país, você pode adicionar:
- Passeios: pontos turísticos, excursões
- Ônibus: traslados, transporte entre cidades
- Refeições: restaurantes, almoços
- Hotéis: hospedagens (também gerenciáveis na aba Hotéis)
- Personalizado: qualquer outro tipo (ex: Trem, Voo, etc.)

Funcionalidades das atividades:
- Definir horário
- Adicionar descrição
- Categorizar por tipo (com filtros)
- Reordenar arrastando (drag & drop)
- Clique na atividade para ver detalhes em modal
- Editar descrição no modal

#### Filtros
Quando há muitas atividades, use a barra de filtros para mostrar apenas:
- Passeios
- Ônibus
- Refeições
- Hotéis
- Ou um tipo personalizado

#### Duplicar País
- Clique em "Duplicar para os próximos dias"
- Escolha quantos dias (atalhos: +1, +3, +7)
- Ou selecione uma data final específica
- Copia nome, localização, pin do mapa e todas as atividades

---

### Passeios

A aba Passeios centraliza todos os passeios da viagem.

#### Criar Passeio
1. Clique em "+ Adicionar passeio"
2. Preencha:
   - Nome: nome do passeio
   - Horário: quando acontece
   - Dia vinculado: associe a um dia do calendário
   - Link: URL do site, reserva ou informações
   - Localização: ponto de encontro
   - Descrição: notas detalhadas
3. Fixar pin: adiciona ao mapa

#### Gerenciar
- Filtrar por dia: veja apenas passeios de um dia específico
- Abrir link: botão de link externo abre o site em nova aba
- Banners no dia: quando vinculado a um dia, aparece como banner na aba Dias

---

### Links

Guarde todos os links importantes da viagem:

#### Tipos de Links
- Transporte: passagens aéreas, passagens de ônibus
- Hotel: sites de reserva
- Passeio: ingressos, informações turísticas
- Info: informações gerais
- Outro: qualquer outro link

#### Funcionalidades
- Vincular a um dia: associe links a dias específicos
- Adicionar anotações: notas sobre cada link
- Abrir direto: botão externo para abrir o link
- Filtrar por tipo: veja apenas links de uma categoria

---

### Hotéis

Gerencie todas as hospedagens:

#### Informações do Hotel
- Nome: nome do hotel
- Endereço: localização completa
- Link: site ou booking
- Anotações: número da reserva, códigos, observações

#### Check-in / Check-out
- Vincular a um dia: selecione o dia exato no calendário
- Definir horário: hora prevista de check-in e check-out
- Banners automáticos: aparecem na aba Dias nas datas corretas
- Pin no mapa: geocodifique o endereço para ver no mapa

---

### Mapa

Visualização geográfica de toda a viagem:

#### O que aparece no mapa
- Verde: países/cidades com pin fixado
- Azul: mesmo local visitado em vários dias
- Roxo: passeios (pontos de encontro ou locais)
- Vermelho: hotéis (endereços das hospedagens)

#### Funcionalidades
- Clique nos pins: veja informações detalhadas
- Popup com links: clique para ir ao dia ou entidade correspondente
- Zoom automático: o mapa se ajusta para mostrar todos os pins
- Legenda: explicação das cores no topo do mapa

---

### Guia Diário

Resumo completo pronto para imprimir:

#### O que contém
- Todos os dias planejados em ordem
- Países e cidades visitados
- Passeios com destaque (borda colorida)
- Check-in/check-out de hotéis
- Horários de cada atividade
- Descrições e observações

#### Imprimir
- Clique no botão Imprimir
- O guia é formatado para impressão (apenas o conteúdo relevante)
- Ideal para levar na viagem ou compartilhar com companheiros

---

## Dicas e Truques

### Organização Eficiente
1. Planeje na ordem: dias, depois países, depois atividades, depois hotéis
2. Use as cores: categorize cada atividade para filtrar depois
3. Vincule tudo: passeios e links a dias específicos para referência rápida
4. Geocodifique: fixe pins no mapa para ter visão espacial da viagem

### Atalhos
- Duplicar país: útil para estadias de vários dias na mesma cidade
- Drag & drop: reordene atividades arrastando
- Clique na atividade: abre modal com todos os detalhes
- Banners: navegação rápida entre dias e entidades relacionadas

### Backup
- Os dados ficam no localStorage do navegador
- Para backup, exporte/importe os dados (funcionalidade futura)
- Limpeza de cache do navegador pode apagar os dados

---

## Suporte

Este sistema é auto-contido e funciona offline após o primeiro carregamento. Todos os dados são armazenados localmente no seu dispositivo.

Formatos suportados nos campos:
- URLs: com ou sem https://
- Horários: formato 24h (HH:MM)
- Datas: seleção via calendário ou dropdown