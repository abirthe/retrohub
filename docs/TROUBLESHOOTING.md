# Troubleshooting Guide

## Common Issues and Solutions

### 1. App Not Loading / White Screen

**Check:**
- Open browser console (F12) and look for errors
- Verify environment variables are set in `.env` file
- Make sure dev server is running: `npm run dev`

**Solution:**
```bash
# Stop the server (Ctrl+C)
# Clear cache and reinstall
rm -rf node_modules
npm install
npm run dev
```

### 2. Supabase Connection Errors

**Symptoms:**
- "Failed to fetch" errors
- Authentication not working
- Products not loading

**Solution:**
1. Check `.env` file exists in root directory
2. Verify these variables are set:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   ```
3. Restart dev server after changing `.env`

### 3. Cart Not Working

**Symptoms:**
- Items not adding to cart
- Cart count not updating

**Solution:**
- Check browser console for errors
- Verify localStorage is enabled in browser
- Clear browser cache and try again

### 4. Routing Issues

**Symptoms:**
- 404 errors on navigation
- Links not working

**Solution:**
- Verify all routes are defined in `App.tsx`
- Check that React Router is properly installed
- Clear browser cache

### 5. TypeScript Errors

**Symptoms:**
- Red squiggly lines in IDE
- Build fails

**Solution:**
- These are often false positives from language server
- Run `npm run build` to verify actual compilation
- If build succeeds, the code is fine

### 6. Styling Issues

**Symptoms:**
- Styles not applying
- Components look broken

**Solution:**
- Verify Tailwind is configured correctly
- Check `tailwind.config.ts` exists
- Restart dev server

## Quick Diagnostic Commands

```bash
# Check if dependencies are installed
npm list react react-dom

# Verify build works
npm run build

# Check for TypeScript errors
npx tsc --noEmit

# Clear all caches
rm -rf node_modules .vite dist
npm install
```

## Getting Help

If issues persist:
1. Check browser console for specific error messages
2. Check terminal output when running `npm run dev`
3. Verify all environment variables are set
4. Ensure Supabase project is active and accessible

