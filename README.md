# WebXR Restaurant Menu

An immersive 3D restaurant menu built for the web with A-Frame and WebXR.

The application lets users explore, customise and order virtual dishes inside an interactive restaurant environment using desktop, mobile or VR controls.

Dish models are generated programmatically from A-Frame primitives and update in real time as menu options change.

## Features

### Interactive 3D Menu

The entire ordering experience is presented through an in-scene 3D interface.

Users can:

- browse dishes by category
- select individual dishes
- customise ingredients and options
- see changes reflected immediately on the 3D model
- view dynamic pricing
- add customised dishes to a cart
- remove cart items
- confirm an order
- generate an in-world receipt

The interface is built directly with A-Frame entities instead of relying on a traditional HTML overlay.

### Procedural Dish Generation

Dish models are created programmatically through a shared `DishFactory` architecture.

Each dish defines:

```text
3D geometry
Default configuration
Available options
Dynamic visual updates
Price calculation
Order description
```

The project currently contains multiple dish variants across categories such as:

- burgers
- pizzas
- steaks
- poke / sushi-style dishes

Options can dynamically affect both appearance and price.

Examples include:

- number of burger patties
- toppings
- sauces
- portion size
- ingredient combinations
- side dishes
- cooking preferences

### Real-Time Customisation

Menu controls are generated from per-dish UI schemas.

Supported control types include:

```text
Toggle
Toggle group
Select
Step slider
```

Changing an option immediately updates:

```text
Application state
3D dish model
Control labels
Visual state
Price
```

This allows each menu item to expose different customisation logic without requiring a separate interface implementation.

### Interactive Dish Preview

Selected dishes can be inspected directly in 3D.

Desktop and mobile users can:

- drag to rotate the dish
- adjust vertical viewing angle
- zoom using the mouse wheel on desktop

The preview also supports automatic rotation when the user is not interacting with it.

### Two Display Modes

Dishes can be viewed in two different contexts.

#### Pedestal Mode

The selected dish is displayed on the restaurant table with automatic rotation.

#### Real-Scale Mode

The dish is moved to a dedicated display position and shown at a larger scale for closer inspection.

### Shopping Cart

Each customised dish can be added to an in-memory cart.

Cart entries preserve:

- dish identifier
- dish name
- selected options
- final price
- human-readable configuration
- timestamp

The interface displays recent items together with a continuously updated order total.

### 3D Receipt

Confirming an order generates a receipt directly inside the 3D scene.

The receipt contains:

- ordered items
- individual prices
- final total
- interactive close action

### Multi-Platform Interaction

The application supports different interaction models depending on the device.

#### Desktop

- mouse interaction
- click-based 3D UI
- drag-to-rotate dish preview
- mouse-wheel zoom

#### Mobile

- touch interaction
- touch-based dish rotation
- browser-based 3D experience

#### VR

- WebXR-compatible headsets
- left and right controller laser interaction
- raycasting against interactive objects
- gaze-based fallback when controllers are unavailable
- controller thumbstick dish rotation

### VR Interaction Fallback

The application detects whether VR controllers are available.

When controllers are present:

```text
Controller
    │
    ▼
Laser ray
    │
    ▼
Interactive 3D UI
```

When they are not detected:

```text
Headset gaze
    │
    ▼
Fuse cursor
    │
    ▼
Interactive 3D UI
```

This allows the menu to remain usable across different WebXR hardware configurations.

### Tooltips and Interaction Feedback

Interactive controls include visual feedback such as:

- hover states
- pressed states
- contextual tooltips
- toast notifications
- click sounds
- success sounds

These interactions are implemented through reusable custom A-Frame components.

### Dynamic UI Layout

Menu panels automatically adapt to their content.

The application dynamically recalculates panel heights for:

- categories
- dishes
- customisation options
- cart contents

Panels are then repositioned to reduce overlap as content changes.

## Immersive Restaurant Environment

The menu is placed inside a complete virtual restaurant scene.

The environment includes:

- restaurant room geometry
- textured floor and ceiling
- dining tables
- chairs
- plates
- glasses
- cutlery
- napkins
- candles
- bar area
- kitchen area
- decorative elements
- plants
- artwork
- signage
- dynamic lighting

### Virtual Characters

The restaurant also contains animated characters, including:

- seated customers
- restaurant staff
- bar staff
- kitchen staff

Character animations create additional movement and atmosphere throughout the environment.

## Tech Stack

### 3D / XR

- A-Frame
- WebXR
- Three.js through A-Frame

### Frontend

- JavaScript
- HTML
- CSS

### Tooling

- Vite
- npm

### Interaction

- A-Frame custom components
- raycasting
- WebXR controller input
- gaze interaction
- pointer events
- touch events

## Architecture

