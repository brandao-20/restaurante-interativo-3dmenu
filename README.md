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
