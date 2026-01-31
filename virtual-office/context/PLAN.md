# Virtual Office Builder - Implementation Plan

## Overview
A 2D virtual office builder where users can create rooms, add employees, and assign them to desks with sprite-based character animations.

## Tech Stack
- **Vite + React + TypeScript** - Fast build, type safety
- **@pixi/react** + **pixi.js** - Sprite-based 2D rendering
- **GSAP** - Animations for status states, drag effects
- **zustand** - State management
- **shadcn/ui** - UI components
- **Tailwind CSS** - Styling

## Core Features
- Grid-based office layout (50px grid)
- Drag & drop rooms and employees
- Employee status animations (idle, busy, needs-input)
- Auto-fit canvas view
- Max 3 employees (free plan)

## Data Models

### Employee
- id, name, role, avatarColor, status, deskId

### Room
- id, name, x, y, deskIds

### Desk
- id, roomId, slotIndex, x, y, occupiedBy

## Key Behaviors
- Rooms: 200x150px, 4 slots (2x2 grid)
- Employee placement: left-to-right, top-to-bottom within rooms
- Drag employee between desks = swap if occupied
- Status animations: pulse (idle), work (busy), bounce (needs input)
