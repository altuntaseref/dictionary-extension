// Generate placeholder PNG icons for the extension without external deps.
// Run: node extension/scripts/generate-icons.mjs

import fs from 'node:fs'
import path from 'node:path'

const outDir = path.join(process.cwd(), 'extension', 'src', 'icons')
fs.mkdirSync(outDir, { recursive: true })

// 1x1 transparent PNG base64 (placeholder). Chrome accepts it, but you can
// replace these files later with real 16/48/128 icons.
const transparentPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+Qn4kAAAAASUVORK5CYII='

const files = [
  ['icon16.png', transparentPngBase64],
  ['icon48.png', transparentPngBase64],
  ['icon128.png', transparentPngBase64],
]

for (const [name, b64] of files) {
  fs.writeFileSync(path.join(outDir, name), Buffer.from(b64, 'base64'))
}

console.log(`[icons] Wrote placeholder icons to ${outDir}`)


