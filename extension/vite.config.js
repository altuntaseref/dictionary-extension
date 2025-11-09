import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync, statSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Copy manifest and other files after build
function copyManifest() {
  return {
    name: 'copy-manifest',
    closeBundle() {
      // First, copy all files except manifest.json
      const filesToCopy = [
        { from: 'src/icons', to: 'dist/src/icons' },
        { from: 'src/background.js', to: 'dist/src/background.js' },
        { from: 'src/contentScript.js', to: 'dist/src/contentScript.js' },
      ]

      filesToCopy.forEach(({ from, to }) => {
        try {
          if (statSync(from).isDirectory()) {
            if (!existsSync(to)) {
              mkdirSync(to, { recursive: true })
            }
            const files = readdirSync(from)
            files.forEach(file => {
              copyFileSync(
                join(from, file),
                join(to, file)
              )
            })
          } else {
            const dir = dirname(to)
            if (!existsSync(dir)) {
              mkdirSync(dir, { recursive: true })
            }
            copyFileSync(from, to)
          }
        } catch (err) {
          console.warn(`Failed to copy ${from} to ${to}:`, err.message)
        }
      })
      
      // Move and fix popup.html from dist/src/ to dist/
      try {
        const popupHtmlPath = join(__dirname, 'dist', 'src', 'popup.html')
        const popupHtmlDest = join(__dirname, 'dist', 'popup.html')
        if (existsSync(popupHtmlPath)) {
          // Read and fix paths
          let content = readFileSync(popupHtmlPath, 'utf8')
          // Fix relative paths: ../js/ -> ./js/ and ../css/ -> ./css/
          content = content.replace(/\.\.\/js\//g, './js/')
          content = content.replace(/\.\.\/css\//g, './css/')
          writeFileSync(popupHtmlDest, content, 'utf8')
        }
      } catch (err) {
        console.warn('Failed to move popup.html:', err.message)
      }

      // Finally, copy and fix manifest.json with correct paths for dist/
      try {
        const manifestPath = join(__dirname, 'manifest.json')
        const manifestDest = join(__dirname, 'dist', 'manifest.json')
        if (existsSync(manifestPath)) {
          let manifestContent = readFileSync(manifestPath, 'utf8')
          const manifest = JSON.parse(manifestContent)
          
          // Fix paths for dist/ folder (dist/ is the root for Chrome extension)
          manifest.action.default_popup = 'popup.html'
          // Other paths are already correct (src/icons, src/background.js, etc.)
          
          writeFileSync(manifestDest, JSON.stringify(manifest, null, 2), 'utf8')
        }
      } catch (err) {
        console.warn('Failed to copy/fix manifest.json:', err.message)
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), copyManifest()],
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup.html'),
      },
      output: {
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name
          if (name === 'popup.html') {
            return '[name][extname]'
          }
          if (name.endsWith('.css')) {
            return 'css/[name][extname]'
          }
          return 'assets/[name][extname]'
        },
      },
    },
    emptyOutDir: false, // Don't empty, we copy files manually
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})

