# Firebase Integration — Full Implementation Summary

## Architecture

Rust GUI app syncs MVP timer data with Firebase Realtime Database (RTDB) using the same path structure and format as the webapp, enabling cross-platform real-time sharing.

## Credentials (hardcoded in `app.rs`)

| Field | Value |
|---|---|
| Database URL | `https://ragnarokmvptimer-ace0a-default-rtdb.asia-southeast1.firebasedatabase.app` |
| API Key | `AIzaSyB5dlmAu0_yThhHr8_qNHDlfe1o40rQ69U` |

## Database Path

```
/hunting/solo/{nickname}/{server}/mvps       # Solo mode
/hunting/party/{partyRoom}/{server}/mvps     # Party mode
```

## Data Format

```json
[{
  "id": 1147,
  "deathTime": "2025-07-20T12:00:00.000Z",
  "deathMap": "prt_fild01",
  "deathPosition": { "x": 120.5, "y": 240.3 },
  "isPinned": false,
  "updatedBy": "PlayerName"
}]
```

Only `id`, `deathTime`, `deathMap`, `deathPosition`, `isPinned`, `updatedBy` are stored. Name/spawn/stats come from local `data/{server}.json`.

## Files

### New

| File | Purpose |
|---|---|
| `src/firebase/client.rs` | Firebase REST API client: `FirebaseMvp` struct, `FirebaseClient` (sign-in, read, write), `to_firebase`/`from_firebase`/`merge_firebase_into_mvp`/`get_firebase_path` |
| `src/firebase/sync.rs` | `FirebaseSync` struct — path management, `pull()`/`push()`, `merge_firebase_data()` |
| `src/firebase/mod.rs` | Module re-exports |
| `FIREBASE.md` | Initial docs |

### Modified

| File | Changes |
|---|---|
| `src/app.rs` | All Firebase logic + debug viewer |

## `app.rs` Changes (chronological)

### 1. Fields added to `MvpTimerApp`

- `fb_sync: Option<FirebaseSync>` — cached sync handle
- `tokio_runtime: Option<Runtime>` — for async Firebase ops
- `fb_poll_data: Arc<Mutex<Option<Vec<Mvp>>>>` — shared buffer for poller
- `fb_poll_active: bool` — avoid duplicate pollers
- `show_fb_debug: bool` — debug panel toggle
- `fb_logs: Vec<String>` — in-app log buffer
- `fb_log_shared: Arc<Mutex<Vec<String>>>` — shared log buffer for background tasks

### 2. `init_firebase()`

- Creates `FirebaseSync` with current nickname/server/party
- Signs in anonymously (Firebase Auth REST API `identitytoolkit.googleapis.com`)
- `block_on(pull())` — fetches remote MVPs, rehydrates with local data via `rehydrate_saved()`
- Starts background poller (tokio task, every 5s):
  - Signs in once
  - Loops: sleep 5s → pull → write to `fb_poll_data`
  - Logs via shared buffer
- Called when: nickname set, server changed, party changed, "Refresh Now" button

### 3. `push_to_firebase()`

- Called from `persist()` after local save
- Clones data, spawns async task:
  - Creates fresh `FirebaseSync` (sign-in each time)
  - Pushes all active MVPs as FirebaseMvp array
  - Logs result via shared buffer

### 4. Poll Data Consumption (in `update()`)

- Locks `fb_poll_data` in separate scope, takes `Option`
- If data exists: `rehydrate_saved()` → replace `self.active_mvps`
- Uses separate scope to avoid borrow conflicts with `fb_log_str()`

### 5. `persist()`

- Saves to local file
- Calls `push_to_firebase()` — pushes to Firebase asynchronously
- Called on: kill, edit, remove, back-to-wait, pin, unpin

### 6. Settings Modal

- Firebase Debug toggle button opens debug panel
- `/hunting/solo` or `/hunting/party` path displayed
- Logout clears `fb_sync`

### 7. Debug Log System

- `fb_log_str(&mut self, msg: &str)` — adds to `fb_logs` + `log::warn!`
- `drain_shared_logs(&mut self)` — drains background task logs into `fb_logs`, called at top of `update()`
- Background poller/push tasks use `add_log` closure on `Arc<Mutex<Vec<String>>>`
- `show_fb_debug_window(ctx)` — scrollable debug panel:
  - Color-coded: red for FAILED/error, green for OK/pulled, gray for info
  - "Clear" button, "Refresh Now" button
  - Log count display
  - Sticks to bottom

## Key Design Decisions

| Decision | Rationale |
|---|---|
| Fresh sign-in on every push | Simplifies code; sign-in is fast (~200ms) |
| `block_on` for init pull | Simpler than async init; brief UI freeze (~500ms) |
| Separate poller with shared buffer | Async loop writes to `Arc<Mutex>`; consumed in `update()` each frame |
| Clone settings before Firebase ops | Avoids borrow checker conflicts with `self.fb_log_str()` |
| `rehydrate_saved()` for merge | Reuses existing logic; merges Firebase data with local spawn/stats/name |

## Borrow Checker Fixes

- Poll data lock: extracted to separate `let poll_data = ...;` before calling `self.fb_log_str()`
- Init firebase: clone nickname/server/party before creating `FirebaseSync` (was borrowing `self`)
- Background tasks: clone all captured data, use shared log buffer (not `self`)

## Current Limitations (TODO)

- No cached idToken — signs in on every push
- No retry on failure
- No conflict resolution (last-write-wins)
- Brief UI freeze on init pull (`block_on`)
