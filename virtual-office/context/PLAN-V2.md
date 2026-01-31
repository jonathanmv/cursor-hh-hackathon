Virtual Office Builder (3D Web Stack) — Revised Implementation Plan

Overview

A browser-based 3D virtual office builder where users create rooms, place desks, and assign employees. The experience is lightweight and stylized: isometric camera, pixel-art / low-res aesthetic (rooms.xyz-style), with fast interactions, snap-to-grid placement, and optional realtime collaboration.

⸻

Visual Style (rooms.xyz-inspired)

Camera
	•	Isometric view as the default: fixed angle looking into the room (e.g. ~30° elevation, 45° azimuth) so the space reads as a “diorama” rather than free orbit.
	•	Orbit/pan/zoom can be limited to preserve the isometric feel (e.g. small orbit range, or switch to “builder” mode with more freedom).
	•	Optional toggle: “Isometric” (fixed) vs “Builder” (full orbit) if needed for placement precision.

Aesthetic
	•	Pixel-art / low-res look:
	•	Low-resolution textures (e.g. 64×64–128×128 per tile) or hand-painted pixel textures for walls, floors, furniture.
	•	Optional: post-process or shader to add a subtle pixelation/nearest-neighbor upsample so the whole scene reads pixelated even if some assets are higher-res.
	•	Toon/soft lighting (existing GLSL): flat shading or limited gradient, no PBR; fits pixel-art and keeps performance good.
	•	Consistent pixel density: grid and objects align to a world-unit step that matches the pixel scale (e.g. 1 unit = 1 “pixel” in asset terms) to avoid blurry edges.
	•	Decorative elements (plants, props, screens) should match the same low-res/pixel style; prefer simple geometry + pixel textures over high-poly.

⸻

Tech Stack

Frontend (3D + UI)
	•	Vite + React + TypeScript
	•	Three.js for rendering (WebGL)
	•	React Three Fiber (R3F) as the React renderer for Three.js (keeps scene + UI composition ergonomic)
	•	Custom GLSL shaders (optional, but recommended) for:
	•	subtle toon/soft lighting (fits pixel-art)
	•	optional pixelation/nearest-neighbor upsample for consistent low-res look
	•	hover highlights
	•	status glow/pulse without heavy animation cost
	•	zustand for state management (local scene state + UI state)
	•	shadcn/ui + Tailwind CSS for UI overlay (panels, modals, inspector, etc.)

Animation
	•	Three.js animation system for skeletal/avatar animations (if using rigged models)
	•	GSAP (optional) for camera transitions and UI-driven tweening (orbit-to, smooth zoom, panel transitions)
	•	For status effects, prefer shader-driven or material/emissive changes for performance.

Realtime (optional but “rooms-like”)
	•	WebSockets for presence + live sync
	•	Client predicts instantly; server validates + broadcasts canonical updates

Backend
	•	Node.js (Fastify or Express) for API
	•	WebSocket server (ws/uWebSockets.js)
	•	DB (document-style works best): PostgreSQL JSONB, MongoDB, or similar
	•	Object storage/CDN for assets (GLB, textures)

Assets & Pipeline
	•	3D assets as glTF/GLB (low-poly; stylized to match pixel-art)
	•	Textures: low-res (e.g. 64×64–128×128) pixel-art style; compressed (KTX2/Basis) once pipeline is stable
	•	Mesh compression (Draco) if needed; keep polycount low
	•	Progressive loading: show “placeholder” geometry while assets stream in

⸻

Core Features (3D version)

Builder
	•	Snap-to-grid layout in 3D (isometric camera by default)
	•	Place and resize rooms (modular floor tiles + walls)
	•	Place desks inside rooms (snapped to room-local grid)
	•	Drag & drop with raycasting:
	•	drag rooms, desks, and employees
	•	rotate objects in 90° increments (optional)
	•	collision constraints (no overlap) or “soft overlap” warnings

Employee System
	•	Employees are simple 3D avatars (low-poly) or billboard sprites (2.5D in a 3D scene)
	•	Assign employees to desks
	•	Status visuals via:
	•	emissive color / shader pulse
	•	icon billboard above head (idle/busy/needs-input)
	•	subtle idle animation (sway/breathe) if using rigs

Camera & Navigation
	•	Isometric as default view (fixed angle); optional limited orbit/pan/zoom to keep diorama feel.
	•	“Auto-fit view” to the full office bounds
	•	Smooth transitions between rooms and selected objects (GSAP or R3F)

