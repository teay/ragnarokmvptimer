const blessed = require('blessed');
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
  var expanded = [];
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
  var activeKeys = {};
  activeMvps.forEach(function (m) {
    if (m && m.id) activeKeys[m.id + '-' + (m.deathMap || m.mapname)] = true;
  });
  return expandMvpsBySpawn(originalAllMvps).filter(function (mvp) {
    return !activeKeys[mvp.id + '-' + mvp.mapname];
  });
}

var active = [],
  wait = [],
  pending = [];
let selectedIndex = 0,
  pauseMode = false,
  sortMode = 'name';

const screen = blessed.screen({ smartCSR: true, title: 'Ragnarok MVP Timer' });
const header = blessed.box({
  top: 0,
  left: 0,
  width: '100%',
  height: 3,
  style: { fg: 'white', bg: 'blue' },
  content: '',
  tags: true,
});
const mvpList = blessed.box({
  top: 3,
  left: 0,
  width: '100%',
  height: '90%',
  style: { fg: 'white' },
  content: '',
  scrollable: true,
  mouse: true,
  tags: true,
});
const footer = blessed.box({
  bottom: 0,
  left: 0,
  width: '100%',
  height: 3,
  style: { fg: 'white', bg: 'black' },
  content: '',
  tags: true,
});
screen.append(header);
screen.append(mvpList);
screen.append(footer);

