# Restaurante Interativo — Menu 3D com Preview (A-FRAME/WebXR)

## Como correr (mínimo)
1) **Instalar deps**
```bash
npm install
```

2) **Correr em dev**
```bash
npm run dev
```

3) Abrir o URL mostrado (normalmente http://localhost:5173)

> Para testar em **telemóvel**, abre o mesmo URL no telemóvel (mesma rede).  
> Para VR, abre no browser do headset (WebXR).

## Controles
- **UI 3D**: clicar/tocar/laser nos botões (com tooltips ao hover).
- **Preview**: arrastar no prato para rodar, scroll para zoom (desktop).
- **VR**: laser dos controladores; se não houver, gaze com fuse (1s).

## Estrutura
- `src/app/dishFactory.js`: DishFactory + 5 pratos (build/apply/price/stringify)
- `src/app/app.js`: estado do menu, render UI, carrinho e recibo
- `public/assets/sounds`: `click.wav` e `success.wav` (locais)

## Ambiente Restaurante (novo)

Este projeto inclui agora um **ambiente de restaurante completo** construído em A‑Frame. Dentro da `<a-scene>` foi adicionada uma entidade raiz `restaurantWorld` que contém:

- Uma concha de sala (`rw_roomShell`) com tecto texturizado.
- Decoração de chão (`rw_floorDecor`) com piso de madeira e corredor em tecido vermelho.
- Dez mesas (`rw_tables` com IDs `rw_table_T01..T10`) equipadas com cadeiras, pratos, copos, talheres, guardanapos e velas.
- Vinte clientes (`rw_people` com IDs `rw_person_P01..P20`) animados a comer ou conversar, mais quatro elementos de staff (`W1`, `W2`, `B1` e `C1`) que circulam, servem ou trabalham na cozinha.
- Um bar completo (`rw_barArea`) com balcão, prateleiras e alguns adereços, bem como uma cozinha sugerida (`rw_kitchen`).
- Elementos decorativos adicionais (`rw_decor`) como plantas, quadros, sinalética de saída/WC e quadros abstratos.
- Um conjunto de luzes pontuais (`rw_lights`) para iluminar as mesas, bar e cozinha.

Os novos assets SVG utilizados para texturas e sinalética encontram‑se em `public/assets/textures/restaurant/` e são registados no `<a-assets>` com IDs que começam por `rw_tex_`.

## Dicas de performance

Para garantir uma experiência fluida em dispositivos VR e móveis, algumas recomendações:

* Reduzir o número de luzes dinâmicas se a framerate baixar (limite recomendado de 8).
* Diminuir o número de pessoas animadas ou mesas visíveis se necessário.
* Evitar transparências excessivas; apenas copos utilizam `opacity`.
* Manter `npm install` e `npm run dev` para instalar as dependências correctas e lançar o servidor de desenvolvimento.
