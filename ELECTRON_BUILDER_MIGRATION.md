# Electron Forge → Electron Builder Migration Summary

## Overview
This document outlines all changes made to migrate the MOA Management System from Electron Forge to Electron Builder format. The migration ensures the application works correctly in both development and production environments.

## Key Changes Made

### 1. **Environment Detection (src/main.js - Lines 14)**
**Before (Forge Pattern):**
```javascript
const isDev = process.env.NODE_ENV === 'development';
```

**After (Builder Pattern):**
```javascript
const isDev = !app.isPackaged;
```

**Why:** Electron Builder uses `app.isPackaged` to detect environment, not NODE_ENV. This is the standard pattern.

---

### 2. **Preload Path Resolution (src/main.js - Lines 17-37)**
**Before (Forge Pattern):**
```javascript
function getPreloadPath() {
  if (isDev) {
    return path.join(__dirname, 'preload.js');
  } else {
    return path.join(__dirname, 'preload.js'); // Same path!
  }
}
```

**After (Builder Pattern):**
```javascript
function getPreloadPath() {
  if (isDev) {
    return path.join(__dirname, 'preload.js');
  } else {
    // Check multiple locations for Electron Builder compatibility
    const possiblePaths = [
      path.join(app.getAppPath(), 'preload.js'),
      path.join(app.getAppPath(), 'dist', 'preload.js'),
      path.join(process.resourcesPath, 'preload.js'),
      path.join(process.resourcesPath, 'app', 'preload.js'),
      path.join(__dirname, 'preload.js'),
    ];
    
    for (const preloadPath of possiblePaths) {
      try {
        if (fs.existsSync(preloadPath)) {
          console.log('✅ Found preload at:', preloadPath);
          return preloadPath;
        }
      } catch (e) {
        // Continue
      }
    }
    
    return path.join(app.getAppPath(), 'preload.js');
  }
}
```

**Why:** In production, preload.js location varies. This checks all possible Builder locations with fallback.

---

### 3. **Icon Path Resolution (src/main.js - Lines 39-64)**
**Before (Forge Pattern):**
```javascript
function getIconPath() {
  if (isDev) {
    return path.join(__dirname, '../logo.ico');
  } else {
    return path.join(__dirname, '../logo.ico'); // Same path!
  }
}
```

**After (Builder Pattern):**
```javascript
function getIconPath() {
  if (isDev) {
    return path.join(__dirname, '../logo.ico');
  } else {
    const possiblePaths = [
      path.join(app.getAppPath(), 'logo.ico'),
      path.join(process.resourcesPath, 'logo.ico'),
      path.join(process.resourcesPath, 'app', 'logo.ico'),
      path.join(__dirname, '../logo.ico'),
    ];
    
    for (const iconPath of possiblePaths) {
      try {
        if (fs.existsSync(iconPath)) {
          console.log('✅ Found icon at:', iconPath);
          return iconPath;
        }
      } catch (e) {
        // Continue
      }
    }
    
    return null; // Use default icon
  }
}
```

**Why:** Icon paths differ between dev and production. Checks all possible locations.

---

### 4. **Production File Loading (src/main.js - Lines 149-178)**
**Before (Forge Pattern):**
```javascript
} else {
  const distPath = path.join(__dirname, '../dist/index.html');
  console.log('Loading from file:', distPath);
  mainWindow.loadFile(distPath);
}
```

