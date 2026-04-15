const term = require('terminal-kit').terminal;
const { readFileSync, existsSync, writeFileSync } = require('fs');
const path = require('path');
const readline = require('readline');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, onValue, set } = require('firebase/database');

let firebaseApp = null;
let firebaseDb = null;
let firebaseUnsubscribe = null;

let firebaseReady = false;
let firebaseConfig = {};
let cliNickname = 'CLI';
let partyRoom = ''; // Add partyRoom support

function initFirebase() {
  // 1. Parse .env first
  let envPath = path.join(__dirname, '..', '..', '.env');
  let envContent = existsSync(envPath) ? readFileSync(envPath, 'utf-8') : '';
  let config = {};
  envContent.split('\n').forEach(function (line) {
    let parts = line.split('=');
    if (parts.length >= 2) {
      let rawKey = parts[0].trim();
      let key = rawKey
        .replace('VITE_', '')
        .replace('FIREBASE_', '')
        .toLowerCase();
      let value = parts.slice(1).join('=').trim();
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      
      if (value && !value.startsWith('YOUR_')) {
        config[key] = value;
      }
      if (rawKey === 'VITE_NICKNAME' || rawKey === 'CLI_NICKNAME') {
        cliNickname = value;
      }
    }
  });

  // 2. Override with Command Line Arguments
  // Usage: node src/index.cjs --name MyName --party MyParty
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--name' && args[i+1]) {
      cliNickname = args[i+1];
      i++;
    } else if (args[i] === '--party' && args[i+1]) {
      partyRoom = args[i+1];
      i++;
    }
  }

  if (config.api_key && config.database_url) {
    firebaseConfig = config;
    firebaseReady = true;
    
    let dbUrl = config.database_url;
    if (!dbUrl.startsWith('http')) dbUrl = 'https://' + dbUrl;
    try {
      let urlObj = new URL(dbUrl);
      firebaseConfig.host = urlObj.hostname;
    } catch (e) {
      firebaseConfig.host = dbUrl.replace('https://', '').split('/')[0];
    }
    
    let modeInfo = partyRoom ? 'Party: ' + partyRoom : 'Nickname: ' + cliNickname;
    
    // Initialize SDK
    const fbConfig = {
      apiKey: config.api_key,
      authDomain: config.auth_domain,
      databaseURL: config.database_url,
      projectId: config.project_id,
      storageBucket: config.storage_bucket,
      messagingSenderId: config.messaging_sender_id,
      appId: config.app_id
    };
    
    try {
      firebaseApp = initializeApp(fbConfig);
      firebaseDb = getDatabase(firebaseApp);
      console.log('Firebase SDK Initialized (' + modeInfo + ')');
      setupRealtimeSync();
    } catch (e) {
      console.log('Firebase SDK Init Error: ' + e.message);
    }
    
    return true;
  }
  return false;
}

function setupRealtimeSync() {
  if (!firebaseDb) return;
  
  if (firebaseUnsubscribe) {
    firebaseUnsubscribe();
  }

  let dbPath = partyRoom 
    ? 'hunting/party/' + partyRoom + '/' + currentServer + '/mvps'
    : 'hunting/solo/' + cliNickname + '/' + currentServer + '/mvps';

  const mvpsRef = ref(firebaseDb, dbPath);
  
  firebaseUnsubscribe = onValue(mvpsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      let remoteMvps = Array.isArray(data) ? data : Object.values(data);
      activeMvps = rehydrateMvps(remoteMvps);
    } else {
      activeMvps = [];
    }
    render(); // Force UI update when data changes in Firebase
  });
}

