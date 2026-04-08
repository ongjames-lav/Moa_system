# MOA Management System

A professional, desktop-based Memorandum of Agreement (MOA) file management system designed for managing student MOA documents. Built with Electron, SQLite, and modern web technologies, featuring sophisticated sorting, searching, and pagination capabilities.

## Features

### Core Features
- **📋 MOA Management**: Upload, organize, and manage PDF-based MOA documents
- **🔍 Smart Search**: Search MOAs by company name with real-time filtering
- **📊 Advanced Sorting**: Multiple sort options including:
  - Latest/Oldest Uploaded
  - Company Name (A-Z / Z-A)
  - Start/End Date (Newest/Oldest)
- **📅 Date Tracking**: Track start and end dates for each MOA
- **📄 PDF Attachment**: Attach PDF files to each MOA record
- **✏️ Metadata Management**: Edit company name, dates, and notes
- **📑 Pagination**: Organized pagination for handling large MOA libraries
- **⚡ Status Indicators**: Automatic Active/Inactive status based on dates

### Additional Features
- **☑️ Batch Operations**: Select and delete multiple MOAs at once
- **💾 SQLite Database**: Reliable local storage of all MOA data
- **📱 Responsive Design**: Works seamlessly on different screen sizes
- **🎨 Professional UI**: Clean, modern interface with status badges
- **📦 File Management**: Automatic file size tracking and formatting
- **🔔 Real-time Notifications**: Instant feedback on all operations

## System Architecture

### File Structure
```
src/
├── main.js              # Electron main process with IPC handlers
├── preload.js           # Preload script for secure API exposure
├── renderer.js          # Frontend logic for MOA management
├── pdf-manager.js       # MOA database and file operations
├── index.css            # Professional styling
index.html              # HTML structure
package.json            # Dependencies
```

### Database Schema
```sql
CREATE TABLE moas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  companyName TEXT NOT NULL,          -- Company/Organization name
  pdfFilename TEXT NOT NULL,          -- Unique PDF identifier
  pdfStoragePath TEXT NOT NULL,       -- Full path to stored PDF
  pdfOriginalName TEXT NOT NULL,      -- Original PDF filename
  pdfFileSize INTEGER,                -- PDF size in bytes
  startDate TEXT NOT NULL,            -- MOA start date (YYYY-MM-DD)
  endDate TEXT NOT NULL,              -- MOA end date (YYYY-MM-DD)
  notes TEXT,                         -- Additional notes
  uploadDate DATETIME,                -- When MOA was uploaded
  lastModified DATETIME               -- Last modification time
);
```

## Installation & Setup

### Prerequisites
- Node.js 14+
- npm or yarn

### Quick Start
```bash
# Install dependencies
npm install

# Start development mode
npm start

# Build for production
npm run package

# Create distribution package
npm run make
```

## Usage Guide

### Uploading an MOA
1. Click the **➕ Upload MOA** button in the sidebar
2. Select a PDF file from your computer
3. The MOA is automatically added to your library
4. Edit details by clicking the **📋** button on the card

### Searching MOAs
1. Use the search bar in the sidebar
2. Type a company name or partial name
3. Results update in real-time
4. Clear the search to view all MOAs

### Sorting MOAs
1. Use the **Sort By** dropdown in the sidebar
2. Choose from:
   - Latest/Oldest Uploaded
   - Company Name (A-Z / Z-A)
   - Start/End Date (Newest/Oldest)
3. List updates immediately with new sort order

### Navigating Pages
- Use **Previous** and **Next** buttons at the bottom
- Page information shows current position
- Each page displays 20 MOA entries

### Editing MOA Details
1. Click the **📋** button on an MOA card
2. Edit any of the following:
   - Company Name
   - Start Date
   - End Date
   - Notes
3. Click **Save Changes** to update
4. File information is read-only

### Managing MOAs
- **Delete Single**: Click **🗑️** on the MOA card
- **Select Multiple**: Check checkboxes on MOA cards
- **Select All**: Click **☑️ Select All** (appears when items selected)
- **Delete Multiple**: Click **🗑️ Delete Selected**
- **Confirmation Required**: All deletions require confirmation

## API Reference

### Window Methods

All methods accessible via `window.moaAPI`:

#### File Operations
```javascript
// Upload new MOA (opens file dialog)
await moaAPI.uploadMOA()
// Returns: { id, companyName, pdfFilename, startDate, endDate, ... }

// Get paginated list with sorting
await moaAPI.getMOAList(limit, offset, sortBy, sortOrder)
// sortBy: 'uploadDate', 'companyName', 'startDate', 'endDate'
// sortOrder: 'ASC' or 'DESC'
// Returns: { moas: [...], total: number }

// Delete single MOA
await moaAPI.deleteMOA(id)
// Returns: boolean (success)

// Delete multiple MOAs
await moaAPI.deleteMOAs(ids)
// Returns: number (count deleted)

// Get file path for MOA
await moaAPI.openMOA(id)
// Returns: string (file path)
```

#### Search & Filter
```javascript
// Search by company name
await moaAPI.searchMOAs(query)
// Returns: array of matching MOAs

// Advanced filtering
await moaAPI.filterMOAs(filters, limit, offset, sortBy, sortOrder)
// filters: { companyName, startDateFrom, startDateTo, endDateFrom, endDateTo }
// Returns: { moas: [...], total: number }
```