```text
┌──────────────────────────────┐
│         A-Frame Scene        │
│                              │
│ Restaurant Environment       │
│ Camera / VR Rig              │
│ 3D Menu Interface            │
└───────────────┬──────────────┘
                │
                ▼
┌──────────────────────────────┐
│       Application State      │
│                              │
│ Selected Dish                │
│ Current Options              │
│ Category                     │
│ Cart                         │
│ Presets                      │
│ View Mode                    │
└───────────────┬──────────────┘
                │
       ┌────────┴────────┐
       │                 │
       ▼                 ▼
┌──────────────┐   ┌────────────────┐
│ Dish Factory │   │ 3D UI System   │
│              │   │                │
│ Build Models │   │ Buttons        │
│ Apply Options│   │ Toggles        │
│ Price Logic  │   │ Selectors      │
│ Descriptions │   │ Sliders        │
└──────┬───────┘   └───────┬────────┘
       │                   │
       └─────────┬─────────┘
                 ▼
        ┌─────────────────┐
        │ Updated 3D Menu │
        │                 │
        │ Dish Preview    │
        │ Price           │
        │ Cart            │
        │ Receipt         │
        └─────────────────┘
```

## Dish Architecture

Each dish implementation follows a common interface:

```text
buildEntity()
applyOptions()
computePrice()
stringifyOptions()
defaultOptions
uiSchema
```

### `buildEntity()`

Constructs the dish from A-Frame entities and primitives.

### `applyOptions()`

Updates the generated 3D object according to the current configuration.

This can change properties such as:

- visibility
- geometry
- colour
- scale
- position
- ingredient composition

### `computePrice()`

Calculates the final price from the selected options.

### `stringifyOptions()`

Produces a compact human-readable description for the cart and receipt.

### `uiSchema`

Defines which controls should be automatically generated for the dish.

This keeps the menu system extensible: new dishes can provide their own geometry, pricing rules and configuration schema while reusing the same application interface.

## Interaction Architecture

Reusable A-Frame components provide the interaction layer.

### `ui-action`

Converts 3D object interaction into application actions.

### `ui-hoverable`

Handles:

- default state
- hover state
- pressed state

### `ui-tooltip`

Displays contextual information when interactive controls are hovered.

### `toast-system`

Shows temporary in-scene feedback messages.

### `dish-orbit-controls`

Handles:

- automatic rotation
- pointer dragging
- touch dragging
- pitch limits
- zoom
- VR thumbstick rotation

### `vr-cursor-fallback`

Detects VR controller availability and enables gaze interaction when necessary.

## Application Flow

```text
Select Category
      │
      ▼
Select Dish
      │
      ▼
Generate 3D Dish
      │
      ▼
Customise Options
      │
      ├──────────────► Update 3D Model
      │
      └──────────────► Recalculate Price
      │
      ▼
Add to Cart
      │
      ▼
Review Order
      │
      ▼
Confirm
      │
      ▼
Generate 3D Receipt
```

## Project Structure

```text
webxr-restaurant-menu/
├── public/
│   └── assets/
│       ├── sounds/
│       └── textures/
├── src/
│   ├── app/
│   │   ├── app.js
│   │   ├── audio.js
│   │   ├── components.js
│   │   ├── dishFactory.js
│   │   ├── ui.js
│   │   └── utils.js
│   └── main.js
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

## Getting Started

### Requirements

- Node.js
- npm
- a modern WebGL-compatible browser

For the VR experience, use a WebXR-compatible browser and headset.

## Installation

Clone the repository:

```bash
git clone https://github.com/brandao-20/webxr-restaurant-menu.git
cd webxr-restaurant-menu
```

Install the dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the URL shown by Vite, usually:

```text
http://localhost:5173
```

## Production Build

Create a production build with:

```bash
npm run build
```

Preview the generated build:

```bash
npm run preview
```

## Mobile Testing

To test the application on a mobile device, run the development server on a network-accessible host and open it from a device on the same network.

Touch interaction can be used to rotate the dish preview.

## VR Testing

Open the application in a WebXR-compatible headset browser.

The scene supports:

```text
Left controller laser
Right controller laser
Gaze fallback
```

Only entities marked as interactive are targeted by the VR raycasters.

## Performance Considerations

Immersive browser experiences are highly dependent on device performance.

The restaurant scene contains multiple animated entities, lights and transparent materials, so lower-powered mobile or standalone VR devices may require reducing scene complexity.

Potential optimisations include:

- reducing dynamic light count
- reducing animated characters
- reducing simultaneously visible objects
- limiting transparent materials
- simplifying procedural geometry

## Design Goals

### One Interface Across Devices

The same 3D menu should remain usable with mouse, touch, VR controllers or gaze.

### Immediate Visual Feedback

Dish customisation should modify the actual 3D representation instead of only changing text labels.

### Reusable Interaction Components

Buttons, tooltips, controls and feedback systems are implemented as reusable A-Frame components.

### Data-Driven Menu Generation

Dish-specific configuration is separated from the common menu logic through schemas and a shared dish interface.

### Immersive Context

The application places the ordering experience inside a restaurant environment rather than presenting isolated 3D objects.

## Limitations

- The restaurant and food models are primarily constructed from procedural A-Frame geometry rather than production-grade photorealistic assets.
- Cart and preset state are stored in memory and are not persisted after the page is reloaded.
- The project does not include a backend or real payment workflow.
- Performance depends strongly on the browser, device and WebXR implementation.
- VR behaviour may vary between headset browsers and controller implementations.

## Purpose

This project explores:

- WebXR
- immersive web interfaces
- procedural 3D modelling
- device-independent interaction
- VR controller input
- gaze interaction
- dynamic UI generation
- real-time 3D customisation
- application state inside an immersive scene

It is presented as a portfolio project focused on interactive 3D web development and immersive user experiences.