function autoSaveToFirebase() {
  if (!firebaseDb) return;
  
  let dbPath = partyRoom 
    ? 'hunting/party/' + partyRoom + '/' + currentServer + '/mvps'
    : 'hunting/solo/' + cliNickname + '/' + currentServer + '/mvps';

  const minimalMvps = activeMvps.map((m) => ({
    id: m.id,
    deathTime: m.deathTime ? new Date(m.deathTime).toISOString() : null,
    deathMap: m.deathMap || null,
    deathPosition: m.deathPosition || null,
    isPinned: m.isPinned || false,
    updatedBy: cliNickname,
  }));
  
  const mvpsRef = ref(firebaseDb, dbPath);
  set(mvpsRef, minimalMvps).catch((err) => {
    // Silent error in background auto-save
  });
}

const SERVERS = {
  iRO: 'iRO',
  iROC: 'iROC',
  kRO: 'kROZ',
  kROS: 'kROZS',
  kROM: 'kROM',
  aRO: 'aRO',
  bRO: 'bRO',
  cRO: 'cRO',
  fRO: 'fRO',
  jRO: 'jRO',
  twRO: 'twRO',
  GGH: 'GGH',
  thRO: 'thROG',
  idRO: 'idRO',
};

const serverKeys = Object.keys(SERVERS);
let currentServerIndex = 0;
let currentServer = serverKeys[currentServerIndex];

function loadMvpData(server) {
  const dataPath = path.join(__dirname, '..', 'data', server + '.json');
  if (!existsSync(dataPath)) return [];
  return JSON.parse(readFileSync(dataPath, 'utf-8'));
}

let serverFile = SERVERS[currentServer];
let originalAllMvps = loadMvpData(serverFile);
let activeMvps = [];

// Initialize Firebase AFTER servers are defined
initFirebase();

function expandMvpsBySpawn(rawData) {
  let expanded = [];
  rawData.forEach(function (mvp) {
    if (mvp.spawn) {
      mvp.spawn.forEach(function (spawn) {
        expanded.push({
          id: mvp.id,
          name: mvp.name,
          dbname: mvp.dbname,
          spawn: [spawn],
          mapname: spawn.mapname,
          respawnTime: spawn.respawnTime,
          stats: mvp.stats,
        });
      });
    }
  });
  return expanded;
}

function rehydrateMvps(remoteMvps) {
  if (!Array.isArray(remoteMvps)) return [];
  let allPossibleMvps = expandMvpsBySpawn(originalAllMvps);
  let result = [];
  remoteMvps.forEach(function (remote) {
    // Find matching MVP by ID and mapname (deathMap in remote)
    let base = allPossibleMvps.find(function (m) {
      return (
        m.id === remote.id &&
        (m.mapname === remote.deathMap || m.mapname === remote.mapname)
      );
    });

    // Fallback search by ID only if not found
    if (!base) {
      base = allPossibleMvps.find(function (m) {
        return m.id === remote.id;
      });
    }

    if (base) {
      // Create a copy of base data and add dynamic properties from remote
      let hydrated = JSON.parse(JSON.stringify(base));
      hydrated.deathTime = remote.deathTime
        ? new Date(remote.deathTime).getTime()
        : null;
      hydrated.deathMap = remote.deathMap || base.mapname;
      hydrated.deathPosition = remote.deathPosition || null;
      hydrated.isPinned = remote.isPinned || false;
      hydrated.updatedBy = remote.updatedBy || 'CLI';
      result.push(hydrated);
    }
  });
  return result;
}

function getAllMvps() {
  let activeKeys = {};
  activeMvps.forEach(function (m) {
    if (m && m.id) activeKeys[m.id + '-' + (m.deathMap || m.mapname)] = true;
  });
  return expandMvpsBySpawn(originalAllMvps).filter(function (mvp) {
    return !activeKeys[mvp.id + '-' + mvp.mapname];
  });
}

let active = [],
  wait = [],
  pending = [];
let selectedIndex = 0,
  pauseMode = false,
  sortMode = 'name';
let linePositions = [];

