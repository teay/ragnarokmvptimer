# TODO - Ragnarok MVP Timer

## Status Overview 📊

### Done ✅ (Completed Tasks)

**Core & Web App:**
- [x] Cloud-first data flow (Firebase primary source of truth)
- [x] Solo/Party mode implementation
- [x] Firebase path structure: `hunting/solo/` and `hunting/party/`
- [x] Fixed MVP Sorting Logic (Soonest respawn always first)
- [x] Improved `rehydrateMvps` to support CLI-to-Web data consistency
- [x] Web: Sorted Active/Pinned lists to prioritize soonest respawn

**CLI Version (Terminal UI):**
- [x] Real-time data synchronization via Firebase SDK (`onValue`)
- [x] Auto-save to Firebase on every update (Toggling, Killing, Editing)
- [x] Smart Merge: Preserve web metadata & avoid data duplication
- [x] Support for Multi-spawn MVPs (Shown as separate entries)
- [x] Interactive Startup Wizard (Ask for Name/Party if missing)
- [x] Enforced Nickname requirement for Party mode
- [x] Fix: Removed misleading deathPosition (-1, -1) from CLI updates
- [x] Fix: Server mapping (thROG) correctly aligned with Firebase
- [x] Fix: Duplicate entry cleanup via Map-based rehydration

### Doing 🚧 (In Progress)

- [ ] **Distribution:** Packaging the CLI into a portable `.exe` (or simplified runner).
- [ ] **UI Polish:** Re-implementing status color-coding (Red/Yellow/Green) in a way that doesn't conflict with current stability.

### TODO 📋 (Future Ideas)

**High Priority:**
- [ ] **Offline Mode:** Fallback to local JSON when Firebase is down.
- [ ] **CLI Party Members:** Show online members in the CLI header.
- [ ] **Notification System:** Global alerts across devices when an MVP is killed.

**Medium Priority:**
- [ ] **Smart Navigation:** Copy `/navi` command to clipboard for quick in-game navigation.
- [ ] **Search:** Implement type-to-search for Unselected MVPs.
- [ ] **Firebase Analytics:** Track usage statistics.
- [ ] **Custom Sounds:** Support for custom notification sounds.

---

*Last Updated: April 16, 2026*
