const term = require('terminal-kit').terminal;
const { readFileSync, existsSync } = require('fs');
const path = require('path');
const readline = require('readline');

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
  return mvp.deathTime && mvp.respawnTime
    ? mvp.deathTime + mvp.respawnTime - Date.now()
    : null;
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
  let totalItems = active.length + wait.length + pending.length;

  let scrollOffset = 0;
  if (totalItems > termHeight - 10) {
    let visibleItems = termHeight - 10;
    scrollOffset = Math.max(0, selectedIndex - Math.floor(visibleItems / 2));
    let maxScroll = totalItems - visibleItems;
    scrollOffset = Math.min(scrollOffset, maxScroll);
  }

  linePositions = [];
  let lineY = 1;

  term.clear();
  term.moveTo(1, 1);
  lineY++;

  let modeLabel =
    'All (A:' +
    active.length +
    ' W:' +
    wait.length +
    ' P:' +
    pending.length +
    ')';
  term.bold.blue(' [');
  term(currentServer);
  term.blue('] MVP Timer | ');
  term(pauseMode ? '{red}PAUSED{/red}' : '{green}RUNNING{/green}');
  term.blue(' | ');
  term(modeLabel);
  term.blue(
    ' | Up/Down:1 PgUp/Dn:10 Ctrl+Up/Dn:5 Home/End | Enter: Toggle | E: Edit Time | Space: Pause | S: Sort | Left/Right: Server | Q: Quit\n'
  );

  term.bold.cyan(
    '# Boss Name               Respawn       | Died At              | Map\n'
  );
  term.gray('-'.repeat(85) + '\n');
  lineY = 5;

  let currentIdx = 0;

  if (active.length > 0) {
    term.bold.blue('=== ACTIVE (Respawning) ===\n');
    lineY++;
    active.forEach(function (mvp) {
      if (currentIdx < scrollOffset) {
        currentIdx++;
        return;
      }
      if (currentIdx >= scrollOffset + termHeight - 10) return;
      let respawnTime = getRespawnTime(mvp);
      let timeStr = respawnTime !== null ? formatTime(respawnTime) : 'READY!';
      let deathStr = mvp.deathTime ? formatDeathTime(mvp.deathTime) : '';
      let line =
        '[A] ' +
        padCol(mvp.name.trim(), 24) +
        '  ' +
        padCol(timeStr, 12) +
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
    if (active.length > 0) term('\n');
    lineY++;
    term.bold.blue('=== WAIT FOR KILL ===\n');
    lineY++;
    wait.forEach(function (mvp) {
      if (currentIdx < scrollOffset) {
        currentIdx++;
        return;
      }
      if (currentIdx >= scrollOffset + termHeight - 10) return;
      let line =
        '[W] ' +
        padCol(mvp.name.trim(), 24) +
        '  ' +
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
    if (active.length + wait.length > 0) term('\n');
    lineY++;
    term.bold.blue('=== SELECT TO KILL ===\n');
    lineY++;
    pending.forEach(function (mvp) {
      if (currentIdx < scrollOffset) {
        currentIdx++;
        return;
      }
      if (currentIdx >= scrollOffset + termHeight - 10) return;
      let line =
        '[ ] ' +
        padCol(mvp.name.trim(), 24) +
        '  ' +
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

  let selectedMvp = getMvpAtIndex(selectedIndex);
  if (selectedMvp) {
    term('\n');
    let statusLabel = selectedMvp.deathTime
      ? 'Active'
      : selectedMvp.isPinned
        ? 'Wait for kill'
        : 'Select to kill';
    term.moveTo(1, termHeight);
    term.bgWhite.black(' ');
    term(statusLabel);
    term(': ');
    term(selectedMvp.name);
    term(' | Map: ');
    term(selectedMvp.mapname || '?');
    term(' | Level: ');
    term((selectedMvp.stats && selectedMvp.stats.level) || '?');
    term(' | HP: ');
    term(
      selectedMvp.stats && selectedMvp.stats.health
        ? selectedMvp.stats.health.toLocaleString()
        : '?'
    );
    term(' ');
  }
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
    updateTimeOnly();
  }
}, 1000);

term.grabInput(true);

term.on('key', function (keyName, matches, data) {
  if (keyName === 'q' || keyName === 'Q' || keyName === 'ESCAPE') {
    term.grabInput(false);
    term.processExit();
    process.exit(0);
  }

  if (keyName === 'space') {
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
    let serverFile = SERVERS[currentServer];
    originalAllMvps = loadMvpData(serverFile);
    activeMvps = [];
    selectedIndex = 0;
    render();
    return;
  }

  if (keyName === 'RIGHT') {
    currentServerIndex = (currentServerIndex + 1) % serverKeys.length;
    currentServer = serverKeys[currentServerIndex];
    let serverFile = SERVERS[currentServer];
    originalAllMvps = loadMvpData(serverFile);
    activeMvps = [];
    selectedIndex = 0;
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

  if (keyName === 'UP') {
    selectedIndex = Math.max(0, selectedIndex - 1);
    render();
    return;
  }

  if (keyName === 'DOWN') {
    selectedIndex = Math.min(total - 1, selectedIndex + 1);
    render();
    return;
  }

  if (keyName === 'PAGE_UP') {
    selectedIndex = Math.max(0, selectedIndex - 10);
    render();
    return;
  }

  if (keyName === 'PAGE_DOWN') {
    selectedIndex = Math.min(total - 1, selectedIndex + 10);
    render();
    return;
  }

  if (keyName === 'CTRL_UP') {
    selectedIndex = Math.max(0, selectedIndex - 5);
    render();
    return;
  }

  if (keyName === 'CTRL_DOWN') {
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
        activeMvps.push({
          id: mvp.id,
          name: mvp.name,
          dbname: mvp.dbname,
          spawn: mvp.spawn,
          mapname: mvp.mapname,
          respawnTime: mvp.respawnTime,
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
    render();
    return;
  }

  if (keyName === 'e' || keyName === 'E') {
    let mvp = getMvpAtIndex(selectedIndex);
    if (!mvp) return;
    let existing = activeMvps.find(function (a) {
      return a && a.id === mvp.id && (a.deathMap || a.mapname) === mvp.mapname;
    });
    if (!existing || !existing.deathTime) return;
    console.log('\nCurrent: ' + formatDeathTime(existing.deathTime));
    console.log('Time (7.30 or 730) or Enter=now: ');
    let wasPaused = pauseMode;
    pauseMode = true;
    term.grabInput(false);
    let rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('', function (ans) {
      rl.close();
      pauseMode = wasPaused;
      term.grabInput(true);
      let newTime;
      let parsed = parseSmartTime(ans);
      if (parsed) {
        newTime = parsed.getTime();
      } else {
        newTime = Date.now();
      }
      existing.deathTime = newTime;
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
});

render();