function updateLists() {
  active = activeMvps.filter(function (m) {
    return m && m.deathTime;
  });
  wait = activeMvps.filter(function (m) {
    return m && m.isPinned && !m.deathTime;
  });
  pending = getAllMvps();

  active.sort(function (a, b) {
    let tA = getRespawnTime(a) || 0,
      tB = getRespawnTime(b) || 0;
    return tA - tB;
  });
  wait.sort(function (a, b) {
    return a.name.localeCompare(b.name);
  });
  if (sortMode === 'name')
    pending.sort(function (a, b) {
      return a && b ? a.name.localeCompare(b.name) : 0;
    });
  else if (sortMode === 'map')
    pending.sort(function (a, b) {
      if (!a || !a.mapname) return 1;
      if (!b || !b.mapname) return -1;
      return a.mapname.localeCompare(b.mapname);
    });

  let totalItems = active.length + wait.length + pending.length;
  if (selectedIndex >= totalItems) selectedIndex = Math.max(0, totalItems - 1);
}

function formatTime(ms) {
  if (ms <= 0) return 'READY!';
  let s = Math.floor(ms / 1000),
    h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    sec = s % 60;
  return h > 0
    ? h + 'h ' + m + 'm ' + sec + 's'
    : m > 0
      ? m + 'm ' + sec + 's'
      : sec + 's';
}

function getWidth(str) {
  if (!str) return 0;
  let width = 0;
  for (let i = 0; i < str.length; i++) {
    let code = str.charCodeAt(i);
    if (code >= 0x1100 && code <= 0x115f) width += 2;
    else if (code >= 0x2329 && code <= 0x232a) width += 2;
    else if (code >= 0x2e80 && code <= 0x303f) width += 2;
    else if (code >= 0x3040 && code <= 0xa4cf) width += 2;
    else if (code >= 0xac00 && code <= 0xd7a3) width += 2;
    else if (code >= 0xf900 && code <= 0xfaff) width += 2;
    else if (code >= 0xfe10 && code <= 0xfe19) width += 2;
    else if (code >= 0xfe30 && code <= 0xfe6f) width += 2;
    else if (code >= 0xff00 && code <= 0xff60) width += 2;
    else if (code >= 0xffe0 && code <= 0xffe6) width += 2;
    else if (code >= 0x0e01 && code <= 0x0e5b) width += 2;
    else width += 1;
  }
  return width;
}

function padCol(str, len) {
  if (!str) str = '';
  let w = getWidth(str);
  if (w >= len) return str.substring(0, len);
  return str + ' '.repeat(len - w);
}

function getWidthPad(str, maxWidth) {
  if (!str) return ' '.repeat(maxWidth);
  let w = getWidth(str);
  if (w > maxWidth) {
    let result = '';
    let currentWidth = 0;
    for (let i = 0; i < str.length && currentWidth < maxWidth; i++) {
      let charWidth = getWidth(str[i]);
      if (currentWidth + charWidth > maxWidth) break;
      result += str[i];
      currentWidth += charWidth;
    }
    return result + ' '.repeat(maxWidth - currentWidth);
  }
  return str + ' '.repeat(maxWidth - w);
}

function parseSmartTime(input) {
  if (!input) return null;

  let now = new Date();
  let today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  input = input.trim();
  let digits = input.replace(/\D/g, '');

  if (digits.length >= 3 && digits.length <= 4) {
    let h, m;
    if (digits.length === 4) {
      h = parseInt(digits.substring(0, 2));
      m = parseInt(digits.substring(2, 4));
    } else {
      h = parseInt(digits.substring(0, 1));
      m = parseInt(digits.substring(1, 3));
    }
    if (h >= 0 && h < 24 && m < 60) {
      let parsed = new Date(today);
      parsed.setHours(h, m, 0, 0);
      return parsed;
    }
  }

  return null;
}

function formatDeathTime(timestamp) {
  if (!timestamp) return '';
  let d = new Date(timestamp);
  let y = d.getFullYear();
  let mon = String(d.getMonth() + 1).padStart(2, '0');
  let day = String(d.getDate()).padStart(2, '0');
  let h = String(d.getHours()).padStart(2, '0');
  let min = String(d.getMinutes()).padStart(2, '0');
  let s = String(d.getSeconds()).padStart(2, '0');
  return y + '-' + mon + '-' + day + ' ' + h + ':' + min + ':' + s;
}

