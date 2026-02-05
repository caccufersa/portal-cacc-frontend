# Portal CACC Frontend

Este repositório contém o front-end em Next.js do portal do Centro Acadêmico de Ciência da Computação da UFERSA. O foco é reproduzir uma experiência gráfica inspirada no Windows 95 com conteúdo institucional e utilitários para calouros, membros e visitantes.

## Começando

Instale as dependências e execute o servidor de desenvolvimento local:

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador para visualizar o projeto. Qualquer alteração em `src/` ou `app/` atualiza a página automaticamente.

## Estrutura principal

- `app/` — rotas e layout do Next.js (app directory).
- `src/components/` — componentes reutilizáveis como a Taskbar, janelas e diálogos.
- `src/content/` — blocos de conteúdo (ex.: guias e textos fixos).
- `public/` — ativos públicos como ícones, fontes e favicon.

## Miniguia de Contribuição de Páginas

1. **Planeje o conteúdo**: defina o que será exibido, título, textos e quaisquer ícones necessários.
2. **Crie o componente**: adicione o conteúdo em `src/content/` ou `src/components/` conforme o caso.
3. **Registre a página**:
   - Se for uma rota nova, crie pasta dentro de `app/` com `page.tsx`.
   - Importe o componente e renderize dentro de `export default function Page()`.
4. **Estilize com módulos CSS** (`*.module.css`) ou classes globais em `src/styles`.
5. **Teste localmente**: verifique em `npm run dev` e certifique-se de que a página aparece e responde conforme esperado.
6. **Atualize ícones/metadados** se necessário (ex.: favicon em `public/`, metadata em `src/app/layout.tsx`).

Pronto! Faça um Commit com mensagem clara e abra um PR descrevendo a nova página.# Portal CACC Frontend

Este repositório contém o front-end em Next.js do portal do Centro Acadêmico de Ciência da Computação da UFERSA. O foco é reproduzir uma experiência gráfica inspirada no Windows 95 com conteúdo institucional e utilitários para calouros, membros e visitantes.

## Começando

Instale as dependências e execute o servidor de desenvolvimento local:

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador para visualizar o projeto. Qualquer alteração em `src/` ou `app/` atualiza a página automaticamente.

## Estrutura principal

- `app/` — rotas e layout do Next.js (app directory).
- `src/components/` — componentes reutilizáveis como a Taskbar, janelas e diálogos.
- `src/content/` — blocos de conteúdo (ex.: guias e textos fixos).
- `public/` — ativos públicos como ícones, fontes e favicon.

## Miniguia de Contribuição de Páginas

1. **Planeje o conteúdo**: defina o que será exibido, título, textos e quaisquer ícones necessários.
2. **Crie o componente**: adicione o conteúdo em `src/content/` ou `src/components/` conforme o caso.
3. **Registre a página**:
   - Se for uma rota nova, crie pasta dentro de `app/` com `page.tsx`.
   - Importe o componente e renderize dentro de `export default function Page()`.
4. **Estilize com módulos CSS** (`*.module.css`) ou classes globais em `src/styles`.
5. **Teste localmente**: verifique em `npm run dev` e certifique-se de que a página aparece e responde conforme esperado.
6. **Atualize ícones/metadados** se necessário (ex.: favicon em `public/`, metadata em `src/app/layout.tsx`).

Pronto! Faça um Commit com mensagem clara e abra um PR descrevendo a nova página.