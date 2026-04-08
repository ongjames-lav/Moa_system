import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

// Set paths - will be configured from main.js
let DATABASE_PATH;
let STORAGE_PATH;

export function setDataPaths(basePath) {
  DATABASE_PATH = path.join(basePath, 'data', 'moas.db');
  STORAGE_PATH = path.join(basePath, 'data', 'moas');
  
  console.log('=== setDataPaths called ===');
  console.log('Base path:', basePath);
  console.log('Database configured at:', DATABASE_PATH);
  console.log('Storage configured at:', STORAGE_PATH);
  
  // Ensure data directory structure exists
  const dataDir = path.dirname(DATABASE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('Created data directory:', dataDir);
  } else {
    console.log('Data directory already exists:', dataDir);
  }
  
  if (!fs.existsSync(STORAGE_PATH)) {
    fs.mkdirSync(STORAGE_PATH, { recursive: true });
    console.log('Created storage directory:', STORAGE_PATH);
  } else {
    console.log('Storage directory already exists:', STORAGE_PATH);
  }
}

let db;

export class MOAManager {
  static initialize() {
    if (!DATABASE_PATH) {
      throw new Error('DATABASE_PATH is not set. Call setDataPaths() first.');
    }

    console.log('=== MOAManager.initialize() ===');
    console.log('Initializing database at:', DATABASE_PATH);
    console.log('Parent directory:', path.dirname(DATABASE_PATH));
    console.log('Parent directory exists:', fs.existsSync(path.dirname(DATABASE_PATH)));
    console.log('Database file exists before open:', fs.existsSync(DATABASE_PATH));
    
    try {
      console.log('>>> Attempting to open/create database with better-sqlite3...');
      db = new Database(DATABASE_PATH);
      console.log('✅ Database opened successfully');
      console.log('Database file exists after open:', fs.existsSync(DATABASE_PATH));
      
      try {
        const stats = fs.statSync(DATABASE_PATH);
        console.log('Database file size:', stats.size, 'bytes');
      } catch (e) {
        console.error('Could not stat database file:', e);
      }
    } catch (error) {
      console.error('❌ Failed to open database:', error);
      console.error('❌ Error name:', error?.name);
      console.error('❌ Error code:', error?.code);
      console.error('❌ Error message:', error?.message);
      console.error('❌ Error stack:', error?.stack);
      throw error;
    }
    
    // Create tables if they don't exist
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS moas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          companyName TEXT NOT NULL,
          pdfFilename TEXT NOT NULL,
          pdfStoragePath TEXT NOT NULL,
          pdfOriginalName TEXT NOT NULL,
          pdfFileSize INTEGER,
          startDate TEXT NOT NULL,
          endDate TEXT NOT NULL,
          notes TEXT,
          college TEXT,
          partnerType TEXT,
          uploadDate DATETIME DEFAULT CURRENT_TIMESTAMP,
          lastModified DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_companyName ON moas(companyName);
        CREATE INDEX IF NOT EXISTS idx_startDate ON moas(startDate);
        CREATE INDEX IF NOT EXISTS idx_endDate ON moas(endDate);
        CREATE INDEX IF NOT EXISTS idx_uploadDate ON moas(uploadDate);
      `);
      console.log('Tables created/verified successfully');
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }

    // Migration: Add college column to existing table if it doesn't exist
    try {
      db.prepare("SELECT college FROM moas LIMIT 1").get();
    } catch (error) {
      console.log('Migrating database: Adding college column...');
      db.exec("ALTER TABLE moas ADD COLUMN college TEXT;");
    }

    // Migration: Add partnerType column to existing table if it doesn't exist
    try {
      db.prepare("SELECT partnerType FROM moas LIMIT 1").get();
    } catch (error) {
      console.log('Migrating database: Adding partnerType column...');
      db.exec("ALTER TABLE moas ADD COLUMN partnerType TEXT;");
    }
  }

  static addMOA(filePath, metadata = {}) {
    console.log('=== addMOA called ===');
    console.log('filePath:', filePath);
    console.log('metadata:', metadata);
    console.log('DATABASE_PATH:', DATABASE_PATH);
    console.log('STORAGE_PATH:', STORAGE_PATH);
    
    // CRITICAL: Check if paths are set
    if (!DATABASE_PATH || !STORAGE_PATH) {
      console.error('❌ CRITICAL ERROR: Paths not initialized!');
      console.error('DATABASE_PATH:', DATABASE_PATH);
      console.error('STORAGE_PATH:', STORAGE_PATH);
      throw new Error('Database paths not initialized. This is a critical error. Please restart the application.');
    }
    
    if (!db) {
      console.log('Database not initialized, initializing...');
      this.initialize();
    }

    try {
      const fileName = path.basename(filePath);
      console.log('fileName:', fileName);
      
      const uniqueFileName = `${Date.now()}-${fileName}`;
      console.log('uniqueFileName:', uniqueFileName);
      
      const destinationPath = path.join(STORAGE_PATH, uniqueFileName);
      console.log('destinationPath:', destinationPath);

      // Copy file to storage
      console.log('>>> Copying file...');
      fs.copyFileSync(filePath, destinationPath);
      console.log('✅ File copied successfully');

      // Get file size
      console.log('>>> Getting file stats...');
      const stats = fs.statSync(destinationPath);
      console.log('File size:', stats.size, 'bytes');

      // Insert into database
      console.log('>>> Preparing SQL insert statement...');
      const stmt = db.prepare(`
        INSERT INTO moas (companyName, pdfFilename, pdfStoragePath, pdfOriginalName, pdfFileSize, startDate, endDate, notes, college, partnerType)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const collegeValue = (metadata.college && metadata.college.trim()) ? metadata.college : null;
      const partnerTypeValue = (metadata.partnerType && metadata.partnerType.trim()) ? metadata.partnerType : null;

      console.log('>>> Inserting record into database...');
      const result = stmt.run(
        metadata.companyName || 'Unnamed Company',
        uniqueFileName,
        destinationPath,
        fileName,
        stats.size,
        metadata.startDate || new Date().toISOString().split('T')[0],
        metadata.endDate || new Date().toISOString().split('T')[0],
        metadata.notes || '',
        collegeValue,
        partnerTypeValue
      );

      console.log('✅ Record inserted with ID:', result.lastInsertRowid);

      return {
        id: result.lastInsertRowid,
        companyName: metadata.companyName || 'Unnamed Company',
        pdfFilename: uniqueFileName,
        pdfOriginalName: fileName,
        pdfFileSize: stats.size,
        startDate: metadata.startDate || new Date().toISOString().split('T')[0],
        endDate: metadata.endDate || new Date().toISOString().split('T')[0],
        notes: metadata.notes || '',
        college: collegeValue,
        partnerType: partnerTypeValue,
        uploadDate: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Error in addMOA:', error);
      console.error('Error name:', error?.name);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      console.error('DATABASE_PATH:', DATABASE_PATH);
      console.error('STORAGE_PATH:', STORAGE_PATH);
      throw error;
    }
  }

