# TODO - Ragnarok MVP Timer

## Status Overview 📊

### Done ✅ (Completed Tasks)

**Core & Web App:**
- [x] Cloud-first data flow (Firebase is primary source of truth)
- [x] Solo/Party mode implementation
- [x] Firebase path structure: `hunting/solo/` and `hunting/party/`
- [x] Removed legacy backup system
- [x] Fixed MVP Sorting Logic (Soonest respawn always first)
- [x] Improved `rehydrateMvps` to support CLI-to-Web data consistency
- [x] Interactive Modal for killing and editing MVPs
- [x] Export/Import JSON functionality
- [x] Party members display (Web version)

**CLI Version (Terminal UI):**
- [x] Correct Firebase hostname parsing (support region-specific URLs)
- [x] Real-time data synchronization via Firebase SDK (`onValue`)
- [x] Auto-save to Firebase on every update (Toggling, Killing, Editing)
- [x] Smart Merge: Preserve web metadata (coordinates, etc.) during CLI updates
- [x] Support for Multi-spawn MVPs (Shown as separate entries)
- [x] Interactive Startup Wizard (Ask for Name/Party if missing)
- [x] CLI Header showing current Sync Mode (Solo/Party)
- [x] Enforced Nickname requirement for Party mode
- [x] Fix: Use `null` for deathPosition when killing from CLI

### Doing 🚧 (In Progress / Need Decision)

- [ ] **Security Refactoring:** Moving away from hardcoded API keys in CLI and implementing Firebase Rules.
- [ ] **Deployment Strategy:** Setting up a reliable way to deploy the web version (fixing `npm install` dependency conflicts).
- [ ] **CLI Standalone:** Preparing the CLI for distribution (e.g., `.exe` packaging).

### TODO 📋 (Future Ideas)

**High Priority:**
- [ ] **Offline Mode:** Fallback to localStorage (Web) or local JSON (CLI) when Firebase is down.
- [ ] **CLI Party Members:** Show online members in the CLI header.
- [ ] **Notification System:** Global notifications across devices when an MVP is killed.

**Medium Priority:**
- [ ] **Import Party → Solo:** Ability to copy a specific server's timer data from Party to personal Solo mode.
- [ ] **Firebase Analytics:** Track usage statistics.
- [ ] **Custom Sounds:** Allow users to upload their own notification sounds.

---

*Last Updated: April 16, 2026*