function getRespawnTime(mvp) {
  if (!mvp.deathTime || !mvp.respawnTime) return null;
  return mvp.deathTime + mvp.respawnTime - Date.now();
}

function getWindowTime(mvp) {
  if (!mvp.deathTime || !mvp.respawnTime) return null;
  let windowTime = mvp.window || 600000;
  let minTime = mvp.deathTime + mvp.respawnTime;
  let maxTime = minTime + windowTime;
  return maxTime - Date.now();
}

function getMvpAtIndex(idx) {
  if (idx < active.length) return active[idx];
  if (idx < active.length + wait.length) return wait[idx - active.length];
  return pending[idx - active.length - wait.length];
}

function render() {
  updateLists();

  let termWidth = term.width;
  let termHeight = term.height;
  if (typeof termWidth !== 'number' || !isFinite(termWidth) || termWidth < 10)
    termWidth = 80;
  if (typeof termHeight !== 'number' || !isFinite(termHeight) || termHeight < 5)
    termHeight = 24;
  let totalItems = active.length + wait.length + pending.length;

  let scrollOffset = 0;
  let pageSize = 25;
  if (totalItems > 15) {
    scrollOffset = Math.floor(selectedIndex / pageSize) * pageSize;
  }

  linePositions = [];
  let lineY = 1;

  term.clear();
  term.gray('-'.repeat(termWidth) + '\n');
  lineY++;
  let modeLabel =
    'Active:' +
    active.length +
    ' | Wait:' +
    wait.length +
    ' | Unselected:' +
    pending.length;
  let syncInfo = partyRoom ? 'Party: ' + partyRoom : 'Solo: ' + cliNickname;
  
  term.bold.cyan(' [');
  term(serverFile);
  term.yellow('] ');
  term.magenta(syncInfo);
  term.yellow(' | ');
  term(pauseMode ? '(⏸ PAUSED)' : '(▶ RUNNING)');
  term.yellow(' | ');
  term(modeLabel);
  term.yellow(
    ' | All:' + (active.length + wait.length + pending.length) + ' MVPs\n'
  );
  term.green(
    '  [Arrows]1 [PgUp/Dn]10 [Ctrl+Up/Dn]5 [Enter/D]Toggle [C]Cancel [E]Edit [B]Back [Space]Pause [S]Sort [F/I/L/R]File [Left/Right]Server [Q]Quit\n'
  );
  lineY = 3;

  term.bold.white(
    '# Boss Name               | Time            | Status        | DeathTime             | Map\n'
  );
  term.gray('-'.repeat(termWidth) + '\n');

  let currentIdx = 0;

  if (active.length > 0) {
    term.gray('-'.repeat(termWidth) + '\n');
    lineY++;
    term.bold.cyan('=== ACTIVE (Respawning) ===\n');
    lineY++;
    active.forEach(function (mvp) {
      if (currentIdx < scrollOffset) {
        currentIdx++;
        return;
      }
      if (currentIdx >= scrollOffset + termHeight - 10) return;
      let respawnTime = getRespawnTime(mvp);
      let windowTime = getWindowTime(mvp);
      let timeStr;
      let statusLabel;
      if (respawnTime === null || respawnTime <= 0) {
        if (windowTime === null || windowTime <= 0) {
          timeStr =
            '-' +
            formatTime(
              Date.now() -
                (mvp.deathTime + mvp.respawnTime + (mvp.window || 600000))
            );
          statusLabel = 'Already Respawned';
        } else {
          timeStr = formatTime(windowTime);
          statusLabel = 'Respawning';
        }
      } else {
        timeStr = formatTime(respawnTime);
        statusLabel = 'Respawn in';
      }
      let deathStr = mvp.deathTime ? formatDeathTime(mvp.deathTime) : '';
      let line =
        '[A] ' +
        getWidthPad(mvp.name.trim(), 24) +
        '| ' +
        padCol(timeStr, 14) +
        ' | ' +
        padCol(statusLabel, 12) +
        '| ' +
        padCol(deathStr, 20) +
        '| ' +
        (mvp.mapname || '');
      linePositions.push({ y: lineY, x: 31, mvp: mvp, timeStr: timeStr });
      lineY++;
      if (currentIdx === selectedIndex) {
        term.inverse(line + '\n');
      } else {
        term(line + '\n');
      }
      currentIdx++;
    });
  }

  if (wait.length > 0) {
    if (active.length > 0) {
      term.gray('-'.repeat(termWidth) + '\n');
      lineY++;
    }
    term.bold.cyan('=== WAIT FOR KILL ===\n');
    lineY++;
    wait.forEach(function (mvp) {
      if (currentIdx < scrollOffset) {
        currentIdx++;
        return;
      }
      if (currentIdx >= scrollOffset + termHeight - 10) return;
      let line =
        '[W] ' +
        getWidthPad(mvp.name.trim(), 24) +
        '| ' +
        padCol('', 14) +
        ' | ' +
        padCol('Wait kill', 12) +
        '| ' +
        padCol('', 20) +
        '| ' +
        (mvp.mapname || '');
      lineY++;
      if (currentIdx === selectedIndex) {
        term.inverse(line + '\n');
      } else {
        term(line + '\n');
      }
      currentIdx++;
    });
  }

  if (pending.length > 0) {
    if (active.length + wait.length > 0) {
      term.gray('-'.repeat(termWidth) + '\n');
      lineY++;
    }
    term.bold.cyan('=== SELECT TO KILL === (' + pending.length + ' items)\n');
    lineY++;
    let pendingStartIdx = active.length + wait.length;
    pending.forEach(function (mvp) {
      if (currentIdx < scrollOffset) {
        currentIdx++;
        return;
      }
      if (currentIdx >= scrollOffset + 25) return;
      let line =
        '[ ] ' +
        getWidthPad(mvp.name.trim(), 24) +
        '| ' +
        padCol('', 14) +
        ' | ' +
        padCol('Select', 12) +
        '| ' +
        padCol('', 20) +
        '| ' +
        (mvp.mapname || '');
      lineY++;
      if (currentIdx === selectedIndex) {
        term.inverse(line + '\n');
      } else {
        term(line + '\n');
      }
      currentIdx++;
    });
  }

  term.gray('-'.repeat(termWidth) + '\n');

  // let selectedMvp = getMvpAtIndex(selectedIndex);
  // if (selectedMvp) {
  //   term('\n');
  //   let statusLabel = selectedMvp.deathTime
  //     ? 'Active'
  //     : selectedMvp.isPinned
  //       ? 'Wait for kill'
  //       : 'Select to kill';
  //   term.moveTo(1, termHeight);
  //   term.bgWhite.black(' ');
  //   term(statusLabel);
  //   term(': ');
  //   term(selectedMvp.name);
  //   term(' | Map: ');
  //   term(selectedMvp.mapname || '?');
  //   term(' | Level: ');
  //   term((selectedMvp.stats && selectedMvp.stats.level) || '?');
  //   term(' | HP: ');
  //   term(
  //     selectedMvp.stats && selectedMvp.stats.health
  //       ? selectedMvp.stats.health.toLocaleString()
  //       : '?'
  //   );
  //   term(' ');
  // }
}

