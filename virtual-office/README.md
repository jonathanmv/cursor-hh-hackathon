# Virtual Office Builder

A browser-based 3D virtual office builder where you create rooms, place desks, and assign employees. The experience is lightweight and stylized: **isometric camera** and **pixel-art / low-res aesthetic** (rooms.xyz-style), with snap-to-grid placement, limited orbit/pan/zoom, and optional realtime collaboration.

## Features

- **3D Office Builder**: Snap-to-grid layout; place and resize rooms (modular floor tiles + walls), place desks inside rooms
- **Employee System**: Low-poly 3D avatars or billboard sprites; assign employees to desks; status visuals (idle, busy, needs input) via emissive/shader effects and icon billboards
- **Drag & Drop**: Raycast-based drag for rooms, desks, and employees; optional 90° rotation; collision or soft-overlap handling
- **Visual Style**: Isometric view by default (fixed diorama angle); pixel-art / low-res textures and toon lighting; optional pixelation shader for consistent look
- **Camera & Navigation**: Isometric as default; limited orbit/pan/zoom to preserve diorama feel; auto-fit view, smooth transitions between rooms/selection
- **Plans / Limits**: Free plan gating (e.g. max 3 employees); soft gating for extra placement with save/publish restrictions

## Tech Stack

- **Vite + React + TypeScript** – Fast build and type safety
- **Three.js** – WebGL 3D rendering
- **React Three Fiber (R3F)** – React renderer for Three.js (scene + UI composition)
- **Custom GLSL shaders** (optional) – Toon/soft lighting (pixel-art friendly), optional pixelation/upsample, hover highlights, status glow/pulse
- **Zustand** – State management (scene + UI)
- **shadcn/ui + Tailwind CSS** – UI overlay (panels, modals, inspector)
- **GSAP** (optional) – Camera transitions and UI tweens
- **WebSockets** (optional) – Presence and live sync (rooms-like)

Backend (when needed): Node.js (Fastify/Express), WebSocket server (ws/uWebSockets.js), document DB (PostgreSQL JSONB / MongoDB), object storage for GLB/textures.

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

## Usage

1. **Add a Room**: Place rooms on the grid (modular floor + walls); resize as needed.
2. **Add Desks**: Place desks inside rooms (snapped to room-local grid).
3. **Add Employees**: Add employees and assign them to desks via drag & drop.
4. **Navigate**: Use orbit/pan/zoom; use auto-fit to frame the full office.
5. **Realtime** (optional): Collaborate with presence and live sync.

## Project Structure (3D)

```
app/
├── src/
│   ├── components/
│   │   ├── Scene/           – R3F canvas, office scene
│   │   ├── Room.tsx         – 3D room (floor, walls, bounds)
│   │   ├── Desk.tsx         – Desk entity, slot/anchor
│   │   ├── Employee.tsx     – Avatar or billboard, status visuals
│   │   └── UI/              – Toolbar, inspector, modals (shadcn)
│   ├── store/
│   │   └── useOfficeStore.ts – Zustand (scene + UI state)
│   ├── types/
│   │   └── index.ts         – Office, Room, Desk, Employee, transforms
│   ├── hooks/
│   │   └── (camera, raycast, drag)
│   ├── lib/
│   │   └── (shaders, utils)
│   └── assets/
│       └── (gltf/, textures/) – GLB, compressed textures
└── ...
```

## Data Models (summary)

- **Office**: id, ownerId, name, rooms, desks, employees, version, updatedAt
- **Room**: id, name, bounds (width, depth, height), transform, deskIds, optional styleRef
- **Desk**: id, roomId, slotIndex or transform, occupiedBy (employeeId)
- **Employee**: id, name, role, avatarRef, status, deskId, transform

Persistence follows an operations-log pattern (add_room, move_object, assign_employee, etc.) with periodic full snapshots for fast loads.

## Validation & Design Notes

**Tech stack**: The chosen stack (Vite + React + TypeScript, Three.js + R3F, zustand, shadcn/Tailwind, optional GSAP/WebSockets) is well-suited for a 3D office builder. R3F keeps scene and UI in one React tree; GLSL shaders enable stylized lighting and status effects without heavy animation; the operations-log + snapshot pattern supports realtime collaboration and fast loads.

**Visual style (rooms.xyz-inspired)**: The plan includes **isometric camera** as the default view and a **pixel-art / low-res** aesthetic: low-res textures, toon/soft lighting, optional pixelation shader, and consistent pixel-scale grid. Avatar movement and social features (likes, comments, discovery) are out of scope.

## License

MIT
