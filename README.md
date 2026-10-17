# spot

r/place copy

A shared drawing canvas that anyone can draw on at the same time, in real time. Instead of placing one pixel at a time like r/place, you draw freehand strokes with a pencil or an eraser on one huge 32768 × 32768 canvas. You can see other people's cursors and names while they draw.

## How it works

**Joining.** You pick a name (up to 24 characters) in the welcome dialog. The Socket.IO handshake rejects connections that have no valid name, and also caps each IP at 8 connections.

**Drawing.** The client sends each stroke to the server as small line segments (`segment:draw`). The server checks each one (hex color, brush size 1–32, segment length up to 1024, coordinates rounded to 1/16 px), rate-limits it with token buckets per socket and per IP, gives it a sequence number, and broadcasts it to everyone. The eraser paints white.

**Tiles.** The world is split into a 64 × 64 grid of 512 px tiles. The client fetches only the tiles it can see (`GET /tiles/:tx/:ty`), as JSON lists of strokes, and renders them on a `<canvas>`. Responses carry an ETag that includes the tile's latest sequence number, so unchanged tiles come back as `304`. Segments that arrive while a tile is still loading are held back, then replayed if they are newer than the loaded tile.

**Overview.** `GET /overview` returns a 1/16-scale PNG of the whole canvas, rendered on the server with `@napi-rs/canvas`. It powers the minimap and the zoomed-out view. Only tiles that changed since the last render are redrawn.

**Persistence.** Strokes stay in memory while they're open. A stroke closes on `stroke:end`, after 5 s idle, or on disconnect. Every 5 s, closed strokes are cut into per-tile runs and written to SQLite in one transaction. On shutdown (SIGINT/SIGTERM) all strokes are flushed.

**Compaction.** Once a tile has collected enough points (at least 4000, and twice as many as at its last compaction), the server rasterizes its strokes from newest to oldest and deletes the ones that are completely hidden by later strokes. It also deletes white (eraser) strokes that cover nothing. This keeps busy tiles from growing forever.

### Controls

| Desktop                  |                         |
| ------------------------ | ----------------------- |
| Pencil / eraser / color picker | keyboard shortcuts (listed in the in-app help) |
| Draw with the other tool | right drag              |
| Resize brush             | Shift + drag            |
| Pan                      | Space + drag, or middle drag |
| Zoom                     | scroll                  |

On mobile, one finger draws, a two-finger drag pans, and pinching zooms. Brush settings, camera and name are saved to `localStorage`.

## Stack

A pnpm workspace with three packages:

| Package   | What                                                                                     |
| --------- | ---------------------------------------------------------------------------------------- |
| `client/` | React 19 + Vite 8 (React Compiler), Tailwind CSS 4, shadcn/ui on Base UI, lucide icons, react-colorful, socket.io-client |
| `server/` | Node 24 running TypeScript directly (no build step), Express 5, Socket.IO, built-in `node:sqlite` (WAL), `@napi-rs/canvas` for the overview PNG |
| `shared/` | Types, Socket.IO event contracts, world/tile constants and geometry helpers used by both sides |

Tooling: TypeScript 6 and Biome.

## Running it

You need Node 24+ (for `node:sqlite` and running `.ts` files natively) and pnpm.

```sh
pnpm install
echo 'PORT=3001' > server/.env
echo 'TRUST_PROXY=1' >> server/.env
echo 'PORT=3001' > client/.env   # tells the Vite dev proxy where the server is
pnpm dev                         # runs client and server in parallel
```

Open the Vite URL (http://localhost:5173). Vite proxies `/socket.io`, `/tiles` and `/overview` to the server.

Server env vars (`server/.env.example`):

| Var           | Meaning                                                         |
| ------------- | --------------------------------------------------------------- |
| `PORT`        | Port for HTTP and Socket.IO                                     |
| `DB_PATH`     | SQLite file, relative to `server/` (default `data/spot.db`)     |
| `TRUST_PROXY` | `1` to read the client IP from `X-Forwarded-For` (Vite proxy or a reverse proxy) |

Other scripts: `pnpm build` (type-checks the server, builds the client into `client/dist`) and `pnpm check` (Biome).

### Docker

The Dockerfile builds the client and runs the server, which also serves `client/dist`. Everything is served on port 3000, with a `/health` check.

```sh
docker build -t spot .
docker run -p 3000:3000 -v spot-data:/app/server/data spot
```

Mount `/app/server/data` so the SQLite database survives restarts.