function updateTimeOnly() {
  linePositions.forEach(function (pos) {
    let respawnTime = getRespawnTime(pos.mvp);
    let newTimeStr = respawnTime !== null ? formatTime(respawnTime) : 'READY!';
    if (newTimeStr !== pos.timeStr) {
      term.moveTo(pos.x, pos.y);
      term('            ');
      term.moveTo(pos.x, pos.y);
      term(newTimeStr);
      pos.timeStr = newTimeStr;
    }
  });
}

setInterval(function () {
  if (!pauseMode) {
    render();
  }
}, 1000);

term.grabInput(true);

term.on('key', function (keyName, matches, data) {
  if (keyName === 'q' || keyName === 'Q' || keyName === 'ESCAPE') {
    term.grabInput(false);
    term.processExit();
    process.exit(0);
  }

  if (keyName === 'space' || keyName === 'SPACE' || keyName === ' ') {
    pauseMode = !pauseMode;
    render();
    return;
  }

  if (keyName === 's' || keyName === 'S') {
    sortMode = sortMode === 'name' ? 'map' : 'name';
    render();
    return;
  }

  if (keyName === 'LEFT') {
    currentServerIndex =
      (currentServerIndex - 1 + serverKeys.length) % serverKeys.length;
    currentServer = serverKeys[currentServerIndex];
    serverFile = SERVERS[currentServer];
    originalAllMvps = loadMvpData(serverFile);
    selectedIndex = 0;
    activeMvps = [];
    setupRealtimeSync(); // Refresh listener for new server
    render();
    return;
  }

  if (keyName === 'RIGHT') {
    currentServerIndex = (currentServerIndex + 1) % serverKeys.length;
    currentServer = serverKeys[currentServerIndex];
    serverFile = SERVERS[currentServer];
    originalAllMvps = loadMvpData(serverFile);
    selectedIndex = 0;
    activeMvps = [];
    setupRealtimeSync(); // Refresh listener for new server
    render();
    return;
  }

  updateLists();

  let total = active.length + wait.length + pending.length;

  if (keyName === 'HOME') {
    selectedIndex = 0;
    render();
    return;
  }

  if (keyName === 'END') {
    selectedIndex = total - 1;
    render();
    return;
  }

  if (keyName === 'UP' || keyName === 'up') {
    selectedIndex = Math.max(0, selectedIndex - 1);
    render();
    return;
  }

  if (keyName === 'DOWN' || keyName === 'down') {
    selectedIndex = Math.min(total - 1, selectedIndex + 1);
    render();
    return;
  }

  if (keyName === 'PAGE_UP' || keyName === 'page up') {
    selectedIndex = Math.max(0, selectedIndex - 10);
    render();
    return;
  }

  if (keyName === 'PAGE_DOWN' || keyName === 'page down') {
    selectedIndex = Math.min(total - 1, selectedIndex + 10);
    render();
    return;
  }

  if (keyName === 'CTRL_UP' || keyName === 'ctrl up') {
    selectedIndex = Math.max(0, selectedIndex - 5);
    render();
    return;
  }

  if (keyName === 'CTRL_DOWN' || keyName === 'ctrl down') {
    selectedIndex = Math.min(total - 1, selectedIndex + 5);
    render();
    return;
  }

  if (keyName === 'ENTER' || keyName === 'd' || keyName === 'D') {
    let mvp = getMvpAtIndex(selectedIndex);
    if (!mvp) return;
    let existing = activeMvps.find(function (a) {
      return a && a.id === mvp.id && (a.deathMap || a.mapname) === mvp.mapname;
    });

    if (keyName === 'd' || keyName === 'D') {
      if (existing) {
        existing.deathTime = Date.now();
        existing.isPinned = true;
      } else {
        let spawnInfo =
          mvp.spawn &&
          mvp.spawn.find(function (s) {
            return s.mapname === mvp.mapname;
          });
        activeMvps.push({
          id: mvp.id,
          name: mvp.name,
          dbname: mvp.dbname,
          spawn: mvp.spawn,
          mapname: mvp.mapname,
          respawnTime: spawnInfo ? spawnInfo.respawnTime : mvp.respawnTime,
          window: spawnInfo ? spawnInfo.window : 600000,
          stats: mvp.stats,
          isPinned: true,
          deathTime: Date.now(),
          deathMap: mvp.mapname,
        });
      }
    } else {
      if (existing) {
        if (existing.deathTime) {
          existing.deathTime = null;
          existing.isPinned = true;
        } else if (existing.isPinned) {
          existing.deathTime = Date.now();
        } else {
          activeMvps = activeMvps.filter(function (a) {
            return !(
              a &&
              a.id === mvp.id &&
              (a.deathMap || a.mapname) === mvp.mapname
            );
          });
        }
      } else {
        activeMvps.push({
          id: mvp.id,
          name: mvp.name,
          dbname: mvp.dbname,
          spawn: mvp.spawn,
          mapname: mvp.mapname,
          respawnTime: mvp.respawnTime,
          stats: mvp.stats,
          isPinned: true,
        });
      }
    }
    // Auto-save after update
    autoSaveToFirebase();
    render();
    return;
  }

  if (keyName === 'c' || keyName === 'C') {
    let mvp = getMvpAtIndex(selectedIndex);
    if (!mvp) return;
    activeMvps = activeMvps.filter(function (a) {
      return !(
        a &&
        a.id === mvp.id &&
        (a.deathMap || a.mapname) === mvp.mapname
      );
    });
    autoSaveToFirebase();
    render();
    return;
  }

  if (keyName === 'b' || keyName === 'B') {
    let mvp = getMvpAtIndex(selectedIndex);
    if (!mvp) return;
    let existing = activeMvps.find(function (a) {
      return a && a.id === mvp.id && (a.deathMap || a.mapname) === mvp.mapname;
    });
    if (existing && existing.deathTime) {
      existing.deathTime = null;
      existing.isPinned = true;
      autoSaveToFirebase();
      render();
    }
    return;
  }

  if (keyName === 'e' || keyName === 'E') {
    let mvp = getMvpAtIndex(selectedIndex);
    if (!mvp) return;
    let existing = activeMvps.find(function (a) {
      return a && a.id === mvp.id && (a.deathMap || a.mapname) === mvp.mapname;
    });
    console.log(
      '\nEdit time - type time + Enter, or just Enter for now, ESC does not work'
    );
    let wasPaused = pauseMode;
    pauseMode = true;
    term.grabInput(false);
    let rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('', function (ans) {
      rl.close();
      term.grabInput(true);
      pauseMode = wasPaused;
      if (!ans || ans.trim() === '') {
        console.log('\nCancelled - using current time');
        render();
        return;
      }
      let newTime;
      let parsed = parseSmartTime(ans);
      if (parsed) {
        newTime = parsed.getTime();
      } else {
        newTime = Date.now();
      }
      if (existing) {
        existing.deathTime = newTime;
      } else {
        let spawnInfo =
          mvp.spawn &&
          mvp.spawn.find(function (s) {
            return s.mapname === mvp.mapname;
          });
        activeMvps.push({
          id: mvp.id,
          name: mvp.name,
          dbname: mvp.dbname,
          spawn: mvp.spawn,
          mapname: mvp.mapname,
          respawnTime: spawnInfo ? spawnInfo.respawnTime : mvp.respawnTime,
          window: spawnInfo ? spawnInfo.window : 600000,
          stats: mvp.stats,
          isPinned: true,
          deathTime: newTime,
          deathMap: mvp.mapname,
        });
      }
      autoSaveToFirebase();
      render();
    });
    return;
  }

  if (keyName === 'c' || keyName === 'C') {
    let mvp = getMvpAtIndex(selectedIndex);
    if (!mvp) return;
    activeMvps = activeMvps.filter(function (a) {
      return !(
        a &&
        a.id === mvp.id &&
        (a.deathMap || a.mapname) === mvp.mapname
      );
    });
    render();
    return;
  }

  if (keyName === 'f' || keyName === 'F') {
    let wasPaused = pauseMode;
    pauseMode = true;
    term.grabInput(false);
    console.log('\nExport to file (e.g., mvp-backup.json): ');
    let rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('', function (filename) {
      rl.close();
      term.grabInput(true);
      pauseMode = wasPaused;
      let fs = require('fs');
      let exportData = {
        version: 1,
        server: currentServer,
        activeMvps: activeMvps,
        exportTime: Date.now(),
      };
      let filePath = path.join(__dirname, '..', filename || 'mvp-export.json');
      try {
        fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
        console.log('Exported to: ' + filePath);
      } catch (err) {
        console.log('Export failed: ' + err.message);
      }
      render();
    });
    return;
  }

  if (keyName === 'i' || keyName === 'I') {
    let wasPaused = pauseMode;
    pauseMode = true;
    term.grabInput(false);
    console.log('\nImport from file (e.g., mvp-export.json): ');
    let rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('', function (filename) {
      rl.close();
      term.grabInput(true);
      pauseMode = wasPaused;
      let fs = require('fs');
      let filePath = path.join(__dirname, '..', filename || 'mvp-export.json');
      try {
        let data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (data.activeMvps) {
          activeMvps = data.activeMvps;
          console.log('Imported ' + activeMvps.length + ' MVPs');
        }
      } catch (err) {
        console.log('Import failed: ' + err.message);
      }
      render();
    });
    return;
  }

  if (keyName === 'l' || keyName === 'L') {
    let wasPaused = pauseMode;
    pauseMode = true;
    let fs = require('fs');
    let savePath = path.join(__dirname, '..', 'data', 'mvp-save.json');
    let saveData = {
      version: 1,
      server: currentServer,
      activeMvps: activeMvps,
      saveTime: Date.now(),
    };
    try {
      fs.writeFileSync(savePath, JSON.stringify(saveData, null, 2));
    } catch (err) {}
    pauseMode = wasPaused;
    render();
    return;
  }

  if (keyName === 'r' || keyName === 'R') {
    let wasPaused = pauseMode;
    pauseMode = true;
    let fs = require('fs');
    let loadPath = path.join(__dirname, '..', 'data', 'mvp-save.json');
    try {
      let data = JSON.parse(fs.readFileSync(loadPath, 'utf-8'));
      if (data.activeMvps) {
        activeMvps = data.activeMvps;
        selectedIndex = 0;
      }
    } catch (err) {}
    pauseMode = wasPaused;
    render();
    return;
  }

  if (keyName === 'r' || keyName === 'R') {
    let fs = require('fs');
    let loadPath = path.join(__dirname, '..', 'data', 'mvp-save.json');
    try {
      let data = JSON.parse(fs.readFileSync(loadPath, 'utf-8'));
      if (data.activeMvps) {
        activeMvps = data.activeMvps;
      }
    } catch (err) {}
    render();
    return;
  }

  if (keyName === 'u' || keyName === 'U') {
    if (!firebaseDb) {
      console.log('\nFirebase not ready');
      render();
      return;
    }
    
    let dbPath = partyRoom 
      ? 'hunting/party/' + partyRoom + '/' + currentServer + '/mvps'
      : 'hunting/solo/' + cliNickname + '/' + currentServer + '/mvps';

    // Convert to web app compatible minimal format
    const minimalMvps = activeMvps.map((m) => ({
      id: m.id,
      deathTime: m.deathTime ? new Date(m.deathTime).toISOString() : null,
      deathMap: m.deathMap || null,
      deathPosition: m.deathPosition || null,
      isPinned: m.isPinned || false,
      updatedBy: cliNickname,
    }));
    
    const mvpsRef = ref(firebaseDb, dbPath);
    let wasPaused = pauseMode;
    pauseMode = true;
    
    set(mvpsRef, minimalMvps)
      .then(() => {
        console.log('\nSynced to Firebase!');
        setTimeout(() => {
          pauseMode = wasPaused;
          render();
        }, 1500);
      })
      .catch((err) => {
        console.log('\nFirebase error: ' + err.message);
        setTimeout(() => {
          pauseMode = wasPaused;
          render();
        }, 1500);
      });
    return;
  }

  if (keyName === 'y' || keyName === 'Y') {
    console.log('\nReal-time sync is already active!');
    setTimeout(() => {
      render();
    }, 1500);
    return;
  }
});

render();