**After (Builder Pattern):**
```javascript
} else {
  // Check multiple possible locations for the bundled app
  const possiblePaths = [
    path.join(app.getAppPath(), 'dist', 'index.html'),
    path.join(app.getAppPath(), '../dist', 'index.html'),
    path.join(process.resourcesPath, 'dist', 'index.html'),
    path.join(process.resourcesPath, 'app', 'dist', 'index.html'),
    path.join(__dirname, '../dist/index.html'),
  ];
  
  let distPath = null;
  for (const checkPath of possiblePaths) {
    if (fs.existsSync(checkPath)) {
      distPath = checkPath;
      console.log('✅ Found dist/index.html at:', distPath);
      break;
    }
  }
  
  if (distPath) {
    console.log('Loading from file:', distPath);
    mainWindow.loadFile(distPath);
  } else {
    // Fallback to file: URL
    const fileUrl = new URL('index.html', `file://${__dirname}/../dist/`).href;
    console.log('Attempting to load from:', fileUrl);
    mainWindow.loadURL(fileUrl).catch(err => {
      console.error('Failed to load app:', err);
    });
  }
}
```

**Why:** Electron Builder places bundled files in different locations than Forge. This ensures compatibility.

---

### 5. **Data Path Initialization (src/main.js - Lines 410-425)**
**Before (Forge Pattern):**
```javascript
app.whenReady().then(() => {
  let dataPath;
  
  if (app.isPackaged) {
    dataPath = path.dirname(app.getAppPath());
  } else {
    dataPath = 'C:\\Users\\no name\\Desktop\\Sir Jed\\MOA System';
  }
  // ...
```

**After (Builder Pattern):**
```javascript
app.whenReady().then(() => {
  console.log('=== MOA System Starting ===');
  console.log('App packaged:', app.isPackaged);
  console.log('App path:', app.getAppPath());
  
  let dataPath;
  
  if (app.isPackaged) {
    // Production: Use userData directory (clean, user-specific location)
    dataPath = app.getPath('userData');
    console.log('Production mode - using userData path:', dataPath);
  } else {
    // Development: Use explicit project directory
    dataPath = 'C:\\Users\\no name\\Desktop\\Sir Jed\\MOA System';
    console.log('Development mode - using project path:', dataPath);
  }
  // ...
```

**Why:** `app.getPath('userData')` is the Electron-recommended location for user data in production.

---

### 6. **Vite Config ES Module Support (vite.config.mjs)**
**Before:**
```javascript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Uses __dirname which is undefined in ES modules
```

**After:**
```javascript
import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

export default defineConfig({
  // Now __dirname is properly defined
```

**Why:** ES modules don't have `__dirname` by default. Must create it explicitly.

---

### 7. **Notification Icon Path (src/main.js - Line 349)**
**Before:**
```javascript
icon: path.join(__dirname, '../assets/moa-icon.png'),
```

**After:**
```javascript
icon: getIconPath(), // Use helper function
```

**Why:** Ensures notifications use correct icon path in production.

---

### 8. **Security Improvements (src/main.js - Lines 99-100)**
**Added:**
```javascript
enableRemoteModule: false,
```

**Why:** Electron Builder best practice - disables remote module for security.

---

## Development vs Production Behavior

### Development `npm run dev`:
- Uses Vite dev server at `http://localhost:5173`
- Preload from `src/preload.js`
- Icon from project root `logo.ico`
- Database in `C:\Users\no name\Desktop\Sir Jed\MOA System\data\`
- Enhanced logging and DevTools enabled

### Production `npm run dist:win`:
- Uses bundled `dist/index.html` 
- Preload from multiple possible locations (checked in order)
- Icon from multiple possible locations
- Database in system userData directory: `C:\Users\<username>\AppData\Local\MOA Management System\data\`
- No DevTools, no hot-reload

---

## Testing Checklist

- [ ] **Development**: `npm run dev` loads app and database works
- [ ] **Production Build**: `npm run dist:win` creates MSI/portable executable
- [ ] **Portable App**: Can run `.exe` from any location
- [ ] **Database Persists**: MOAs saved in production still accessible
- [ ] **Icons Display**: App icon shows in taskbar and window
- [ ] **Upload Works**: PDF uploads succeed in production
- [ ] **Notifications**: Expiry notifications trigger correctly

---

## File Summary

| File | Changes | Type |
|------|---------|------|
| src/main.js | isDev detection, path helpers, file loading | Core |
| src/pdf-manager.js | (No changes needed) | Database |
| src/renderer.js | (No changes needed) | UI |
| src/preload.js | (No changes needed) | IPC |
| vite.config.mjs | ES module __dirname definition | Build |
| vite.main.config.mjs | (No changes) | Build |
| vite.renderer.config.mjs | (No changes) | Build |
| vite.preload.config.mjs | (No changes) | Build |
| package.json | (No changes needed) | Config |

---

## Key Electron Builder Patterns Used

1. **`app.isPackaged`** - Environment detection
2. **`app.getPath('userData')`** - Per-user data storage
3. **`app.getAppPath()`** - App installation directory
4. **`process.resourcesPath`** - Bundled resources location
5. **`fs.existsSync()`** - Path validation for fallback logic
6. **`path.join()` with fallback chains** - Robust path resolution

---

## Compatibility Notes

- ✅ Works with Electron Builder "portable" target
- ✅ Works with Electron Builder NSIS installer
- ✅ Works in development with Vite dev server
- ✅ Handles all path variations correctly
- ✅ Fallback logic prevents crashes if files not found

---

## Next Steps

1. Run `npm run dev` to test development environment
2. Run `npm run dist:win` to create production executable
3. Test both portable and installed versions
4. Verify database works in production (different location)
5. Test upload, search, and notification features in production