function formatTime(ms) {
  if (ms <= 0) return 'READY!';
  var s = Math.floor(ms / 1000),
    h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    sec = s % 60;
  return h > 0
    ? h + 'h ' + m + 'm ' + sec + 's'
    : m > 0
      ? m + 'm ' + sec + 's'
      : sec + 's';
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
  active = activeMvps.filter(function (m) {
    return m && m.deathTime;
  });
  wait = activeMvps.filter(function (m) {
    return m && m.isPinned && !m.deathTime;
  });
  pending = getAllMvps();

  active.sort(function (a, b) {
    var tA = getRespawnTime(a) || 0,
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

  var totalItems = active.length + wait.length + pending.length;
  if (selectedIndex >= totalItems) selectedIndex = Math.max(0, totalItems - 1);

  var modeLabel =
    'All (A:' +
    active.length +
    ' W:' +
    wait.length +
    ' P:' +
    pending.length +
    ')';
  header.setContent(
    ' [' +
      currentServer +
      '] MVP Timer | ' +
      (pauseMode ? 'PAUSED' : 'RUNNING') +
      ' | ' +
      modeLabel +
      ' | Up/Down:1 PgUp/Dn:10 Shift+Up/Dn:5 | Enter: Toggle | Space: Pause | S: Sort | Left/Right: Server | Q: Quit '
  );

  var listContent = '';
  var currentIdx = 0;

  if (active.length > 0) {
    listContent += '{blue}=== ACTIVE (Respawning) ==={/blue}\n';
    active.forEach(function (mvp) {
      var respawnTime = getRespawnTime(mvp);
      var timeStr = respawnTime !== null ? formatTime(respawnTime) : 'READY!';
      var line =
        '  [A] ' +
        mvp.name +
        ' '.repeat(Math.max(1, 26 - mvp.name.length)) +
        timeStr +
        ' ' +
        (mvp.mapname || '');
      listContent +=
        currentIdx === selectedIndex
          ? '{bold}{inverse}' + line + '{/inverse}{/bold}\n'
          : line + '\n';
      currentIdx++;
    });
  }

  if (wait.length > 0) {
    listContent +=
      (active.length > 0 ? '\n' : '') + '{blue}=== WAIT FOR KILL ==={/blue}\n';
    wait.forEach(function (mvp) {
      var line =
        '  [W] ' +
        mvp.name +
        ' '.repeat(Math.max(1, 26 - mvp.name.length)) +
        'Wait kill  ' +
        (mvp.mapname || '');
      listContent +=
        currentIdx === selectedIndex
          ? '{bold}{inverse}' + line + '{/inverse}{/bold}\n'
          : line + '\n';
      currentIdx++;
    });
  }

  if (pending.length > 0) {
    listContent +=
      (active.length + wait.length > 0 ? '\n' : '') +
      '{blue}=== SELECT TO KILL ==={/blue}\n';
    pending.forEach(function (mvp) {
      var line =
        '  [ ] ' +
        mvp.name +
        ' '.repeat(Math.max(1, 26 - mvp.name.length)) +
        'Select    ' +
        (mvp.mapname || '');
      listContent +=
        currentIdx === selectedIndex
          ? '{bold}{inverse}' + line + '{/inverse}{/bold}\n'
          : line + '\n';
      currentIdx++;
    });
  }

  mvpList.setContent(listContent);

  var selectedMvp = getMvpAtIndex(selectedIndex);
  if (selectedMvp) {
    var statusLabel = selectedMvp.deathTime
      ? 'Active'
      : selectedMvp.isPinned
        ? 'Wait for kill'
        : 'Select to kill';
    footer.setContent(
      ' ' +
        statusLabel +
        ': ' +
        selectedMvp.name +
        ' | Map: ' +
        (selectedMvp.mapname || '?') +
        ' | Level: ' +
        ((selectedMvp.stats && selectedMvp.stats.level) || '?') +
        ' | HP: ' +
        (selectedMvp.stats && selectedMvp.stats.health
          ? selectedMvp.stats.health.toLocaleString()
          : '?') +
        ' '
    );
  }
  screen.render();
}

setInterval(function () {
  if (!pauseMode) render();
}, 1000);

screen.key(['escape', 'q', 'Q'], function () {
  screen.destroy();
  process.exit(0);
});
screen.key(['space'], function () {
  pauseMode = !pauseMode;
  render();
});
screen.key(['s', 'S'], function () {
  sortMode = sortMode === 'name' ? 'map' : 'name';
  render();
});
screen.key(['left'], function () {
  currentServerIndex =
    (currentServerIndex - 1 + serverKeys.length) % serverKeys.length;
  currentServer = serverKeys[currentServerIndex];
  originalAllMvps = loadMvpData(currentServer);
  activeMvps = [];
  selectedIndex = 0;
  render();
});
screen.key(['right'], function () {
  currentServerIndex = (currentServerIndex + 1) % serverKeys.length;
  currentServer = serverKeys[currentServerIndex];
  originalAllMvps = loadMvpData(currentServer);
  activeMvps = [];
  selectedIndex = 0;
  render();
});

screen.key(['up'], function () {
  selectedIndex = Math.max(0, selectedIndex - 1);
  mvpList.setScroll(Math.max(0, selectedIndex - 8));
  render();
});
screen.key(['down'], function () {
  var total = active.length + wait.length + pending.length;
  selectedIndex = Math.min(total - 1, selectedIndex + 1);
  mvpList.setScroll(Math.max(0, selectedIndex - 8));
  render();
});

screen.key(['pageup'], function () {
  selectedIndex = Math.max(0, selectedIndex - 10);
  mvpList.setScroll(Math.max(0, selectedIndex - 8));
  render();
});
screen.key(['pagedown'], function () {
  var total = active.length + wait.length + pending.length;
  selectedIndex = Math.min(total - 1, selectedIndex + 10);
  mvpList.setScroll(Math.max(0, selectedIndex - 8));
  render();
});

screen.key(['S-up'], function () {
  selectedIndex = Math.max(0, selectedIndex - 5);
  mvpList.setScroll(selectedIndex);
  render();
});
screen.key(['S-down'], function () {
  var total = active.length + wait.length + pending.length;
  selectedIndex = Math.min(total - 1, selectedIndex + 5);
  mvpList.setScroll(selectedIndex);
  render();
});

screen.key(['enter', 'd', 'D'], function (e) {
  var mvp = getMvpAtIndex(selectedIndex);
  if (!mvp) return;
  var existing = activeMvps.find(function (a) {
    return a && a.id === mvp.id && (a.deathMap || a.mapname) === mvp.mapname;
  });

  if (e.key === 'd' || e.key === 'D') {
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
  selectedIndex = 0;
  render();
});

screen.key(['c', 'C'], function () {
  var mvp = getMvpAtIndex(selectedIndex);
  if (!mvp) return;
  activeMvps = activeMvps.filter(function (a) {
    return !(a && a.id === mvp.id && (a.deathMap || a.mapname) === mvp.mapname);
  });
  render();
});

render();
