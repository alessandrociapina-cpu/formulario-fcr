# FCR Vistoria — Formulário de Conformidade da Reposição

PWA (Progressive Web App) para preenchimento do Formulário de Conformidade da Reposição (FCR) em campo, substituindo a planilha Excel utilizada pelos fiscais da ARSESP.

## Funcionalidades

- **Wizard em 6 passos**: Cabeçalho → Fotos → Grupo 1 → Grupo 2 → Grupo 3 → Revisão
- **Extração automática de GPS e data** a partir dos metadados EXIF das fotos tiradas em campo
- **Botões touch-friendly** para avaliação: ATENDE / NÃO ATENDE / N/A
- **Cálculo de pontuação em tempo real** por grupo e para o formulário completo (ponderado por pesos)
- **Justificativa condicional** obrigatória nos itens com "CASO NEGATIVO, JUSTIFIQUE"
- **Funcionamento offline** via Service Worker + IndexedDB (salva rascunhos automaticamente)
- **Exportação local**: gera PDF estruturado + JSON sem envio para servidor
- **Instalável** como app nativo em Android e iOS

## Grupos de Avaliação

| Grupo | Itens | Pontos Máx. |
|---|---|---|
| 1. Leito Carroçável | 16 (3 informativos) | 33 |
| 2. Passeio / Piso Especial | 17 (3 informativos) | 31 |
| 3. Sinalização Viária | 3 | 5 |

## Fórmula de Pontuação

```
Conceito do Grupo = Σ(peso_i × nota_i) / Σ(peso_i)   [itens avaliados, excluindo N/A]
Conceito do Formulário = média ponderada dos grupos avaliados (grupos 100% N/A são ignorados)
```

## Desenvolvimento

```bash
npm install
npm run dev
```

## Build e Deploy

O deploy é automático via GitHub Actions para GitHub Pages ao fazer merge na branch `main`.

```bash
npm run build    # gera dist/
npm run preview  # preview local do build
```

Após ativar o GitHub Pages (source: GitHub Actions), o app ficará disponível em:
`https://alessandrociapina-cpu.github.io/formulario-fcr/`
