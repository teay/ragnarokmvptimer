import { css } from '@linaria/core';

export const globals = css`
  :global() {
    @import url('https://fonts.googleapis.com/css2?family=Jost:wght@400;500;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@400;500;700&display=swap');

    *,
    *::after,
    *::before {
      padding: 0;
      margin: 0;
      outline: 0;
      box-sizing: border-box;
    }

    html[data-font='Jost'] {
      font-family: 'Jost', sans-serif;
    }

    html[data-font='Orbitron'] {
      font-family: 'Orbitron', sans-serif;
    }

    html[data-font='Exo 2'] {
      font-family: 'Exo 2', sans-serif;
    }

    #root {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    html[data-theme='darkest'] {
      color-scheme: dark;
      --primary: #5543cf96; /* SlateBlue */
      --secondary: #2c2457ff; /* BlueViolet */
      --tertiary: #2C2C4A; /* Dark Blue/Purple for backgrounds */
      --quaternary: #1A1A2E; /* Even darker for main body background */
      --border: #4A4A6A;

      --text: #E0E0E0;
      --header_text: var(--text);

      --header_bg: rgba(44, 44, 74, 0.8); /* Semi-transparent for dark theme */
      background-blend-mode: normal;
      --header_backdrop_filter: none;
      --header_box_shadow: none;

      --warning_header_bg: transparent;
      --warning_header_text: #000;

      --scrollbar_bg: transparent;
      --scrollbar_thumb: var(--primary);

      --mvpCard_id: var(--text);
      --mvpCard_name: #9370DB;
      --mvpCard_bg: var(--tertiary);
      background-blend-mode: normal;
      --mvpCard_text: var(--text);
      --mvpCard_killButton: #F25858;
      --mvpCard_editButton: var(--primary);
      --mvpCard_controls_showMap: var(--primary);
      --mvpCard_controls_edit: var(--primary);
      --mvpCard_controls_delete: #F25858;

      --scrollbar_thumb: var(--primary);

      --timers_passed: #F25858;
      --timers_normal: #FFFFFF;
      --timers_respawning: #FFFF00;

      --switch_bg: var(--primary);
      --switch_handle: var(--quaternary);

      --modal_bg: var(--tertiary);
      background-blend-mode: normal;
      --modal_backdrop_filter: none;
      --modal_hl: var(--text);
      --modal_name: #9370DB;
      --modal_time: var(--primary);
      --modal_button: var(--primary);

      --modal_datePicker_border: var(--border);

      --modal_serverSelect_bg: var(--tertiary);
      --modal_serverSelect_bgActive: var(--primary);
      --modal_serverSelect_text: var(--text);
      --modal_serverSelect_textActive: var(--text);
      --modal_serverSelect_border: transparent;

      --modal_changeMap_border: var(--primary);
      --modal_changeMap_text: var(--text);
      --modal_changeMap_selectedMapBorder: var(--secondary);

      --filterSearch_bg: var(--tertiary);
      --filterSearch_border: var(--border);
      --filterSearch_text: var(--text);
      --filterSearch_border_focus: var(--primary);
      backdrop-filter: none;

      --languagePicker_bg: var(--tertiary);
      --languagePicker_border: var(--border);
      --languagePicker_text: var(--text);
      backdrop-filter: none;

      --footer_text: var(--text);
      --footer_link: var(--primary);
      --footer_bg: rgba(44, 44, 74, 0.8); /* Semi-transparent for dark theme */
      background-blend-mode: normal;
      --footer_backdrop_filter: none;
      --footer_box_shadow: none;

      --pulse_color: #404040;

      color: var(--text);
    }

    html[data-theme='dark'] {
      color-scheme: dark; /* Changed to dark color scheme */
      --primary: #6553df96; /* Brighter version of dark primary */
      --secondary: #3c3467ff; /* Brighter version of dark secondary */
      --tertiary: #3C3C5A; /* Brighter version of dark tertiary */
      --quaternary: #2A2A3E; /* Brighter version of dark quaternary */
      --border: #5A5A7A; /* Brighter version of dark border */

      --text: #E0E0E0; /* Keep dark theme text color */
      --header_text: var(--text);

      --header_bg: rgba(60, 60, 90, 0.8); /* Semi-transparent for brighter dark theme */
      background-blend-mode: normal;
      --header_backdrop_filter: blur(10px); /* Keep glass effect */
      --header_box_shadow: 0px 4px 10px 0px rgba(0, 0, 0, 0.3); /* Lighter shadow */

      --warning_header_bg: transparent; /* From dark theme */
      --warning_header_text: #000; /* From dark theme */

      --scrollbar_bg: transparent; /* From dark theme */
      --scrollbar_thumb: var(--primary); /* From dark theme */

      --mvpCard_id: var(--text); /* From dark theme */
      --mvpCard_name: #9370DB; /* From dark theme */
      --mvpCard_bg: var(--tertiary);
      background-blend-mode: normal;
      --mvpCard_text: var(--text); /* From dark theme */
      --mvpCard_killButton: #F25858; /* From dark theme */
      --mvpCard_editButton: var(--primary); /* From dark theme */
      --mvpCard_controls_showMap: var(--primary); /* From dark theme */
      --mvpCard_controls_edit: var(--primary); /* From dark theme */
      --mvpCard_controls_delete: #F25858; /* From dark theme */

      --timers_passed: #F25858; /* Already Respawned (Red) */
      --timers_normal: #FFFFFF;
      --timers_respawning: #FFFF00; /* Respawning (Yellow) */

      --switch_bg: var(--primary); /* From dark theme */
      --switch_handle: var(--quaternary); /* From dark theme */

      --modal_bg: var(--tertiary);
      background-blend-mode: normal;
      --modal_backdrop_filter: blur(20px); /* Keep glass effect */
      --modal_hl: var(--text); /* From dark theme */
      --modal_name: #9370DB; /* From dark theme */
      --modal_time: var(--primary); /* From dark theme */
      --modal_button: var(--primary); /* From dark theme */

      --modal_datePicker_border: var(--border); /* From dark theme */

      --modal_serverSelect_bg: var(--tertiary); /* From dark theme */
      --modal_serverSelect_bgActive: var(--primary); /* From dark theme */
      --modal_serverSelect_text: var(--text); /* From dark theme */
      --modal_serverSelect_textActive: var(--text); /* From dark theme */
      --modal_serverSelect_border: transparent; /* From dark theme */

      --modal_changeMap_border: var(--primary); /* From dark theme */
      --modal_changeMap_text: var(--text); /* From dark theme */
      --modal_changeMap_selectedMapBorder: yellow; /* From dark theme */

      --filterSearch_bg: var(--tertiary); /* From dark theme */
      --filterSearch_border: var(--border); /* From dark theme */
      --filterSearch_text: var(--text); /* From dark theme */
      --filterSearch_border_focus: var(--primary); /* From dark theme */
      backdrop-filter: blur(10px); /* Add glass effect */

      --languagePicker_bg: var(--tertiary); /* From dark theme */
      --languagePicker_border: var(--border); /* From dark theme */
      --languagePicker_text: var(--text); /* From dark theme */
      backdrop-filter: blur(10px); /* Add glass effect */

      --footer_text: var(--text); /* From dark theme */
      --footer_link: var(--primary); /* From dark theme */
      --footer_bg: rgba(60, 60, 90, 0.8); /* Semi-transparent for brighter dark theme */
      background-blend-mode: normal;
      --footer_backdrop_filter: blur(10px); /* Keep glass effect */
      --footer_box_shadow: 0px 4px 10px 0px rgba(0, 0, 0, 0.3); /* Lighter shadow */

      --pulse_color: #808080; /* Even Darker pulse */

      color: var(--text);
    }

    html[data-theme='light'] {
      color-scheme: light;
      --primary: #0056b3; /* Slightly darker blue for primary actions/highlights */
      --secondary: #c0c4c8; /* Main background: Darker light gray */
      --tertiary: #d8dce0; /* Cards/Modals: Darker lighter gray */
      --quaternary: #a0a4a8; /* Subtle separation: Darker medium gray */
      --border: #686c70; /* Borders: Even Darker gray */

      --text: #1a1d20; /* Even Darker gray for general text */
      --header_text: var(--text);

      --header_bg: rgba(216, 220, 224, 0.9); /* Header background: Based on tertiary, less transparent */
      background-blend-mode: normal;
      --header_backdrop_filter: blur(10px); /* Keep glass effect if desired */
      --header_box_shadow: 0px 4px 10px 0px rgba(0, 0, 0, 0.2); /* Slightly darker shadow */

      --warning_header_bg: transparent;
      --warning_header_text: #b01e2e; /* Even Darker red for warnings */

      --scrollbar_bg: transparent;
      --scrollbar_thumb: var(--primary);

      --mvpCard_id: var(--text);
      --mvpCard_name: #4a2582; /* Even Darker purple accent for MVP names */
      --mvpCard_bg: var(--tertiary);
      background-blend-mode: normal;
      --mvpCard_text: var(--text);
      --mvpCard_killButton: #b01e2e; /* Even Darker red */
      --mvpCard_editButton: var(--primary);
      --mvpCard_controls_showMap: var(--primary);
      --mvpCard_controls_edit: var(--primary);
      --mvpCard_controls_delete: #b01e2e; /* Even Darker red */

      --timers_passed: #b01e2e; /* Even Darker red */
      --timers_normal: var(--text);
      --timers_respawning: #c09000; /* Even Darker yellow */

      --switch_bg: var(--primary);
      --switch_handle: var(--tertiary);

      --modal_bg: var(--tertiary);
      background-blend-mode: normal;
      --modal_backdrop_filter: blur(20px); /* Keep glass effect if desired */
      --modal_hl: var(--text);
      --modal_name: #5a2d9e;
      --modal_time: var(--primary);
      --modal_button: var(--primary);

      --modal_datePicker_border: var(--border);

      --modal_serverSelect_bg: var(--quaternary);
      --modal_serverSelect_bgActive: var(--primary);
      --modal_serverSelect_text: var(--text);
      --modal_serverSelect_textActive: var(--text); /* Change to dark text on active primary */
      --modal_serverSelect_border: transparent;

      --modal_changeMap_border: var(--primary);
      --modal_changeMap_text: var(--text);
      --modal_changeMap_selectedMapBorder: var(--primary);

      --filterSearch_bg: var(--quaternary);
      --filterSearch_border: var(--border);
      --filterSearch_text: var(--text);
      --filterSearch_border_focus: var(--primary);
      backdrop-filter: blur(10px); /* Keep glass effect if desired */

      --languagePicker_bg: var(--quaternary);
      --languagePicker_border: var(--border);
      --languagePicker_text: var(--text);
      backdrop-filter: blur(10px); /* Keep glass effect if desired */

      --footer_text: var(--text);
      --footer_link: var(--primary);
      --footer_bg: rgba(216, 220, 224, 0.9); /* Footer background: Based on tertiary, less transparent */
      background-blend-mode: normal;
      --footer_backdrop_filter: blur(10px); /* Keep glass effect if desired */
      --footer_box_shadow: 0px 4px 10px 0px rgba(0, 0, 0, 0.2);

      --pulse_color: #c0c0c0; /* Darker pulse */

      color: var(--text); /* Default text color */
    }

    /* Styles for AppTextOnly (Text Mode UI) */
    .app-text-only-container {
      padding: 20px;
      color: var(--text); /* Use theme text color */
      background-color: var(--quaternary); /* Use a theme background color */
      min-height: 100vh;
    }

    .mvp-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr); /* 4 equal columns */
      gap: 15px; /* Space between cards */
      margin-top: 20px;
    }

    .mvp-card-text {
      border: 2px solid var(--border); /* Thicker border */
      padding: 10px;
      border-radius: 8px;
      background-color: var(--tertiary);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 180px; /* Increased height to accommodate more info */
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      font-size: 1.2rem; /* Base font size for card content */
    }
    .mvp-card-text * {
      border: 1px solid red !important; /* Re-add debugging border for all children */
    }

    .mvp-card-text-id {
      font-size: 0.9em;
      color: var(--mvpCard_id);
      margin-bottom: 5px;
    }

    .mvp-card-text-name {
      font-weight: bold;
      color: var(--mvpCard_name);
      margin-bottom: 5px;
      font-size: 1.3em;
    }

    .mvp-card-text-status-line {
      margin-bottom: 5px;
    }

    .mvp-status {
      color: var(--timers_passed); /* Example color for "Already Respawned" */
      font-weight: bold;
    }

    .mvp-countdown {
      color: var(--timers_normal);
      font-weight: bold;
      font-size: 1.1em;
    }

    .mvp-card-text-map {
      font-size: 0.9em;
      color: var(--text);
      margin-bottom: 5px;
    }

    .mvp-card-text-death-time {
      font-size: 0.8em;
      color: var(--text);
      white-space: pre-wrap; /* To respect newlines in death time */
      margin-bottom: 5px;
    }

    .mvp-card-text-actions {
      display: flex;
      justify-content: space-around; /* Distribute buttons evenly */
      margin-top: auto; /* Push actions to the bottom */
      padding-top: 10px;
      border-top: 1px solid var(--border); /* Separator line */
      gap: 5px; /* Add a small gap between buttons */
    }

    .mvp-action-button {
      font-size: 0.8em;
      color: var(--primary);
      cursor: pointer;
      padding: 5px 8px;
      border: 1px solid var(--primary);
      border-radius: 4px;
      transition: background-color 0.2s ease;
      flex-grow: 1; /* Allow buttons to grow and fill space */
      text-align: center;
    }

    .mvp-action-button:hover {
      background-color: var(--primary);
      color: var(--quaternary); /* Text color on hover */
    }

    .kill-now-button {
      background-color: #4CAF50; /* Green background for kill button */
      color: white;
      border-color: #4CAF50;
    }

    .kill-now-button:hover {
      background-color: #45a049;
      color: white;
    }

    .edit-button {
      background-color: var(--primary); /* Use primary color for edit button */
      color: var(--quaternary);
    }

    .edit-button:hover {
      background-color: var(--primary);
      color: var(--quaternary);
    }

    /* End Styles for AppTextOnly */

    html.non-glass-ui[data-theme='darkest'] {
      --header_backdrop_filter: none;
      --header_box_shadow: none;
      --mvpCard_backdrop_filter: none; /* Assuming mvpCard might have one */
      --modal_backdrop_filter: none;
      --footer_backdrop_filter: none;
      --footer_box_shadow: none;
    }

    html.non-glass-ui[data-theme='dark'] {
      --header_backdrop_filter: none;
      --header_box_shadow: none;
      --modal_backdrop_filter: none;
      --footer_backdrop_filter: none;
      --footer_box_shadow: none;
    }

    html.non-glass-ui[data-theme='light'] {
      --header_backdrop_filter: none;
      --header_box_shadow: none;
      --modal_backdrop_filter: none;
      --footer_backdrop_filter: none;
      --footer_box_shadow: none;
    }

    /* Conditional transparency for Main content and MvpCards */
    html.transparent-main-content[data-theme='darkest'] {
      /* Main component background */
      --secondary: rgba(44, 44, 74, 0.1); /* Semi-transparent dark */
      /* MvpCard background */
      --mvpCard_bg: rgba(44, 44, 74, 0.9); /* Semi-transparent dark */
    }

    html.transparent-main-content[data-theme='dark'] {
      /* Main component background */
      --secondary: rgba(60, 60, 90, 0.1); /* Semi-transparent brighter dark */
      /* MvpCard background */
      --mvpCard_bg: rgba(60, 60, 90, 0.9); /* Semi-transparent brighter dark */
    }

    html.transparent-main-content[data-theme='light'] {
      /* Main component background */
      --secondary: rgba(192, 196, 200, 0.1); /* Semi-transparent based on new secondary */
      /* MvpCard background */
      --mvpCard_bg: rgba(216, 220, 224, 0.9); /* Semi-transparent based on new tertiary */
    }

    html {
      font-size: 62.5%;
    }

    body {
      height: 100vh;
      background: linear-gradient(270deg, var(--primary), var(--secondary));
      background-size: 400% 400%;
      animation: gradientAnimation 15s ease infinite;
    }

    @keyframes gradientAnimation {
      0% {
        background-position: 0% 50%;
      }
      50% {
        background-position: 100% 50%;
      }
      100% {
        background-position: 0% 50%;
      }
    }

    button,
    input {
      border: 0;
    }

    button {
      cursor: pointer;
    }

    *:not(body, html)::-webkit-scrollbar-track {
      background-color: var(--scrollbar_bg);
    }

    *:not(body, html)::-webkit-scrollbar {
      width: 1.6rem;

      @media (max-width: ${1000 / 16}em) {
        width: 1.2rem;
      }
    }

    *:not(body, html)::-webkit-scrollbar-thumb {
      border-radius: 8px;
      border: 4px solid transparent;
      background-clip: content-box;
      background-color: var(--scrollbar_thumb);

      @media (max-width: ${1000 / 16}em) {
        border-radius: 10px;
      }
    }
  }
`;