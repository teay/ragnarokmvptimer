const term = require('terminal-kit').terminal;
const { readFileSync, existsSync } = require('fs');
const path = require('path');

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

let originalAllMvps = loadMvpData(currentServer);
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
    else if (code >= 0x0400 && code <= 0x04ff) width += 2;
    else if (code >= 0x0500 && code <= 0x052f) width += 2;
    else if (code >= 0x0530 && code <= 0x058f) width += 2;
    else if (code >= 0x0590 && code <= 0x05ff) width += 2;
    else if (code >= 0x0600 && code <= 0x06ff) width += 2;
    else if (code >= 0x0700 && code <= 0x074f) width += 2;
    else if (code >= 0x0750 && code <= 0x077f) width += 2;
    else if (code >= 0x08a0 && code <= 0x08ff) width += 2;
    else if (code >= 0x0900 && code <= 0x097f) width += 2;
    else if (code >= 0x0980 && code <= 0x09ff) width += 2;
    else if (code >= 0x0a00 && code <= 0x0a7f) width += 2;
    else if (code >= 0x0a80 && code <= 0x0aff) width += 2;
    else if (code >= 0x0b00 && code <= 0x0b7f) width += 2;
    else if (code >= 0x0b80 && code <= 0x0bff) width += 2;
    else if (code >= 0x0c00 && code <= 0x0c7f) width += 2;
    else if (code >= 0x0c80 && code <= 0x0cff) width += 2;
    else if (code >= 0x0d00 && code <= 0x0d7f) width += 2;
    else if (code >= 0x0e80 && code <= 0x0eff) width += 2;
    else if (code >= 0x1000 && code <= 0x109f) width += 2;
    else if (code >= 0x10a0 && code <= 0x10ff) width += 2;
    else if (code >= 0x1100 && code <= 0x11ff) width += 2;
    else if (code >= 0x1200 && code <= 0x137f) width += 2;
    else if (code >= 0x1380 && code <= 0x139f) width += 2;
    else if (code >= 0x13a0 && code <= 0x13ff) width += 2;
    else if (code >= 0x1400 && code <= 0x167f) width += 2;
    else if (code >= 0x1680 && code <= 0x169f) width += 2;
    else if (code >= 0x16a0 && code <= 0x16ff) width += 2;
    else if (code >= 0x1700 && code <= 0x171f) width += 2;
    else if (code >= 0x1720 && code <= 0x173f) width += 2;
    else if (code >= 0x1740 && code <= 0x175f) width += 2;
    else if (code >= 0x1760 && code <= 0x177f) width += 2;
    else if (code >= 0x1780 && code <= 0x17ff) width += 2;
    else if (code >= 0x1800 && code <= 0x18af) width += 2;
    else if (code >= 0x1900 && code <= 0x194f) width += 2;
    else if (code >= 0x1950 && code <= 0x197f) width += 2;
    else if (code >= 0x1980 && code <= 0x19df) width += 2;
    else if (code >= 0x19e0 && code <= 0x19ff) width += 2;
    else if (code >= 0x1a00 && code <= 0x1a1f) width += 2;
    else if (code >= 0x1b00 && code <= 0x1b7f) width += 2;
    else if (code >= 0x1b80 && code <= 0x1bbf) width += 2;
    else if (code >= 0x1c00 && code <= 0x1c4f) width += 2;
    else if (code >= 0x1c50 && code <= 0x1c7f) width += 2;
    else if (code >= 0x1d00 && code <= 0x1d7f) width += 2;
    else if (code >= 0x1d80 && code <= 0x1dbf) width += 2;
    else if (code >= 0x1dc0 && code <= 0x1dff) width += 2;
    else if (code >= 0x1e00 && code <= 0x1eff) width += 2;
    else if (code >= 0x1f00 && code <= 0x1fff) width += 2;
    else if (code >= 0x2000 && code <= 0x206f) width += 1;
    else if (code >= 0x2070 && code <= 0x209f) width += 1;
    else if (code >= 0x20a0 && code <= 0x20cf) width += 1;
    else if (code >= 0x20d0 && code <= 0x20ff) width += 1;
    else if (code >= 0x2100 && code <= 0x214f) width += 1;
    else if (code >= 0x2150 && code <= 0x218f) width += 1;
    else if (code >= 0x2190 && code <= 0x21ff) width += 1;
    else if (code >= 0x2200 && code <= 0x22ff) width += 1;
    else if (code >= 0x2300 && code <= 0x23ff) width += 1;
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

  term.clear();
  term.moveTo(1, 1);

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
    ' | Up/Down:1 PgUp/Dn:10 Shift+Up/Dn:5 | Enter: Toggle | Space: Pause | S: Sort | Left/Right: Server | Q: Quit\n'
  );

  term.bold.cyan(
    '#  Boss Name              Respawn     | Died At              | Map\n'
  );
  term.gray('-'.repeat(85) + '\n');

  let currentIdx = 0;

  if (active.length > 0) {
    term.bold.blue('=== ACTIVE (Respawning) ===\n');
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
        ' ' +
        padCol(timeStr, 11) +
        '| ' +
        padCol(deathStr, 20) +
        '| ' +
        (mvp.mapname || '');
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
    term.bold.blue('=== WAIT FOR KILL ===\n');
    wait.forEach(function (mvp) {
      if (currentIdx < scrollOffset) {
        currentIdx++;
        return;
      }
      if (currentIdx >= scrollOffset + termHeight - 10) return;
      let line =
        '[W] ' +
        padCol(mvp.name.trim(), 24) +
        ' ' +
        padCol('Wait kill', 11) +
        '| ' +
        padCol('', 20) +
        '| ' +
        (mvp.mapname || '');
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
    term.bold.blue('=== SELECT TO KILL ===\n');
    pending.forEach(function (mvp) {
      if (currentIdx < scrollOffset) {
        currentIdx++;
        return;
      }
      if (currentIdx >= scrollOffset + termHeight - 10) return;
      let line =
        '[ ] ' +
        padCol(mvp.name.trim(), 24) +
        ' ' +
        padCol('Select', 11) +
        '| ' +
        padCol('', 20) +
        '| ' +
        (mvp.mapname || '');
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

setInterval(function () {
  if (!pauseMode) {
    let changed = false;
    activeMvps.forEach(function (m) {
      if (m && m.deathTime) {
        let remaining = m.deathTime + m.respawnTime - Date.now();
        if (remaining <= 0) changed = true;
      }
    });
    if (changed) render();
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
    originalAllMvps = loadMvpData(currentServer);
    activeMvps = [];
    selectedIndex = 0;
    render();
    return;
  }

  if (keyName === 'RIGHT') {
    currentServerIndex = (currentServerIndex + 1) % serverKeys.length;
    currentServer = serverKeys[currentServerIndex];
    originalAllMvps = loadMvpData(currentServer);
    activeMvps = [];
    selectedIndex = 0;
    render();
    return;
  }

  updateLists();

  let total = active.length + wait.length + pending.length;

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

  if (keyName === 'S-UP') {
    selectedIndex = Math.max(0, selectedIndex - 5);
    render();
    return;
  }

  if (keyName === 'S-DOWN') {
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
});

render();
