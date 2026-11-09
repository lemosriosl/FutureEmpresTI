---
name: imagens-equipamentos
description: Busque, revise e prepare fotos licenciadas para o catálogo do EmpresTI quando a spec pedir uma foto por patrimônio. Use para pesquisa no Pixabay, revisão visual, dimensões e manifesto de créditos. Para ícones e ilustrações de categorias, use ilustracao-equipamento.
---

# Fotos do catálogo

Use o inventário aprovado na [spec 002](../../spec/002-dados-iniciais.md).
Prepare uma foto por patrimônio e entregue os arquivos locais e o manifesto
para o operador publicar no bucket definido na spec.

## Buscar e selecionar

1. Configure `API_KEY_PIXABAY` no `.env` local e faça buscas pontuais por tipo
   de equipamento na raiz do projeto. O script usa `.cache/pixabay/` por 24
   horas.

   ```powershell
   node --env-file=.env skills/imagens-equipamentos/scripts/buscar-pixabay.mjs 'laptop on desk'
   ```

   Para digitar a chave no momento da busca, use o prompt mascarado.

   ```powershell
   Read-Host 'Chave do Pixabay' -MaskInput | node skills/imagens-equipamentos/scripts/buscar-pixabay.mjs 'laptop on desk'
   ```

2. Consulte a página original de cada candidata e confirme a licença.
   Baixe apenas as fotos selecionadas. Use um ID diferente para cada patrimônio
   e confira visualmente se as fotos também são diferentes.
3. Confira pessoas identificáveis, marcas ou logos, texto legível e conteúdo
   de telas, inclusive no recorte final. Rejeite fotos com esses elementos ou
   que não representem o item. Registre o ID e o motivo de cada rejeição.

[Documentação da API](https://pixabay.com/api/docs/) · [Licença do Pixabay](https://pixabay.com/service/license-summary/)

## Preparar e entregar

1. Recorte em 4:3 preservando o equipamento e exporte em JPEG com 800×600 px.
   Use uma ferramenta local de edição disponível no ambiente, como o Paint
   no Windows. Confira as dimensões abrindo o JPEG exportado, pois o filtro
   de busca mede a imagem de origem. Revise visualmente o JPEG final.
2. Registre no manifesto o patrimônio, ID do Pixabay, página original, autor,
   licença e link, data da revisão, nome do arquivo, dimensões e chave do
   objeto conforme a spec. Confira a cobertura exata do inventário e a
   unicidade dos patrimônios e dos IDs das fotos.
3. Entregue os JPEGs e o manifesto ao operador. O bucket público contém
   apenas as fotos licenciadas. A publicação e a verificação de acesso
   anônimo acontecem no ambiente aprovado. O catálogo usa URLs do Storage
   e exibe o crédito **Fotos: Pixabay** com link para o Pixabay.

Use a chave da API somente para a busca local. Mantenha chave, cache e fotos
rejeitadas fora do Git. Os endereços temporários retornados pela API servem
para seleção e download, conforme as regras de hotlinking do provedor.
