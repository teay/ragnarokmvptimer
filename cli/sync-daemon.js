const { readFileSync, existsSync, writeFileSync, watch } = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, onValue, set } = require('firebase/database');

// --- Configuration ---
const SAVE_FILE = path.join(__dirname, '..', 'cli-c', 'data', 'mvp-save.json');
const SERVER_DATA_DIR = path.join(__dirname, '..', 'cli-c', 'data');
let currentServer = 'iRO'; 
let cliNickname = 'CLI-C';
let partyRoom = '';

function loadConfig() {
    const envPath = path.join(__dirname, '..', '.env');
    if (!existsSync(envPath)) return {};
    const content = readFileSync(envPath, 'utf-8');
    const config = {};
    content.split('\n').forEach(line => {
        const [key, ...val] = line.split('=');
        if (key && val) config[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
    });
    return config;
}

const env = loadConfig();
const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: env.VITE_FIREBASE_DATABASE_URL,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

function getMvpMasterData(server) {
    const p = path.join(SERVER_DATA_DIR, `${server}.json`);
    if (!existsSync(p)) return [];
    return JSON.parse(readFileSync(p, 'utf-8'));
}

let masterMvps = getMvpMasterData(currentServer);
let isUpdatingFromFile = false;

// --- Firebase -> Local JSON ---
function setupFirebaseListener() {
    const dbPath = partyRoom 
        ? `hunting/party/${partyRoom}/${currentServer}/mvps`
        : `hunting/solo/${cliNickname}/${currentServer}/mvps`;

    console.log(`[*] Syncing with Firebase: ${dbPath}`);
    const mvpsRef = ref(db, dbPath);

    onValue(mvpsRef, (snapshot) => {
        if (isUpdatingFromFile) return; 
        
        const data = snapshot.val();
        
        // FIX: ถ้าไม่มีข้อมูล (null) ต้องส่ง [] ไปให้ C เพื่อล้างสถานะ
        if (!data) {
            writeFileSync(SAVE_FILE, JSON.stringify([], null, 2));
            console.log(`[Firebase -> C] Cleared all MVPs`);
            return;
        }

        const remoteMvps = Array.isArray(data) ? data : Object.values(data);
        const localFormat = {
            server: currentServer,
            updatedAt: new Date().toISOString(),
            activeMvps: remoteMvps.map(remote => {
                const master = masterMvps.find(m => m.id === remote.id);
                if (!master) return null;
                
                const mapName = remote.deathMap || remote.mapname || master.spawn[0].mapname;
                const spawnInfo = master.spawn.find(s => s.mapname === mapName) || master.spawn[0];

                let zone = 0; 
                if (remote.deathTime) zone = 2; // ACTIVE
                else if (remote.isPinned || remote.id) zone = 1; // WAIT
                
                return {
                    id: remote.id,
                    name: master.name,
                    deathTime: remote.deathTime ? new Date(remote.deathTime).getTime() / 1000 : 0,
                    zone: zone,
                    spawn: [spawnInfo]
                };
            }).filter(Boolean)
        };

        writeFileSync(SAVE_FILE, JSON.stringify(localFormat, null, 2));
        console.log(`[Firebase -> C] Updated ${localFormat.length} MVPs`);
    });
}

function setupFileWatcher() {
    console.log(`[*] Watching for changes in: ${SAVE_FILE}`);
    let debounceTimer;
    watch(SAVE_FILE, (event) => {
        if (event === 'change') {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                uploadToFirebase();
            }, 500);
        }
    });
}

function uploadToFirebase() {
    try {
        const content = readFileSync(SAVE_FILE, 'utf-8');
        if (!content || content === '[]') {
            // ถ้าไฟล์ว่างเปล่า ให้ลบใน Firebase ด้วย
            updateFirebase([]);
            return;
        }
        const data = JSON.parse(content);
        const localMvps = Array.isArray(data) ? data : (data.activeMvps || []);
        
        const webFormat = localMvps.map(m => ({
            id: m.id,
            deathTime: m.deathTime > 0 ? new Date(m.deathTime * 1000).toISOString() : null,
            deathMap: m.spawn[0].mapname,
            isPinned: true,
            updatedBy: cliNickname
        }));

        updateFirebase(webFormat);
    } catch (e) {
        console.error(`[Error] Failed to upload: ${e.message}`);
        isUpdatingFromFile = false;
    }
}

function updateFirebase(data) {
    const dbPath = partyRoom 
        ? `hunting/party/${partyRoom}/${currentServer}/mvps`
        : `hunting/solo/${cliNickname}/${currentServer}/mvps`;

    isUpdatingFromFile = true;
    set(ref(db, dbPath), data).then(() => {
        console.log(`[C -> Firebase] Synced ${data.length} items`);
        setTimeout(() => { isUpdatingFromFile = false; }, 1000);
    }).catch(err => {
        console.error(`[Firebase Error] ${err.message}`);
        isUpdatingFromFile = false;
    });
}

const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--name') cliNickname = args[++i];
    if (args[i] === '--party') partyRoom = args[++i];
    if (args[i] === '--server') currentServer = args[++i];
}

masterMvps = getMvpMasterData(currentServer);
setupFirebaseListener();
setupFileWatcher();