  static getMOAList(limit = 20, offset = 0, sortBy = 'uploadDate', sortOrder = 'DESC') {
    if (!db) {
      try {
        this.initialize();
      } catch (error) {
        console.error('Error initializing database:', error);
        console.error('DATABASE_PATH:', DATABASE_PATH);
        console.error('STORAGE_PATH:', STORAGE_PATH);
        throw error;
      }
    }

    if (!DATABASE_PATH) {
      throw new Error('Database path not configured. Please call setDataPaths before using MOAManager.');
    }

    // Validate sort parameters for security
    const validSortFields = ['companyName', 'startDate', 'endDate', 'uploadDate'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'uploadDate';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    try {
      console.log('getMOAList: Preparing query with sortField=' + sortField + ', order=' + order);
      
      const query = `
        SELECT id, companyName, pdfOriginalName, pdfFileSize, startDate, endDate, notes, college, partnerType, uploadDate, lastModified
        FROM moas
        ORDER BY ${sortField} ${order}
        LIMIT ? OFFSET ?
      `;
      
      console.log('getMOAList: Query:', query);
      console.log('getMOAList: Parameters:', { limit, offset });
      
      const stmt = db.prepare(query);
      const results = stmt.all(limit, offset);
      
      console.log('getMOAList: Raw results from DB:', results);
      console.log('getMOAList: Results length:', results?.length);
      
      if (!results) {
        console.error('getMOAList: No results returned from database');
        return [];
      }
      
      const formatted = results.map(row => {
        try {
          return {
            ...row,
            pdfFileSize: this.formatFileSize(row.pdfFileSize),
          };
        } catch (e) {
          console.error('Error formatting row:', row, e);
          return row;
        }
      });
      
      console.log('getMOAList: Formatted results:', formatted);
      return formatted;
    } catch (error) {
      console.error('Error getting MOA list:', error);
      console.error('DB initialized:', !!db);
      console.error('DATABASE_PATH:', DATABASE_PATH);
      throw error;
    }
  }

  static searchMOAs(query) {
    if (!db) this.initialize();

    const searchTerm = `%${query}%`;
    const stmt = db.prepare(`
      SELECT id, companyName, pdfOriginalName, pdfFileSize, startDate, endDate, notes, college, partnerType, uploadDate, lastModified
      FROM moas
      WHERE companyName LIKE ? OR pdfOriginalName LIKE ? OR notes LIKE ?
      ORDER BY uploadDate DESC
    `);

    const results = stmt.all(searchTerm, searchTerm, searchTerm);
    return results.map(row => ({
      ...row,
      pdfFileSize: this.formatFileSize(row.pdfFileSize),
    }));
  }

  static getMOAMetadata(id) {
    if (!db) this.initialize();

    const stmt = db.prepare(`
      SELECT id, companyName, pdfOriginalName, pdfFileSize, startDate, endDate, notes, college, partnerType, uploadDate, lastModified
      FROM moas
      WHERE id = ?
    `);

    const result = stmt.get(id);
    if (!result) return null;

    return {
      ...result,
      pdfFileSize: this.formatFileSize(result.pdfFileSize),
    };
  }

  static getMOAFilePath(id) {
    if (!db) this.initialize();

    const stmt = db.prepare(`
      SELECT pdfStoragePath FROM moas WHERE id = ?
    `);

    const result = stmt.get(id);
    if (!result) {
      throw new Error(`MOA with id ${id} not found`);
    }

    if (!fs.existsSync(result.pdfStoragePath)) {
      throw new Error(`PDF file not found at ${result.pdfStoragePath}`);
    }

    return result.pdfStoragePath;
  }

  static updateMOAMetadata(id, metadata) {
    if (!db) this.initialize();

    // Build update object explicitly
    const updates = {};

    if (metadata.companyName !== undefined) {
      updates.companyName = metadata.companyName;
    }
    if (metadata.startDate !== undefined) {
      updates.startDate = metadata.startDate;
    }
    if (metadata.endDate !== undefined) {
      updates.endDate = metadata.endDate;
    }
    if (metadata.notes !== undefined) {
      updates.notes = metadata.notes;
    }
    if (metadata.hasOwnProperty('college')) {
      // Explicitly handle college - can be null or a string
      updates.college = metadata.college;
    }
    if (metadata.hasOwnProperty('partnerType')) {
      // Explicitly handle partnerType - can be null or a string
      updates.partnerType = metadata.partnerType;
    }

    if (Object.keys(updates).length === 0) {
      return this.getMOAMetadata(id);
    }

    // Build the SQL UPDATE statement
    const setClause = Object.keys(updates)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = Object.values(updates);

    const stmt = db.prepare(`
      UPDATE moas
      SET ${setClause}, lastModified = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(...values, id);
    return this.getMOAMetadata(id);
  }

  static deleteMOA(id) {
    if (!db) this.initialize();

    const stmt = db.prepare('SELECT pdfStoragePath FROM moas WHERE id = ?');
    const result = stmt.get(id);

    if (!result) return false;

    // Delete file from storage
    if (fs.existsSync(result.pdfStoragePath)) {
      fs.unlinkSync(result.pdfStoragePath);
    }

    // Delete from database
    const deleteStmt = db.prepare('DELETE FROM moas WHERE id = ?');
    deleteStmt.run(id);

    return true;
  }

  static deleteMultipleMOAs(ids) {
    if (!db) this.initialize();

    const results = ids.map(id => this.deleteMOA(id));
    return results.filter(r => r).length;
  }

  static openMOA(id) {
    if (!db) this.initialize();

    const stmt = db.prepare('SELECT pdfStoragePath FROM moas WHERE id = ?');
    const result = stmt.get(id);

    if (!result || !fs.existsSync(result.pdfStoragePath)) {
      return null;
    }

    return result.pdfStoragePath;
  }

  static getMOACount() {
    if (!db) {
      try {
        this.initialize();
      } catch (error) {
        console.error('Error initializing database in getMOACount:', error);
        return 0;
      }
    }

    if (!DATABASE_PATH) {
      console.warn('Database path not configured in getMOACount');
      return 0;
    }

    try {
      const stmt = db.prepare('SELECT COUNT(*) as count FROM moas');
      return stmt.get().count;
    } catch (error) {
      console.error('Error getting MOA count:', error);
      return 0;
    }
  }

  static getFilteredMOAs(filters = {}, limit = 20, offset = 0, sortBy = 'uploadDate', sortOrder = 'DESC') {
    if (!db) this.initialize();

    let query = 'SELECT id, companyName, pdfOriginalName, pdfFileSize, startDate, endDate, notes, college, partnerType, uploadDate, lastModified FROM moas WHERE 1=1';
    const params = [];

    // Add filters
    if (filters.companyName) {
      query += ' AND companyName LIKE ?';
      params.push(`%${filters.companyName}%`);
    }

    if (filters.startDateFrom) {
      query += ' AND startDate >= ?';
      params.push(filters.startDateFrom);
    }

    if (filters.startDateTo) {
      query += ' AND startDate <= ?';
      params.push(filters.startDateTo);
    }

    if (filters.endDateFrom) {
      query += ' AND endDate >= ?';
      params.push(filters.endDateFrom);
    }

    if (filters.endDateTo) {
      query += ' AND endDate <= ?';
      params.push(filters.endDateTo);
    }

    // Add sorting
    const validSortFields = ['companyName', 'startDate', 'endDate', 'uploadDate'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'uploadDate';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY ${sortField} ${order} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const stmt = db.prepare(query);
    const results = stmt.all(...params);

    return results.map(row => ({
      ...row,
      pdfFileSize: this.formatFileSize(row.pdfFileSize),
    }));
  }

  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  static close() {
    if (db) {
      db.close();
      db = null;
    }
  }
}

export default MOAManager;

