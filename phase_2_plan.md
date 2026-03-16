# Phase 2: Modify `App.tsx` for New Joining Flow

**Date:** March 16, 2026

## Objective

To update the main `App.tsx` component to integrate the new joining flow states (`joinState`, `joinRoomId`, `joinServer`, `joinNickname`) from `SettingsContext`. This involves implementing conditional rendering for joining screens, nickname prompts, confirmation messages, and automatic redirection, replacing the existing modal-based joining flow.

## Prerequisites

- **Phase 1 must be successfully completed:** The file `src/contexts/SettingsContext.tsx` MUST contain the following new state variables and setters:
    - `joinState: 'idle' | 'joining' | 'success' | 'error'`
    - `setJoinState`
    - `joinRoomId: string | null`
    - `setJoinRoomId`
    - `joinServer: string | null`
    - `setJoinServer`
    - `joinNickname: string | null`
    - `setJoinNickname`
    *(Note: As of current status, this file has been manually updated by the user after tool limitations prevented automated modification.)*

## Detailed Steps

### Step 2.1: Import New States from SettingsContext

* Modify the `useSettings()` hook call in `src/App.tsx` to destructure the newly added joining-related states and setters.

### Step 2.2: Update `useEffect` for URL Parameter Handling

* Locate the `useEffect` hook that processes URL query parameters (e.g., `?room=`, `?server=`).
* Modify its logic to:
    * Set `joinRoomId`, `joinServer`, and `joinNickname` based on URL parameters.
    * Update `joinState` to `'joining'` if a room is found and nickname is pre-filled, or `'idle'` if a nickname is still needed.
    * Remove direct calls to `setIsPartyModalOpen`, `setForceNicknamePromptOpen`, `setJoinedViaLink`, `changePartyRoom` from this `useEffect`.
    * Ensure URL cleanup (`window.history.replaceState`) still occurs after processing parameters.

### Step 2.3: Implement Conditional Rendering based on `joinState`

* Refactor the main return statement of `App.tsx`.
* Introduce conditional rendering logic:
    * **If `joinState === 'joining'`:** Render a dedicated full-screen loading/joining component.
    * **If `joinState === 'success'`:** Render a confirmation component that will trigger redirection.
    * **If `joinState === 'error'`:** Render an error display component.
    * **If `joinState === 'idle'` (and no active join is in progress):**
        * If URL parameters indicate a room join is pending (but nickname is needed), render a nickname prompt UI.
        * Otherwise, render the standard application UI (`<Header />`, `<Main />`, `<Footer />`).

### Step 2.4: Implement Nickname Prompt and Submission Logic

* Create or adapt a component to handle:
    * Displaying the target room name.
    * Prompting the user for their nickname if not provided via URL.
    * Input validation for the nickname.
    * On successful nickname submission:
        * Call `changeNickname` to update the global nickname setting.
        * Call `setJoinState('success')` to trigger the confirmation and redirection flow.
        * Potentially call `changePartyRoom` here to initiate the actual room join via Firebase/backend.

### Step 2.5: Implement Confirmation and Redirection

* The component rendering `joinState === 'success'` will display a confirmation message.
* A `useEffect` hook will monitor `joinState === 'success'` and trigger:
    * A call to `changePartyRoom` if not already done.
    * A timed redirection to the root path (`/`).
    * A reset of `joinState` to `'idle'` after redirection or a suitable delay.

## Expected Outcomes

* Users joining via a link will see a dedicated joining screen, be prompted for a nickname if necessary, receive a confirmation, and be redirected to the main app or room.
* The old modal-based joining flow will be entirely replaced.
* The application's rendering logic will be driven by the `joinState` for clarity and control over the user's joining experience.

## Potential Challenges

* **File Modification Issues:** The inability to reliably write to files remains a significant blocker. Phase 2 cannot be fully implemented until `SettingsContext.tsx` is correctly updated. (User has manually updated this file).
* **Component Reusability:** Deciding whether to create new components or adapt existing ones for the joining flow UI.
* **Error Handling:** Robustly handling network errors or invalid room/server data during the joining process.

## Next Steps (Once Blocker is Resolved)

1. Verify Phase 1 completion by confirming `src/contexts/SettingsContext.tsx` is updated.
2. Begin implementing the steps outlined in this plan for `App.tsx`.