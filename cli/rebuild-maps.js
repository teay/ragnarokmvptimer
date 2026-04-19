const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

const MAPS_DIR = path.join(__dirname, '../src/assets/mvp_maps');
const OUTPUT_DIR = path.join(__dirname, '../cli-c/data/maps');

async function rebuild() {
    const files = fs.readdirSync(MAPS_DIR).filter(f => f.endsWith('.png') && !f.endsWith('_raw.png'));
    
    for (const file of files) {
        const image = await Jimp.read(path.join(MAPS_DIR, file));
        image.resize(256, 256).greyscale(); // ย่อและทำขาวดำเพื่อให้ง่ายต่อการจัดการ
        
        const buffer = Buffer.alloc(65536);
        for (let i = 0; i < 65536; i++) {
            const x = i % 256;
            const y = Math.floor(i / 256);
            buffer[i] = Math.round(Jimp.intToRGBA(image.getPixelColor(x, y)).r / 32); // 0-7 levels
        }
        fs.writeFileSync(path.join(OUTPUT_DIR, file.replace('.png', '.col')), buffer);
        console.log(`Rebuilt: ${file}`);
    }
}
rebuild().catch(console.error);
