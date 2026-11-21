# Identidade Pollo OS

| Arquivo | Uso |
|---|---|
| `pollo-os-icon.svg` | Fonte dos ícones de aplicativo (desktop, extensão). Fundo #CA6E23 com a marca em branco. |
| `../app/src/assets/pollo-os-logo.svg` | Marca dentro do app web e favicon (contorno + ponto em #CA6E23). |

Origem: marca do protótipo Pollo CEO v3 (quadrado arredondado com ponto central).

## Paleta

| Token | Cor | Uso |
|---|---|---|
| Marca | `#CA6E23` | Botões principais, destaques, foco |
| Marca escura | `#94500F` | Texto sobre fundo claro da marca |
| Marca suave | `#F9EDE1` | Item selecionado, realces |
| Fundo | `#FAF9F6` | Página |
| Areia | `#F4F0E9` | Moldura (menu lateral), áreas secundárias |
| Linha | `#E8E2D8` | Bordas |
| Tinta | `#2B201B` / `#5F534C` / `#8E8279` | Texto principal / secundário / discreto |

Fontes: **Inter** (texto) e **Manrope** (títulos).

## Regenerar os ícones

```bash
npx @tauri-apps/cli icon branding/pollo-os-icon.svg -o desktop/src-tauri/icons
```
