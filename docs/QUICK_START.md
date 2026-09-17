# Quick Start Guide

## ⚠️ Important: Run commands from the correct directory!

Make sure you're in the `code-conduit-express` directory before running npm commands:

```bash
# Navigate to the project directory
cd code-conduit-express

# Then run your commands
npm install
npm run dev
```

## 🚀 Starting the Development Server

1. **Open your terminal/command prompt**

2. **Navigate to the project directory:**
   ```bash
   cd D:\retoRUB.20\code-conduit-express
   ```

3. **Install dependencies (if not already done):**
   ```bash
   npm install
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   - The server will start on `http://localhost:8080`
   - Or check the terminal for the exact URL

## 📋 Available Commands

```bash
# Development
npm run dev          # Start dev server (port 8080)

# Build
npm run build        # Build for production
npm run build:dev    # Build in development mode
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
```

## 🔧 Troubleshooting

### "Could not read package.json" Error

**Problem:** You're in the wrong directory.

**Solution:** 
```bash
# Make sure you're in the code-conduit-express folder
cd D:\retoRUB.20\code-conduit-express
# Verify you're in the right place
ls package.json  # Should show package.json
```

### Port Already in Use

**Problem:** Port 8080 is already being used.

**Solution:**
- Stop other processes using port 8080, or
- Change the port in `vite.config.ts`

### Dependencies Not Installed

**Problem:** Missing node_modules.

**Solution:**
```bash
npm install
```

## ✅ Verification Checklist

Before running the app, verify:

- [ ] You're in `code-conduit-express` directory
- [ ] `package.json` exists in current directory
- [ ] `node_modules` folder exists
- [ ] `.env` file exists with Supabase credentials
- [ ] Dependencies are installed (`npm install` completed)

## 🌐 Accessing the App

Once `npm run dev` is running:

1. Look for output like:
   ```
   VITE v5.x.x  ready in xxx ms
   
   ➜  Local:   http://localhost:8080/
   ➜  Network: use --host to expose
   ```

2. Open `http://localhost:8080` in your browser

3. You should see the RETROHUB homepage!

## 🆘 Still Having Issues?

1. Check the browser console (F12) for errors
2. Check terminal output for error messages
3. Verify `.env` file has correct Supabase credentials
4. Try clearing cache: `rm -rf node_modules && npm install`

