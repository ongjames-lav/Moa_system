# MOA Management System - Quick Start Guide

## Installation (2 minutes)

```bash
# Navigate to project directory
cd "C:\Users\[YourUsername]\Desktop\MOA System"

# Install all dependencies
npm install

# Start the application
npm start
```

The application will open with DevTools (press F12 to close if desired).

## First Time Use

### 1. Upload Your First MOA
- Click **➕ Upload MOA** button
- Select a PDF file from your computer
- PDF is automatically stored and cataloged

### 2. Edit MOA Details
- Click **📋** button on the MOA card
- Enter company name, start date, end date
- Add any notes
- Click **Save Changes**

### 3. Explore the Interface
- Use **Sort By** dropdown to change view
- Use search bar to find specific companies
- Click company names to see full cards
- Navigate pages with Previous/Next buttons

## Key Buttons & Controls

| Button | Action |
|--------|--------|
| ➕ | Upload new MOA |
| ☑️ | Select all MOAs (appears when available) |
| 🗑️ | Delete selected MOAs (appears when available) |
| 📋 | View/edit MOA details |
| 📂 | Open PDF (shows file location) |
| 🗑️ (on card) | Delete single MOA |
| ← Previous | Go to previous page |
| Next → | Go to next page |

## Sort Options

Choose from the dropdown to sort MOAs:

1. **Latest Uploaded** - Most recently added first
2. **Oldest Uploaded** - Oldest first
3. **Company Name (A-Z)** - Alphabetical order
4. **Company Name (Z-A)** - Reverse alphabetical
5. **Start Date (Newest)** - Most recent start dates
6. **Start Date (Oldest)** - Earliest start dates
7. **End Date (Newest)** - Most recent end dates
8. **End Date (Oldest)** - Earliest end dates

## Search

- Type company name in **Search Bar**
- Results update in real-time
- Clear search to see all MOAs
- Pagination hides during search

## Understanding Status Badges

- **Active** (Green Badge): MOA is currently in effect
  - Today's date is between start and end date
  
- **Inactive** (Red Badge): MOA is not in effect
  - Start date hasn't arrived yet OR end date has passed

## Editing MOAs

To edit MOA information:

1. Click **📋** button on MOA card
2. Modal dialog opens with editable fields:
   - Company Name (text)
   - Start Date (date picker)
   - End Date (date picker)
   - Notes (larger text area)
3. Read-only fields show:
   - PDF filename
   - File size
   - Upload date
4. Click **Save Changes** to save
5. Click **Close** or **X** to cancel

**Note**: Date validation ensures start date is before end date.

## Managing Multiple MOAs

### Select Multiple MOAs
1. Check boxes next to MOA cards
2. Buttons appear:
   - **☑️ Select All** - Check all on current page
   - **🗑️ Delete Selected** - Delete all checked items

### Delete Operations
- Each delete requires confirmation
- Individual deletion: Click 🗑️ on card
- Batch deletion: Check boxes then click **🗑️ Delete Selected**

## Navigation

### Pagination
- Shows at bottom when needed: "Page 1 of 5"
- **← Previous** button disabled on first page
- **Next →** button disabled on last page
- Each page shows 20 MOAs

### Search Navigation
- Search results show all matches on one view
- Pagination hidden during search
- Clear search to return to paginated view

## Tips & Tricks

### Quick Search
- Try just first word of company name
- Search is case-insensitive
- Searches company name only

### Efficient Sorting
- Use sort before searching for best results
- Re-sort to organize search results differently
- Sort order persists across page navigation

### Batch Operations
- Check multiple boxes before deleting
- Select All button appears automatically
- Much faster than deleting individually

### Date Management
- Use date pickers for accurate entry
- System automatically calculates Active/Inactive status
- Historical MOAs stay in system indefinitely

## Troubleshooting

### MOAs Not Showing?
1. Check total count in sidebar
2. Try different sort options
3. Clear any search filters
4. Refresh with F5 if needed

### Can't Upload PDF?
1. Verify file is a PDF
2. Check file isn't corrupted
3. Ensure disk space available
4. Try a different PDF

### Search Not Working?
1. Check spelling of company name
2. Try just first few letters
3. Clear search and try again
4. Company name must match exactly

### Delete Not Working?
1. Confirm the warning dialog
2. Check if MOA is still selected
3. Refresh if needed
4. Check filesystem permissions

### Dates Not Saving?
1. Ensure start date < end date
2. Check system date is correct
3. Try entering dates manually
4. Use date picker interface

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| F5 | Refresh page |
| F12 | Toggle DevTools |
| Escape | Close modal dialog |
| Tab | Navigate between fields |

## Backing Up Your Data

To backup your MOAs:

1. **Find storage location:**
   - Windows: `C:\Users\[YourName]\AppData\Roaming\MOA System\`
   - Mac: `~/.config/MOA System/`
   - Linux: `~/.config/MOA System/`

2. **Backup these items:**
   - Database: `moas.db`
   - PDF files: `moas/` folder

3. **Copy to safe location:**
   - External drive
   - Cloud storage
   - USB stick

## Building for Production

```bash
# Create distributable package
npm run package

# Create installer
npm run make
```

## Getting Help

1. Check the full documentation: `MOA_SYSTEM_README.md`
2. Review project structure: `PROJECT_STRUCTURE.md`
3. See implementation details: `IMPLEMENTATION_SUMMARY.md`
4. Check browser console (F12) for errors

## Common Workflows

### Workflow 1: Adding a New MOA
1. Click ➕ Upload MOA
2. Select PDF file
3. Click 📋 to edit
4. Enter company name and dates
5. Add notes if needed
6. Click Save Changes

### Workflow 2: Finding Specific MOAs
1. Use Search bar to find company
2. If not found, try sort by Company Name
3. Browse through pages if needed

### Workflow 3: Bulk Cleanup
1. Sort by End Date (Oldest)
2. Select expired MOAs
3. Click Select All when ready
4. Click Delete Selected
5. Confirm deletion

### Workflow 4: Reviewing Active MOAs
1. Sort by Start Date (Newest)
2. Look for green "Active" badges
3. Click 📋 to view details
4. Check dates and notes

## Performance Notes

- First load may take 1-2 seconds
- Subsequent loads are instant
- Search results appear immediately
- Pagination loads 20 items at a time
- System handles 1000+ MOAs smoothly

## System Requirements

- **Windows**: 7 or newer
- **macOS**: 10.11 or newer
- **Linux**: Most distributions
- **RAM**: 2GB minimum
- **Disk**: 100MB available

## Settings Locations

**Database File**: `~/.config/MOA System/moas.db` (Windows: AppData)

**PDF Storage**: `~/.config/MOA System/moas/` (Windows: AppData)

## Next Steps

1. ✅ Install and run the application
2. ✅ Upload your first MOA
3. ✅ Explore all sort options
4. ✅ Try searching by company
5. ✅ Edit MOA details
6. ✅ Manage multiple MOAs
7. ✅ Backup your data

---

**Need More Help?**  
- Read full documentation: `MOA_SYSTEM_README.md`
- Check technical details: `PROJECT_STRUCTURE.md`

**Version**: 2.0.0 (MOA Edition)  
**Updated**: January 2026
