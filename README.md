# Script - Automação de Busca

Uma aplicação Next.js 15 com TypeScript para automatização de pesquisas no Google baseadas em nomes de empresas fornecidos em um arquivo Excel.

## Funcionalidades
<!--  -->
- 📤 Upload de arquivos Excel contendo nomes de empresas
- 🔍 Pesquisa automática no Google usando a API Custom Search
- 📊 Retorna até 4 links relevantes por empresa
- 🛡️ Filtragem de domínios indesejados
- 🌐 Suporte a internacionalização (Português e Inglês)
- 📱 Interface responsiva com Tailwind CSS
- 🚀 Otimizado para SSR (Server-Side Rendering)

## Requisitos

- Node.js 18.17.0 ou superior
- Google API Key e Search Engine ID (CX)

## Instalação

```bash
# Instalar dependências
pnpm install

# Executar em modo de desenvolvimento
pnpm dev

# Compilar para produção
pnpm build

# Executar versão de produção
pnpm start
```

## Configuração

Para utilizar a aplicação, você precisará de:

1. Uma chave de API do Google (Google API Key)
2. Um ID de mecanismo de pesquisa personalizado (Custom Search Engine ID)

Estas credenciais podem ser inseridas diretamente na interface da aplicação.

## Estrutura do Arquivo Excel

O arquivo Excel deve conter uma coluna chamada `empresa` com os nomes das empresas que serão pesquisadas.

## Tecnologias Utilizadas

- [Next.js 15](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Hero Icons](https://heroicons.com/)
- [XLSX](https://github.com/SheetJS/sheetjs)
- [Next-Intl](https://next-intl-docs.vercel.app/)

## Licença

[MIT](https://choosealicense.com/licenses/mit/)
