# Samuel OS — Dashboard SAMI

Interface web de l'agent CEO SAMI. Construite avec React + Vite, déployée sur Vercel.

## Structure

```
samuel-os/
├── api/
│   └── chat.js          ← Serverless function (clé API côté serveur)
├── src/
│   ├── App.jsx          ← Composant principal
│   ├── systemPrompt.js  ← System prompt SAMI (modifier ici)
│   ├── index.css        ← Variables CSS globales
│   └── main.jsx         ← Entry point React
├── index.html
├── vite.config.js
├── vercel.json
└── package.json
```

## Déploiement sur Vercel

### Option A — Via GitHub (recommandé)

```bash
# 1. Créer un repo GitHub
git init
git add .
git commit -m "feat: Samuel OS v1.0"
git remote add origin https://github.com/TON_USERNAME/samuel-os.git
git push -u origin main

# 2. Aller sur vercel.com → New Project → importer le repo
# 3. Vercel détecte Vite automatiquement
# 4. Ajouter la variable d'environnement (voir ci-dessous)
# 5. Deploy
```

### Option B — Via Claude Code

```bash
# Dans le terminal Claude Code, dans le dossier samuel-os :
npx vercel --prod
# Suivre les instructions, puis ajouter la variable d'env dans le dashboard Vercel
```

## Variable d'environnement OBLIGATOIRE

Dans Vercel → Settings → Environment Variables :

```
ANTHROPIC_API_KEY = sk-ant-xxxxxxxxxxxx
```

Sans cette variable, SAMI ne peut pas appeler l'API Claude.

## Développement local

```bash
npm install
npm run dev
# → http://localhost:5173

# Pour tester la serverless function localement :
npm install -g vercel
vercel dev
# → http://localhost:3000
```

## Modifier le comportement de SAMI

Tout est dans `src/systemPrompt.js`. Modifie le `SAMI_SYSTEM_PROMPT` pour :
- Ajouter une nouvelle entreprise
- Changer le ton ou les règles
- Ajouter des commandes rapides

## Prochaines étapes (Phase 2)

- [ ] Connexion WhatsApp Business API (Twilio)
- [ ] MCP Google Calendar — lecture agenda réel
- [ ] MCP Gmail — tri emails en temps réel
- [ ] MCP Supabase — accès données SAMI CRM
- [ ] Brief quotidien automatique à 7h30 via cron Vercel
- [ ] Authentification (magic link email)
