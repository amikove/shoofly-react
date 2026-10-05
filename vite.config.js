import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

// Liens de l'annuaire lisibles SANS JavaScript (robots d'IA, navigateurs sans JS) : le bloc
// <noscript> est généré par scripts/directory-ssg/generate.cjs (directory-data/annuaire-noscript.html,
// absent en dev sans build => rien n'est injecté). Inséré juste avant </body>, hors de #root.
const annuaireNoscript = () => ({
  name: 'annuaire-noscript-links',
  transformIndexHtml(html) {
    const file = fileURLToPath(new URL('./directory-data/annuaire-noscript.html', import.meta.url))
    if (!fs.existsSync(file)) return html
    return html.replace('</body>', `${fs.readFileSync(file, 'utf8')}</body>`)
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), annuaireNoscript()],
})
