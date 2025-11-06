import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const envPath = path.join(root, '.env');
const devVarsPath = path.join(root, '.dev.vars');

function parseEnv(content) {
    const lines = content.split(/\r?\n/);
    const out = {};
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const idx = trimmed.indexOf('=');
        if (idx === -1) continue;
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        out[key] = val;
    }
    return out;
}

if (!fs.existsSync(envPath)) {
    console.warn('[sync-env] .env bulunamadı, .dev.vars oluşturulmadı');
    process.exit(0);
}

const raw = fs.readFileSync(envPath, 'utf8');
const env = parseEnv(raw);

const allowed = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
];

let output = '';
for (const key of allowed) {
    if (env[key]) {
        const val = env[key].replaceAll('"', '\\"');
        output += `${key}="${val}"\n`;
    }
}

fs.writeFileSync(devVarsPath, output, 'utf8');
console.log('[sync-env] .env -> .dev.vars senkron edildi');


