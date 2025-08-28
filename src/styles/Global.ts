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

    html[data-theme='light'] {
      color-scheme: dark; /* Changed to dark color scheme */
      --primary: #6553df96; /* Brighter version of dark primary */
      --secondary: #3c3467ff; /* Brighter version of dark secondary */
      --tertiary: #3C3C5A; /* Brighter version of dark tertiary */
      --quaternary: #2A2A3E; /* Brighter version of dark quaternary */
      --border: #5A5A7A; /* Brighter version of dark border */

      --text: #E0E0E0; /* Keep dark theme text color */
      --header_text: var(--text);

      --header_bg: var(--tertiary);
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

      --timers_passed: #F25858; /* From dark theme */
      --timers_normal: #FFFFFF; /* From dark theme */
      --timers_respawning: #58F28B; /* From dark theme */

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
      --modal_changeMap_selectedMapBorder: var(--secondary); /* From dark theme */

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
      --footer_bg: var(--tertiary);
      background-blend-mode: normal;
      --footer_backdrop_filter: blur(10px); /* Keep glass effect */
      --footer_box_shadow: 0px -4px 10px 0px rgba(0, 0, 0, 0.3); /* Lighter shadow */

      --pulse_color: #404040; /* From dark theme */

      color: var(--text);
    }

    html.non-glass-ui[data-theme='light'] {
      --secondary: #f6f8fa;

      --header_bg: #ffffff;
      background-blend-mode: normal;
      --header_backdrop_filter: none;
      --header_box_shadow: none;

      --mvpCard_bg: #fff;
      background-blend-mode: normal;

      --modal_bg: #fff;
      background-blend-mode: normal;
      --modal_backdrop_filter: none;

      --filterSearch_bg: #fff;

      --languagePicker_bg: #f6f8fa;

      --footer_text: #fff;
      --footer_link: #fff;
      --footer_bg: #ffffff;
      background-blend-mode: normal;
      --footer_backdrop_filter: none;
      --footer_box_shadow: none;
    }

    html[data-theme='dark'] {
      color-scheme: dark;
      --primary: #5543cf96; /* SlateBlue */
      --secondary: #2c2457ff; /* BlueViolet */
      --tertiary: #2C2C4A; /* Dark Blue/Purple for backgrounds */
      --quaternary: #1A1A2E; /* Even darker for main body background */
      --border: #4A4A6A;

      --text: #E0E0E0;
      --header_text: var(--text);

            --header_bg: var(--tertiary);
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
      --timers_respawning: #58F28B;

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
      --footer_bg: var(--tertiary);
      background-blend-mode: normal;
      --footer_backdrop_filter: none;
      --footer_box_shadow: none;

      --pulse_color: #404040;

      color: var(--text);
    }

    /* Aggressive override for MvpCard text */
    .cujd8eq span {
      color: #E0E0E0 !important;
    }

    /* Aggressive override for ModalSelectMap text */
    .m12h3ctv span {
      color: #E0E0E0 !important;
    }

    html.non-glass-ui[data-theme='dark'] {
      --secondary: #262626;

      --header_bg: #333333;
      background-blend-mode: normal;
      --header_backdrop_filter: none;
      --header_box_shadow: none;

      --mvpCard_bg: #262626;
      background-blend-mode: normal;

      --modal_bg: #262626;
      background-blend-mode: normal;
      --modal_backdrop_filter: none;

      --filterSearch_bg: #262626;

      --languagePicker_bg: #454545;

      --footer_bg: #333333;
      background-blend-mode: normal;
      --footer_backdrop_filter: none;
      --footer_box_shadow: none;
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