import { app, BrowserWindow, ipcMain, dialog, shell, Notification } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { MOAManager, setDataPaths } from './pdf-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let handlersRegistered = false;

// ELECTRON BUILDER FIX: Properly detect development vs production
const isDev = !app.isPackaged;

// Helper to resolve preload path for both dev and production
function getPreloadPath() {
  if (isDev) {
    // Development: preload is in src/preload.js
    return path.join(__dirname, 'preload.js');
  } else {
    // Production with Electron Builder: preload location varies
    // Check multiple possible locations in order
    const possiblePaths = [
      path.join(app.getAppPath(), 'preload.js'),                    // In app root
      path.join(app.getAppPath(), 'dist', 'preload.js'),           // In dist folder
      path.join(process.resourcesPath, 'preload.js'),              // In resources
      path.join(process.resourcesPath, 'app', 'preload.js'),       // In resources/app
      path.join(__dirname, 'preload.js'),                          // Fallback to src
    ];
    
    for (const preloadPath of possiblePaths) {
      try {
        if (fs.existsSync(preloadPath)) {
          console.log('✅ Found preload at:', preloadPath);
          return preloadPath;
        }
      } catch (e) {
        // Continue to next path
      }
    }
    
    // Ultimate fallback
    console.warn('⚠️ Preload location uncertain, using app path fallback');
    return path.join(app.getAppPath(), 'preload.js');
  }
}

// Helper to resolve icon path for both dev and production
function getIconPath() {
  if (isDev) {
    // Development: icon is in project root
    return path.join(__dirname, '../logo.ico');
  } else {
    // Production: check multiple locations
    const possiblePaths = [
      path.join(app.getAppPath(), 'logo.ico'),                     // In app root
      path.join(process.resourcesPath, 'logo.ico'),                // In resources
      path.join(process.resourcesPath, 'app', 'logo.ico'),         // In resources/app
      path.join(__dirname, '../logo.ico'),                         // Fallback
    ];
    
    for (const iconPath of possiblePaths) {
      try {
        if (fs.existsSync(iconPath)) {
          console.log('✅ Found icon at:', iconPath);
          return iconPath;
        }
      } catch (e) {
        // Continue to next path
      }
    }
    
    console.warn('⚠️ Icon not found, using null (will use default icon)');
    return null;
  }
}

console.log('=== APP INITIALIZATION ===');
console.log('App packaged:', app.isPackaged);
console.log('isDev:', isDev);
console.log('__dirname:', __dirname);
console.log('Preload path:', getPreloadPath());
console.log('Icon path:', getIconPath());

const createWindow = () => {
  // Create the browser window.
  const webPreferences = {
    preload: getPreloadPath(),
    nodeIntegration: false,
    contextIsolation: true,
    enableRemoteModule: false,
  };
  
  // In dev mode, use less strict sandbox to allow API injection
  if (isDev) {
    webPreferences.sandbox = false;
  } else {
    webPreferences.sandbox = true;
  }
  
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    autoHideMenuBar: true,
    show: false,
    icon: getIconPath(),
    webPreferences,
  });
  mainWindow.maximize();
  mainWindow.show();

  // Load the app
  if (isDev) {
    // Development: load from Vite dev server
    console.log('Loading from Vite dev server: http://localhost:5173');
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
    
    // FOR DEV MODE: Inject API when content loads since preload doesn't work with Vite dev server
    mainWindow.webContents.once('did-finish-load', () => {
      console.log('=== Injecting moaAPI for dev mode ===');
      // In dev mode without full sandbox, we can directly expose the API
      mainWindow.webContents.executeJavaScript(`
        (async function() {
          console.log('Setting up moaAPI in dev mode...');
          const { ipcRenderer } = await import('electron');
          window.moaAPI = {
            uploadMOA: () => ipcRenderer.invoke('moa:upload'),
            getMOAList: (limit, offset, sortBy, sortOrder) => ipcRenderer.invoke('moa:list', limit, offset, sortBy, sortOrder),
            deleteMOA: (id) => ipcRenderer.invoke('moa:delete', id),
            openMOA: (id) => ipcRenderer.invoke('moa:open', id),
            searchMOAs: (query) => ipcRenderer.invoke('moa:search', query),
            filterMOAs: (filters, limit, offset, sortBy, sortOrder) => ipcRenderer.invoke('moa:filter', filters, limit, offset, sortBy, sortOrder),
            updateMOAMetadata: (id, metadata) => ipcRenderer.invoke('moa:updateMetadata', id, metadata),
            getMOAMetadata: (id) => ipcRenderer.invoke('moa:getMetadata', id),
            deleteMOAs: (ids) => ipcRenderer.invoke('moa:deleteMultiple', ids),
            onMOAsUpdated: (callback) => ipcRenderer.on('moa:updated', callback),
            onMOADeleted: (callback) => ipcRenderer.on('moa:deleted', callback),
            onOpenMOADetails: (callback) => ipcRenderer.on('moa:openDetails', (event, data) => callback(data)),
          };
          console.log('✅ moaAPI injected successfully in dev mode');
          window.dispatchEvent(new Event('moaAPIReady'));
        })();
      `, false).catch(err => {
        console.error('Failed to inject moaAPI:', err);
      });
    });
  } else {
    // Production: load from built files with Electron Builder
    // Check multiple possible locations for the bundled app
    const possiblePaths = [
      path.join(app.getAppPath(), 'dist', 'index.html'),           // Standard Electron Builder location
      path.join(app.getAppPath(), '../dist', 'index.html'),        // Alternative
      path.join(process.resourcesPath, 'dist', 'index.html'),      // In resources
      path.join(process.resourcesPath, 'app', 'dist', 'index.html'), // In resources/app
      path.join(__dirname, '../dist/index.html'),                  // Fallback
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
      console.error('❌ dist/index.html not found in any expected location');
      const fileUrl = new URL('index.html', `file://${__dirname}/../dist/`).href;
      console.log('Attempting to load from:', fileUrl);
      mainWindow.loadURL(fileUrl).catch(err => {
        console.error('Failed to load app:', err);
      });
    }
  }
};