#### Metadata Management
```javascript
// Get MOA details
await moaAPI.getMOAMetadata(id)
// Returns: { id, companyName, startDate, endDate, notes, pdfOriginalName, pdfFileSize, uploadDate, ... }

// Update MOA metadata
await moaAPI.updateMOAMetadata(id, metadata)
// metadata: { companyName, startDate, endDate, notes }
// Returns: updated metadata object
```

#### Event Listeners
```javascript
// Listen for MOA updates
moaAPI.onMOAsUpdated(callback)

// Listen for MOA deletion
moaAPI.onMOADeleted(({ id }) => {})
```

## Data Storage

### Storage Locations
- **Database**: `~/.config/MOA System/moas.db` (Linux/Mac) or `%APPDATA%/MOA System/moas.db` (Windows)
- **PDF Files**: `~/.config/MOA System/moas/` (Linux/Mac) or `%APPDATA%/MOA System/moas/` (Windows)

### File Organization
- Each uploaded PDF is given a unique filename based on timestamp
- Original filenames are preserved in the database
- Automatic cleanup when MOAs are deleted

## User Interface Components

### Sidebar
- **Upload Button**: Initiate MOA upload dialog
- **Selection Tools**: Select all or delete selected items (context-aware)
- **Search Bar**: Real-time search by company name
- **Sort Dropdown**: Change sort order and field
- **Statistics**: Display total MOA count

### Main Content Area
- **MOA Cards Grid**: Responsive grid layout (auto-fills with cards)
- **Empty State**: Helpful message when no MOAs exist
- **Pagination**: Navigation buttons and page information

### MOA Card
Each card displays:
- **Checkbox**: For bulk selection
- **Company Name**: With Active/Inactive status badge
- **Date Range**: Start and end dates in organized layout
- **Notes**: Preview (2 lines max)
- **Metadata**: PDF filename, file size, upload date
- **Action Buttons**: View details, open PDF, delete

### Detail Modal
Edit MOA information with fields for:
- Company Name (editable)
- Start Date (editable date picker)
- End Date (editable date picker)
- Notes (editable textarea)
- PDF Filename (read-only)
- File Size (read-only)
- Upload Date (read-only)

## Key Features Explained

### Status Indicators
- **Active Badge** (Green): MOA dates encompass today's date
- **Inactive Badge** (Red): MOA dates have passed or not yet started

### Smart Sorting
Multiple sort fields with ascending/descending options for flexible organization:
- By upload chronology
- By company name alphabetically
- By agreement timeline

### Pagination System
- 20 MOAs per page for optimal performance
- Previous/Next navigation buttons
- Current page and total page count display
- Auto-hides when all items fit on one page

### Search Functionality
- Real-time filtering by company name
- Maintains search results while sorting
- Clear search to return to full list

## Security Features

- ✅ Preload script sandboxing
- ✅ Context bridge for controlled API exposure
- ✅ IPC-based inter-process communication
- ✅ File path validation
- ✅ HTML escaping for XSS prevention
- ✅ Prepared SQL statements (SQL injection prevention)
- ✅ User confirmation for destructive operations

## Performance Optimization

- **Lazy Loading**: Items loaded in batches of 20
- **Database Indexing**: Optimized queries on company name, dates
- **Responsive UI**: Non-blocking async operations
- **Efficient Rendering**: Grid-based layout updates
- **Scalability**: Tested with 1000+ MOA records

## Troubleshooting

### MOAs Not Displaying
1. Check that MOA files exist in the storage directory
2. Verify database file (moas.db) is accessible
3. Check browser console for errors (DevTools)

### Search Not Working
1. Ensure company names are properly entered
2. Try refreshing the application
3. Check for special characters in search

### Upload Fails
1. Verify the file is a valid PDF
2. Check available disk space
3. Ensure proper file permissions

### Pagination Issues
1. Reload the application
2. Check total MOA count in sidebar
3. Verify database integrity

## Maintenance

### Backing Up Your MOAs
```bash
# Backup database and files
cp ~/.config/MOA\ System/moas.db ~/backup_moas.db
cp -r ~/.config/MOA\ System/moas ~/backup_moas_files
```

### Resetting the System
1. Delete the database file (moas.db)
2. Delete the moas folder
3. Restart the application
4. Application will recreate empty database

## Limitations & Future Enhancements

### Current Limitations
- Single window mode
- Local storage only (no cloud sync)
- No PDF preview integration
- No document versioning

### Planned Features
- PDF preview in modal
- Advanced date range filtering
- Document categories/folders
- Batch date updates
- MOA expiration notifications
- Export to Excel/CSV
- Cloud backup integration

## System Requirements

- **OS**: Windows 7+, macOS 10.11+, Linux (various distributions)
- **RAM**: 2GB minimum (4GB recommended)
- **Disk Space**: 100MB for application + storage
- **Display**: 1280x720 minimum resolution

## Support & Feedback

For issues, feature requests, or contributions, please refer to the project documentation.

---

**Version**: 2.0.0 (MOA Edition)  
**Last Updated**: January 2026  
**Author**: MOA System Team  
**License**: MIT
