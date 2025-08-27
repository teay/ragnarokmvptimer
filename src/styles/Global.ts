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

    :root,
    html[data-theme='light'] {
      color-scheme: light;
      --primary: #f89200;
      --light-glass-r: 150;
      --light-glass-g: 250;
      --light-glass-b: 200;
      --secondary: rgba(var(--light-glass-r), var(--light-glass-g), var(--light-glass-b), 0.9);

      --text: #000;
      --header_text: #fff;

      --header_bg: rgba(var(--light-glass-r), var(--light-glass-g), var(--light-glass-b), 0.9);
      background-blend-mode: normal;
      --header_backdrop_filter: blur(10px);
      --header_box_shadow: 0px 4px 10px 0px rgba(0, 0, 0, 0.1);

      --warning_header_bg: #1b1c1d;
      --warning_header_text: #fff;

      --scrollbar_bg: #f6f8fa;
      --scrollbar_thumb: #f89200;

      --mvpCard_id: #421411;
      --mvpCard_name: #f89200;
      --mvpCard_bg: rgba(var(--light-glass-r), var(--light-glass-g), var(--light-glass-b), 0.9);
      background-blend-mode: normal;
      --mvpCard_text: #421411;
      --mvpCard_killButton: #d10000; /* Reverted to original */
      --mvpCard_editButton: #f89200; /* Reverted to original */

      --mvpCard_controls_showMap: #00a8ff; /* Reverted to original */
      --mvpCard_controls_edit: #f89200; /* Reverted to original */
      --mvpCard_controls_delete: #d10000; /* Reverted to original */

      --timers_passed: #d10000;
      --timers_normal: #421411;
      --timers_respawning: #62831f;

      --switch_bg: #ffa800;
      --switch_handle: #f6f8fa;

      --modal_bg: rgba(var(--light-glass-r), var(--light-glass-g), var(--light-glass-b), 0.9);
      background-blend-mode: normal;
      --modal_text: #421411;
      --modal_backdrop_filter: blur(20px);
      --modal_hl: #1b1c1d;
      --modal_name: #ffa800;
      --modal_time: #ffa800;
      --modal_button: #f89200; /* Reverted to original */

      --modal_datePicker_border: #000;

      --modal_serverSelect_bg: #f6f8fa;
      --modal_serverSelect_bgActive: #f89200;
      --modal_serverSelect_text: #000;
      --modal_serverSelect_textActive: #fff;
      --modal_serverSelect_border: #f89200;

      --modal_changeMap_border: #00a8ff;
      --modal_changeMap_text: #000;
      --modal_changeMap_selectedMapBorder: #ffa800;

      --filterSearch_bg: rgba(128, 128, 128, 0.9); /* Adjusted for Glass UI */
      --filterSearch_border: #f89200;
      --filterSearch_text: #000;
      --filterSearch_border_focus: #000;

      --languagePicker_bg: rgba(128, 128, 128, 0.9); /* Adjusted for Glass UI */
      --languagePicker_border: #f89200;
      --languagePicker_text: #421411;

      --footer_text: #333;
      --footer_link: #007bff;
      --footer_bg: rgba(var(--light-glass-r), var(--light-glass-g), var(--light-glass-b), 0.9);
      background-blend-mode: normal;
      --footer_backdrop_filter: blur(10px);
      --footer_box_shadow: 0px -4px 10px 0px rgba(0, 0, 0, 0.9);

      --pulse_color: #e5e5e5;

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
      --primary: #6A5ACD; /* SlateBlue */
      --secondary: #8A2BE2; /* BlueViolet */
      --tertiary: #2C2C4A; /* Dark Blue/Purple for backgrounds */
      --quaternary: #1A1A2E; /* Even darker for main body background */
      --border: #4A4A6A;

      --text: #E0E0E0;
      --header_text: var(--text);

      --header_bg: rgba(20, 20, 30, 0.9);
      background-blend-mode: normal;
      --header_backdrop_filter: none;
      --header_box_shadow: none;

      --warning_header_bg: transparent;
      --warning_header_text: #000;

      --scrollbar_bg: transparent;
      --scrollbar_thumb: var(--primary);

      --mvpCard_id: var(--text);
      --mvpCard_name: var(--primary);
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
      --modal_text: var(--text);
      --modal_backdrop_filter: none;
      --modal_hl: var(--text);
      --modal_name: var(--primary);
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

      --languagePicker_bg: var(--tertiary);
      --languagePicker_border: var(--border);
      --languagePicker_text: var(--text);

      --footer_text: var(--text);
      --footer_link: var(--primary);
      --footer_bg: var(--tertiary);
      background-blend-mode: normal;
      --footer_backdrop_filter: none;
      --footer_box_shadow: none;

      --pulse_color: #404040;

      color: var(--text);
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