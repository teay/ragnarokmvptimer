# Cloud-First Data Flow - Technical Documentation

## Overview

This document describes the data flow architecture changes made to support a **cloud-first approach** where Firebase is the primary data source for MVP timer data.

## Data Storage Strategy

### Firebase (Primary - Game Data)

- **MVP Data**: `/parties/<partyName>/<server>/mvps`
- **Solo Data**: `/users/<nickname>/<server>/mvps`
- **Party History**: `/parties/<partyName>/history`

### localStorage (Secondary - User Preferences)

- `settings` - UI preferences, language, server selection
- `theme` - User theme selection
- `nickname` - Saved nickname
- `mvpBackups` - Local backup history

## Data Flow Diagrams

### 1. Add/Edit MVP (Kill, Reset, Edit)

```
User Action → modifyMvps() → saveMvpsToTarget()
                                    ↓
                          Firebase: set(mvps)
```

### 2. Remove Last MVP

```
User clicks "Remove MVP"
         ↓
    activeMvps.length === 1?
         ↓ yes
    setActiveMvps([]) ← UI clears immediately
         ↓
    Firebase: set([]) ← Empty array written
         ↓
    All tabs/devices see empty → UI clears
```

### 3. Auto-Enter Solo Mode

```
User opens app with saved nickname (but no party selected)
         ↓
    partyRoom = null but nickname exists
         ↓
    Auto-uses: /users/<nickname>/<server>/mvps
         ↓
    Loads data from personal Firebase path
```

### 4. Join Party Mode

```
User enters party name + clicks "Join & Sync!"
         ↓
    partyRoom = <partyName>
         ↓
    Uses: /parties/<partyName>/<server>/mvps
         ↓
    Real-time sync with all party members
```

## Key Changes Made

### 1. Firebase Listener (MvpsContext.tsx)

- When Firebase returns `null` or empty array → treat as intentionally empty (no auto-seed)
- Direct path resolution based on `partyRoom` or `nickname`

### 2. Auto-Seed Disabled

**Before**: If Firebase was empty but localStorage had data → auto-upload to Firebase
**After**: If Firebase is empty → show empty, don't restore from localStorage

### 3. Local Storage Cleanup

**Removed**:

- MVP data caching from Firebase listener
- Cache clearing when removing last MVP
- Export/Import buttons in Settings

**Kept**:

- Settings persistence
- Theme persistence
- Backup history (local)

### 4. Clear Data Function

```typescript
// Before: localStorage.clear() - clears EVERYTHING
// After: Selective clearing
export function clearData() {
  localStorage.removeItem(LOCAL_STORAGE_ACTIVE_MVPS_KEY);
  localStorage.removeItem(LOCAL_STORAGE_BACKUPS_KEY);
}
```

## State Indicators

### Online Mode (Firebase)

- Green indicator
- Real-time sync active
- All changes saved to Firebase

### Offline Mode (localStorage - Future)

- Yellow indicator (planned feature)
- Data stored locally
- Will sync when Firebase returns

## Firebase Rules (Recommended)

```json
{
  "rules": {
    "parties": {
      "$partyId": {
        ".read": true,
        ".write": true,
        "metadata": {
          ".validate": "newData.hasChildren(['creator', 'server', 'createdAt'])"
        },
        "history": {
          "$backupId": {
            ".validate": "newData.hasChildren(['timestamp', 'type', 'data'])"
          }
        }
      }
    },
    "users": {
      "$nickname": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

## Future Improvements

### 1. Offline Fallback Mode

When Firebase is down:

- Detect connection timeout (5 seconds)
- Switch to localStorage mode
- Show "Offline" indicator
- Store changes locally
- Sync to Firebase when connection returns

### 2. Conflict Resolution

When multiple users edit simultaneously:

- Last-write-wins (current)
- Or: Show conflict dialog

### 3. History/Audit Trail

- Track who changed what
- Show change history in UI
- Allow restore from any point

## Testing Checklist

### Normal Operation

- [ ] Solo mode loads data from Firebase
- [ ] Party mode syncs between multiple devices
- [ ] Removing last MVP clears all devices
- [ ] Changes persist after refresh

### Offline Scenarios

- [ ] App works when Firebase is down (future)
- [ ] Data syncs when connection returns (future)

### Browser Testing

- [ ] Normal browser mode
- [ ] Incognito mode (separate localStorage)
- [ ] Multiple tabs same browser
- [ ] Different browsers (Chrome, Firefox)

## Benefits of This Approach

1. **Simplicity**: "Delete means delete" - no cache confusion
2. **Consistency**: All devices see the same data
3. **Persistence**: Data survives device changes (just remember nickname)
4. **Collaboration**: Real-time party sync
5. **Personal History**: Solo mode stores data under user's nickname

## Troubleshooting

### "Can't remove last MVP"

- Check Firebase rules allow write access
- Check Firebase console for data
- Check browser console for errors

### "Data not loading"

- Check Firebase console has data
- Check nickname matches
- Check server selection matches

### "Different data on different devices"

- All devices must use same party name
- Or same nickname for solo mode
