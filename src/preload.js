// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';

console.log('=== PRELOAD SCRIPT LOADING ===');

try {
  contextBridge.exposeInMainWorld('moaAPI', {
    // File operations
    uploadMOA: () => ipcRenderer.invoke('moa:upload'),
    getMOAList: (limit, offset, sortBy, sortOrder) => ipcRenderer.invoke('moa:list', limit, offset, sortBy, sortOrder),
    deleteMOA: (id) => ipcRenderer.invoke('moa:delete', id),
    openMOA: (id) => ipcRenderer.invoke('moa:open', id),
    
    // Search and filter
    searchMOAs: (query) => ipcRenderer.invoke('moa:search', query),
    filterMOAs: (filters, limit, offset, sortBy, sortOrder) => ipcRenderer.invoke('moa:filter', filters, limit, offset, sortBy, sortOrder),
    
    // Metadata operations
    updateMOAMetadata: (id, metadata) => ipcRenderer.invoke('moa:updateMetadata', id, metadata),
    getMOAMetadata: (id) => ipcRenderer.invoke('moa:getMetadata', id),
    
    // Batch operations
    deleteMOAs: (ids) => ipcRenderer.invoke('moa:deleteMultiple', ids),
    
    // Listen to MOA updates
    onMOAsUpdated: (callback) => ipcRenderer.on('moa:updated', callback),
    onMOADeleted: (callback) => ipcRenderer.on('moa:deleted', callback),
    onOpenMOADetails: (callback) => ipcRenderer.on('moa:openDetails', (event, data) => callback(data)),
  });
  console.log('✅ moaAPI exposed to renderer successfully');
} catch (error) {
  console.error('❌ Failed to expose moaAPI:', error);
  throw error;
}