const registerHandlers = () => {
  // IPC Handlers for MOA operations
  ipcMain.handle('moa:upload', async (event) => {
    try {
      console.log('=== moa:upload handler called ===');
      
      // VERIFY DATABASE IS INITIALIZED
      console.log('Checking if MOAManager is ready...');
      try {
        const testList = MOAManager.getMOAList(1, 0, 'uploadDate', 'DESC');
        console.log('✅ MOAManager is ready and database is accessible');
      } catch (dbError) {
        console.error('❌ Database not ready:', dbError);
        throw new Error('Database is not initialized. Please restart the application.');
      }
      
      const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
          { name: 'PDF Files', extensions: ['pdf'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      console.log('File dialog result - canceled:', canceled, 'filePaths:', filePaths);

      if (!canceled && filePaths.length > 0) {
        try {
          const filePath = filePaths[0];
          console.log('Selected file:', filePath);
          console.log('File exists:', fs.existsSync(filePath));
          console.log('Calling MOAManager.addMOA...');
          
          const result = MOAManager.addMOA(filePath, {});
          
          console.log('✅ addMOA succeeded:', result);
          mainWindow.webContents.send('moa:updated');
          return result;
        } catch (error) {
          console.error('❌ Error in addMOA:', error);
          console.error('Error name:', error?.name);
          console.error('Error message:', error?.message);
          console.error('Error stack:', error?.stack);
          throw error;
        }
      } else {
        console.log('User canceled file dialog or no file selected');
        return null;
      }
    } catch (error) {
      console.error('❌ Error uploading MOA:', error);
      console.error('Full error object:', error);
      throw error;
    }
  });

  ipcMain.handle('moa:list', async (event, limit = 20, offset = 0, sortBy = 'uploadDate', sortOrder = 'DESC') => {
    try {
      console.log('=== IPC moa:list handler ===');
      console.log('Parameters:', { limit, offset, sortBy, sortOrder });
      
      console.log('Calling MOAManager.getMOAList...');
      const moas = MOAManager.getMOAList(limit, offset, sortBy, sortOrder);
      console.log('✅ getMOAList returned successfully');
      console.log('MOAs from DB:', moas);
      console.log('MOAs type:', typeof moas);
      console.log('MOAs is array:', Array.isArray(moas));
      console.log('MOAs length:', moas?.length);
      
      console.log('Calling MOAManager.getMOACount...');
      const count = MOAManager.getMOACount();
      console.log('✅ getMOACount returned:', count);
      
      const result = { moas: moas || [], total: count || 0 };
      console.log('Final result object:', result);
      console.log('Result stringified (first 500 chars):', JSON.stringify(result).substring(0, 500));
      console.log('✅ moa:list handler returning successfully');
      
      return result;
    } catch (error) {
      console.error('=== ERROR in moa:list handler ===');
      console.error('Error name:', error?.name);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      console.error('Full error:', error);
      console.error('Throwing error back to renderer...');
      throw error;
    }
  });

  ipcMain.handle('moa:search', async (event, query) => {
    try {
      const moas = MOAManager.searchMOAs(query);
      return moas;
    } catch (error) {
      console.error('Error searching MOAs:', error);
      throw error;
    }
  });

  ipcMain.handle('moa:filter', async (event, filters, limit = 20, offset = 0, sortBy = 'uploadDate', sortOrder = 'DESC') => {
    try {
      const moas = MOAManager.getFilteredMOAs(filters, limit, offset, sortBy, sortOrder);
      const count = MOAManager.getMOACount();
      return { moas, total: count };
    } catch (error) {
      console.error('Error filtering MOAs:', error);
      throw error;
    }
  });

  ipcMain.handle('moa:delete', async (event, id) => {
    try {
      MOAManager.deleteMOA(id);
      mainWindow.webContents.send('moa:deleted', id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting MOA:', error);
      throw error;
    }
  });

  ipcMain.handle('moa:deleteMultiple', async (event, ids) => {
    try {
      MOAManager.deleteMultipleMOAs(ids);
      mainWindow.webContents.send('moa:deleted', ids);
      return { success: true };
    } catch (error) {
      console.error('Error deleting multiple MOAs:', error);
      throw error;
    }
  });

  ipcMain.handle('moa:open', async (event, id) => {
    try {
      const filePath = MOAManager.getMOAFilePath(id);
      // Open the file with the default application
      await shell.openPath(filePath);
      return { success: true };
    } catch (error) {
      console.error('Error opening MOAs');
      throw error;
    }
  });

  ipcMain.handle('moa:getMetadata', async (event, id) => {
    try {
      const metadata = MOAManager.getMOAMetadata(id);
      return metadata;
    } catch (error) {
      console.error('Error getting MOA metadata:', error);
      throw error;
    }
  });

  ipcMain.handle('moa:updateMetadata', async (event, id, metadata) => {
    try {
      const result = MOAManager.updateMOAMetadata(id, metadata);
      mainWindow.webContents.send('moa:updated');
      return result;
    } catch (error) {
      console.error('Error updating MOA metadata:', error);
      throw error;
    }
  });
};

const checkAndNotifyExpiringMOAs = () => {
  try {
    // Get all MOAs (no limit)
    const allMOAs = MOAManager.getMOAList(10000, 0, 'endDate', 'ASC');
    const today = new Date();
    const thirtyOneDaysFromNow = new Date();
    thirtyOneDaysFromNow.setDate(thirtyOneDaysFromNow.getDate() + 31);

    allMOAs.forEach(moa => {
      const endDate = new Date(moa.endDate);
      const timeDiff = endDate - today;
      const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      // Trigger notification if MOA expires within 31 days and hasn't already expired
      if (daysUntilExpiry > 0 && endDate <= thirtyOneDaysFromNow) {
        const formattedDate = endDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        const notification = new Notification({
          title: '📋 MOA Expiration Reminder',
          body: `MOA for ${moa.companyName} will expire in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''} - ${formattedDate}`,
          icon: getIconPath(), // Use helper function instead of hardcoded path
          silent: false,
        });

        // Handle notification click - open app and show MOA details
        notification.on('click', () => {
          if (mainWindow) {
            // Focus and show the window
            if (mainWindow.isMinimized()) {
              mainWindow.restore();
            }
            mainWindow.focus();
            
            // Send message to renderer to open the MOA details modal
            mainWindow.webContents.send('moa:openDetails', { id: moa.id });
            console.log(`Opening MOA details for: ${moa.companyName}`);
          }
        });

        notification.show();
        console.log(`Notification sent for MOA: ${moa.companyName}, expiring in ${daysUntilExpiry} days`);
      }
    });
  } catch (error) {
    console.error('Error checking expiring MOAs:', error);
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  console.log('=== MOA System Starting ===');
  console.log('App packaged:', app.isPackaged);
  console.log('App path:', app.getAppPath());
  
  // ELECTRON BUILDER FIX: Determine the data path correctly
  let dataPath;
  
  if (app.isPackaged) {
    // Production (Electron Builder): Store data in userData directory
    // This is the recommended location for user data in Electron
    dataPath = app.getPath('userData');
    console.log('Production mode - using userData path:', dataPath);
  } else {
    // Development: Use the actual app directory (project root)
    // Get parent of src directory to get project root
    dataPath = path.join(__dirname, '..');
    console.log('Development mode - using project path:', dataPath);
  }
  
  console.log('Current working directory:', process.cwd());
  console.log('Using data path:', dataPath);
  console.log('Expected DB location:', path.join(dataPath, 'data', 'moas.db'));
  
  // Initialize data paths
  setDataPaths(dataPath);
  
  // Initialize MOA Manager
  if (!handlersRegistered) {
    console.log('Initializing MOA Manager...');
    try {
      MOAManager.initialize();
      console.log('✅ MOA Manager initialized successfully');
      
      // Check for expiring MOAs and show notifications
      checkAndNotifyExpiringMOAs();
    } catch (error) {
      console.error('❌ Failed to initialize MOA Manager:', error);
    }
    registerHandlers();
    handlersRegistered = true;
  }
  
  createWindow();

  // On OS X it's common to re-create a window when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Clean up on app exit
app.on('before-quit', () => {
  MOAManager.close();
});