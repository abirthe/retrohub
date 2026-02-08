# Deploying Your RetroHub Store 🚀

Since your project is built with **Vite + React** and uses **Supabase** (Backend-as-a-Service), you don't need a complex server. You can deploy the frontend as a static site.

## Option 1: Vercel (Recommended for Best Link & Performance) 🏆
This is the easiest method. It connects directly to your GitHub repository and gives you a professional link (e.g., `retrohub-store.vercel.app`).

### Prerequisites
1. Push your latest code to a GitHub repository.
2. Have your Supabase URL and Key ready.

### Steps
1. **Sign Up/Login to Vercel**: Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. **Import Project**: Click **"Add New..."** > **"Project"** and select your `retrohub` repository.
3. **Configure Build Settings**:
   - **Framework Preset**: Vite (should be auto-detected).
   - **Root Directory**: `./` (default).
4. **Environment Variables**:
   Under the **"Environment Variables"** section, add the following from your `.env` file:
   - `VITE_SUPABASE_URL`: (Your URL starting with `https://...`)
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: (Your Key starting with `sb_...`)
   - `VITE_SUPABASE_PROJECT_ID`: (Your project ID)
5. **Deploy**: Click **"Deploy"**.

**Result**: You get a live URL like `https://retrohub.vercel.app`.

---

## Option 2: GitHub Pages (Totally Free, Hosted on GitHub) 📦
You can host directly on GitHub, but the URL will be `username.github.io/repo-name`.

### Steps
1. **Update `vite.config.ts`**:
   Add the `base` property to match your repository name.
   ```typescript
   export default defineConfig({
     base: '/your-repo-name/', // REPLACE THIS with your actual repo name
     plugins: [react(), ...],
     // ...
   })
   ```

2. **Install `gh-pages`**:
   Run this command in your terminal:
   ```bash
   npm install gh-pages --save-dev
   ```

3. **Update `package.json`**:
   Add these scripts:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist",
     // ... other scripts
   }
   ```

4. **Deploy**:
   Run:
   ```bash
   npm run deploy
   ```

**Important Note for GitHub Pages**: Since this is a Single Page Application (SPA), refreshing pages like `/about` might give a 404 error on GitHub Pages. Vercel handles this automatically, which is why **Option 1 is recommended**.

---

## Option 3: Netlify (Alternative to Vercel)
Similar to Vercel, drag and drop connection to GitHub.

1. Login to Netlify with GitHub.
2. "New site from Git".
3. Choose your repo.
4. Add Environment Variables in "Site settings" > "Build & deploy" > "Environment".
5. Deploy.