Plans / Limits
	•	Free plan: max 3 employees (and/or max objects)
	•	Soft gating: allow extra placement but prevent saving/publishing, or lock extra employees

⸻

Data Models (3D-ready)

Transform (shared)
	•	position: { x, y, z }
	•	rotation: { x, y, z } (or quaternion)
	•	scale: { x, y, z }

Employee
	•	id, name, role
	•	avatarRef (asset id / preset)
	•	status (idle | busy | needs_input)
	•	deskId (nullable)
	•	transform (for transitions / spawn points)
	•	Optional: colorTheme, accessoryRefs

Room
	•	id, name
	•	bounds (width, depth, height)
	•	transform
	•	deskIds: string[]
	•	Optional: styleRef (floor/wall materials), modules (windows/doors)

Desk
	•	id, roomId
	•	slotIndex (if using fixed slots) OR transform (if freely placeable)
	•	occupiedBy (employeeId nullable)
	•	Optional: deskTypeRef

Office (root document)
	•	id, ownerId, name
	•	rooms: Room[]
	•	desks: Desk[]
	•	employees: Employee[]
	•	version (for migration / conflict handling)
	•	updatedAt

⸻

Key Behaviors (rewritten for 3D)

Room Rules
	•	Rooms are modular volumes: floor plane + optional walls
	•	Default size: e.g. 4m x 3m (instead of 200x150px)
	•	Snapping: room origin snaps to global grid (e.g. 0.5m increments)
	•	Optional: resize handles on edges (updates bounds)

Desk Slots

Two good options (pick one; both work with the stack):

Option A — Fixed slots (closest to your original plan)
	•	Each room has a “slot grid” (e.g. 2x2)
	•	Desks snap to slot centers
	•	Employee placement follows slot ordering

Option B — Free placement
	•	Desks can be placed anywhere inside room bounds
	•	Snap to room-local grid
	•	Still allow “logical slots” for ordering if needed

Employee Placement
	•	Drag employee onto a desk:
	•	if desk empty: assign
	•	if occupied: swap occupants (same behavior as before)
	•	Employees visually “snap” to a desk anchor point (small lerp animation)

Status Animations (3D-friendly)
	•	idle: subtle emissive pulse + slow bobbing icon
	•	busy: gentle rotating “work ring” or animated shader stripe
	•	needs_input: attention pulse + brief bounce of icon
All of these can be done with minimal CPU using shader uniforms + small transform tweens.

Interaction & Selection
	•	Raycast hover highlights: outline, rim light, or emissive tint
	•	Selection shows:
	•	transform gizmo (move/rotate)
	•	inspector panel (name, role, status, asset preset)

⸻

Scene Architecture

Rendering Layers
	•	3D canvas: office scene
	•	UI overlay: React DOM (shadcn/tailwind) for tools, inspector, plan gating

State Separation (recommended)
	•	Scene state (zustand): objects, transforms, selection, tool mode
	•	UI state: panels, modals, filters
	•	Network state (if realtime): connection, presence, pending ops queue

Persistence Pattern

Use an “operations log” model (rooms-like) rather than saving full blobs every time:
	•	Client emits ops: add_room, move_object, assign_employee, update_status, etc.
	•	Server validates and broadcasts ops
	•	Periodically server snapshots full office state for fast loads

⸻

Realtime Sync (optional, but aligns with the stack)

Protocol
	•	hello: join office, get snapshot + version
	•	op: apply operation (with idempotency key)
	•	presence: cursor/selection state (optional)
	•	sync: server canonical ops stream

Conflict Handling
	•	Last-write-wins works for simple builders
	•	For transforms, server can accept the latest op and broadcast the canonical transform
	•	For desk occupancy swaps, server enforces atomic swap to avoid split-brain

⸻

Performance & Loading
	•	Use instancing for repeated objects (desks, decorations)
	•	Keep polycount low; prefer stylized materials
	•	Progressive load:
	•	show placeholder geometry for rooms/desks immediately
	•	load GLB avatars and decorative assets asynchronously
	•	Texture/mesh compression once you have enough content to justify it

⸻

Migration Notes from the 2D Plan
	•	“50px grid” becomes world-unit grid snapping (e.g. 0.25m/0.5m).
	•	Sprite animations become:
	•	shader/material effects
	•	billboard icons
	•	optional skeletal loops for avatars
	•	Pixi drag/drop becomes raycast + plane intersection drag logic.


