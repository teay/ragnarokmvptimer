import { css } from '@linaria/core';

export const globals = css`
  :global() {
    *,
    *::after,
    *::before {
      padding: 0;
      margin: 0;
      outline: 0;
      box-sizing: border-box;
      font-family: 'Jost', sans-serif;
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
      --secondary: rgba(123, 124, 125, 1);

      --text: #000;
      --header_text: #fff;

      --header_bg: linear-gradient(to top right, rgba(173, 216, 230, 0.8), rgba(144, 238, 144, 0.8)), url('/noise.png');
      background-blend-mode: overlay;
      --header_backdrop_filter: blur(10px);
      --header_box_shadow: 0px 4px 10px 0px rgba(0, 0, 0, 0.1);

      --warning_header_bg: #1b1c1d;
      --warning_header_text: #fff;

      --scrollbar_bg: #f6f8fa;
      --scrollbar_thumb: #f89200;

      --mvpCard_id: #421411;
      --mvpCard_name: #f89200;
      --mvpCard_bg: linear-gradient(to top right, rgba(80, 100, 110, 0.2), rgba(60, 100, 60, 0.2)), url('/noise.png'); /* Added noise, opacity 0.2 */
      background-blend-mode: overlay; /* Added for noise effect */
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

      --modal_bg: linear-gradient(to top right, rgba(173, 216, 230, 0.8), rgba(144, 238, 144, 0.8)), url('/noise.png'); /* Added noise, opacity 0.8 */
      background-blend-mode: overlay; /* Added for noise effect */
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

      --filterSearch_bg: rgba(128, 128, 128, 0.5); /* Adjusted for Glass UI */
      --filterSearch_border: #f89200;
      --filterSearch_text: #000;
      --filterSearch_border_focus: #000;

      --languagePicker_bg: rgba(128, 128, 128, 0.5); /* Adjusted for Glass UI */
      --languagePicker_border: #f89200;
      --languagePicker_text: #421411;

      --footer_text: #333;
      --footer_link: #007bff;
      --footer_bg: linear-gradient(to top right, rgba(173, 216, 230, 0.8), rgba(144, 238, 144, 0.8)), url('/noise.png');
      background-blend-mode: overlay;
      --footer_backdrop_filter: blur(10px);
      --footer_box_shadow: 0px -4px 10px 0px rgba(0, 0, 0, 0.1);

      --pulse_color: #e5e5e5;

      color: var(--text);
    }

    html.non-glass-ui[data-theme='light'] {
      --secondary: #f6f8fa;

      --header_bg: transparent;
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
      --footer_bg: transparent;
      background-blend-mode: normal;
      --footer_backdrop_filter: none;
      --footer_box_shadow: none;
    }

    html[data-theme='dark'] {
      color-scheme: dark;
      --primary: #1b1c1d;
      --secondary: #2e2e2e;

      --text: #fff;
      --header_text: #fff;

      --header_bg: linear-gradient(to top right, rgba(46, 46, 46, 0.8), rgba(64, 64, 64, 0.8)), url('/noise.png');
      background-blend-mode: overlay;
      --header_backdrop_filter: blur(10px);
      --header_box_shadow: 0px 4px 10px 0px rgba(0, 0, 0, 0.5);

      --warning_header_bg: #f89200;
      --warning_header_text: #000;

      --scrollbar_bg: #2e2e2e;
      --scrollbar_thumb: #f89200;

      --mvpCard_id: #fff;
      --mvpCard_name: #fff;
      --mvpCard_bg: linear-gradient(to top right, rgba(20, 20, 20, 0.2), rgba(30, 30, 30, 0.2)), url('/noise.png'); /* Adjusted opacity */
      background-blend-mode: overlay; /* Added for noise effect */
      --mvpCard_text: #fff;
      --mvpCard_killButton: #d10000; /* Reverted to original */
      --mvpCard_editButton: #f89200; /* Reverted to original */
      --mvpCard_controls_showMap: #00a8ff; /* Reverted to original */
      --mvpCard_controls_edit: #f89200; /* Reverted to original */
      --mvpCard_controls_delete: #d10000; /* Reverted to original */

      --timers_passed: #d10000;
      --timers_normal: #fff;
      --timers_respawning: #62831f;

      --switch_bg: #fff;
      --switch_handle: #000;

      --modal_bg: linear-gradient(to top right, rgba(46, 46, 46, 0.8), rgba(64, 64, 64, 0.8)), url('/noise.png');
      background-blend-mode: overlay; /* Added for noise effect */
      --modal_text: #fff;
      --modal_backdrop_filter: blur(20px);
      --modal_hl: #fff;
      --modal_name: #f89200;
      --modal_time: #f89200;
      --modal_button: #f89200; /* Reverted to original */

      --modal_datePicker_border: #fff;

      --modal_serverSelect_bg: #454545;
      --modal_serverSelect_bgActive: #f89200;
      --modal_serverSelect_text: #fff;
      --modal_serverSelect_textActive: #fff;
      --modal_serverSelect_border: transparent;

      --modal_changeMap_border: #00a8ff;
      --modal_changeMap_text: #fff;
      --modal_changeMap_selectedMapBorder: #ffa800;

      --filterSearch_bg: rgba(38, 38, 38, 0.7); /* Adjusted for Glass UI */
      --filterSearch_border: #1b1c1d;
      --filterSearch_text: #fff;
      --filterSearch_border_focus: #fff;

      --languagePicker_bg: rgba(69, 69, 69, 0.7); /* Adjusted for Glass UI */
      --languagePicker_border: #1b1c1d;
      --languagePicker_text: #fff;

      --footer_text: #fff;
      --footer_link: #f89200;
      --footer_bg: linear-gradient(to top right, rgba(46, 46, 46, 0.8), rgba(64, 64, 64, 0.8)), url('/noise.png');
      background-blend-mode: overlay;
      --footer_backdrop_filter: blur(10px);
      --footer_box_shadow: 0px -4px 10px 0px rgba(0, 0, 0, 0.5);

      --pulse_color: #404040;

      color: var(--text);
    }

    html.non-glass-ui[data-theme='dark'] {
      --secondary: #262626;

      --header_bg: transparent;
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

      --footer_bg: transparent;
      background-blend-mode: normal;
      --footer_backdrop_filter: none;
      --footer_box_shadow: none;
    }

    html {
      font-size: 62.5%;
    }

    body,
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