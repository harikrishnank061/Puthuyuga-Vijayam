# FIX MY STREET - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- pnpm (or npm/yarn)

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The app will be available at `http://localhost:3000`

## 🎯 User Flows

### Citizen Flow: Report an Issue

1. **Go to Home**: `http://localhost:3000`
2. **Click "Citizen"** button
3. **Register** (or Login if already registered):
   - Enter your name (e.g., "John Doe")
   - Enter your mobile number (e.g., "9876543210")
   - Click "Register"
4. **You're now in the Dashboard!**
   - You'll see tabs: "📍 Map View", "📋 My Reports", "🔔 Updates"
   - Click "🔴 Report New Issue" button (red button at top)

5. **Report a New Issue** (3-step process):

   **Step 1: Issue Details**
   - Title: e.g., "Large pothole on Main Street"
   - Description: Detailed description of the problem
   - Category: Choose from dropdown (pothole, drainage, etc.)
   - Priority: Select urgency level
   - Click "Next: Select Location"

   **Step 2: Select Location**
   - See an interactive map
   - Click directly on map where the issue is located
   - OR click "📍 Use Current Location" for GPS-based location
   - OR manually enter coordinates
   - Add location description if helpful (e.g., "Near Anna Salai Junction")
   - Click "Confirm Location"

   **Step 3: Add Photos**
   - Click "📷 Choose Photos" to upload images
   - You can upload multiple photos
   - Click remove (X) to remove a photo if needed
   - Click "Submit Report" to complete

6. **After Reporting**:
   - You'll be back on the Dashboard
   - Your new complaint appears on the map as a RED marker (Reported)
   - When admin starts work: marker turns YELLOW (In Progress)
   - When admin resolves: marker turns GREEN (Resolved)
   - View updates in "🔔 Updates" tab

### Admin Flow: Manage Complaints

1. **Go to Home**: `http://localhost:3000`
2. **Click "Admin"** button
3. **Login with**:
   - Username: `ADMIN`
   - Password: `ADMIN123`
4. **You're now in Admin Dashboard!**

5. **View Complaints on Map**:
   - Default view shows all complaints on a map
   - RED markers = Reported (not yet started)
   - YELLOW markers = In Progress (being worked on)
   - GREEN markers = Resolved (completed)
   
6. **Filter Complaints**:
   - **By Status**: Click status buttons (All, Open, In Progress, Resolved)
   - **By Priority**: Click priority buttons (All, Low, Medium, High, Critical)
   - Map updates instantly with filtered results

7. **View Complaint Details**:
   - Click any marker on the map
   - A popup appears showing:
     - Complaint title
     - Status badge (color-coded)
     - Citizen name
     - Priority level
     - Photo preview
     - "View Details" button
   - Click "View Details" to open full management modal

8. **Manage Complaint**:
   - Update Status:
     - Open (Red) → Mark as Assigned
     - Assigned → Mark as In Progress (Yellow)
     - In Progress → Mark as Resolved (Green)
     - Resolved → Mark as Closed
   - Add administrative notes
   - Upload after-completion photos to show work done
   - Each update creates a timeline entry
   - Citizen receives notification of status change

9. **Quick Stats**:
   - Top of dashboard shows:
     - Total Issues
     - Reported (Red) count
     - In Progress (Yellow) count
     - Resolved (Green) count

## 📊 Color Status Legend

| Color | Status | Admin Action |
|-------|--------|-------------|
| 🔴 RED | Reported | Start working or assign |
| 🟡 YELLOW | In Progress | Continue work or resolve |
| 🟢 GREEN | Resolved | Mark as closed |

## 🗺️ Map Features

### Map Interactions
- **Zoom**: Use scroll wheel or pinch on mobile
- **Pan**: Click and drag to move around
- **Click Markers**: See popup with complaint summary
- **View Details**: Click "View Details" in popup or list

### Location Selection
- **Click to Select**: Click anywhere on map during location picking
- **Get Current Location**: Uses device GPS if available
- **Manual Entry**: Edit lat/long coordinates directly
- **Address Hint**: Add landmark description for clarity

## 💾 Data Persistence

- All data is stored in **browser LocalStorage**
- Data persists between sessions
- No internet connection required after initial load
- Data is private to your browser/device
- Clear browser cache to reset all data

## 🌐 Multi-Language Support

- **Switch Language**: Click "தமிழ்" (Tamil) or "English" in header
- **Supported Languages**: English and Tamil
- **Translation Coverage**: All UI elements, forms, and messages
- **Automatic**: Language preference is remembered

## 🔐 Login Credentials

### Citizens
- Any name and mobile number combination works
- No pre-set credentials needed
- Your mobile number is your identifier

### Admin
- **Username**: `ADMIN`
- **Password**: `ADMIN123`
- Only one admin account in demo

## ⚙️ Tips & Tricks

1. **Better Photo Uploads**: Take clear photos with good lighting
2. **Accurate Locations**: Click precise location on map, not just nearby
3. **Detailed Descriptions**: Write clear descriptions of the issue
4. **Follow Up**: Check updates tab regularly for status changes
5. **Priority Matters**: Mark urgent issues as "Critical" for faster response
6. **Timeline**: Admin can see full history of your complaint

## 📱 Mobile Testing

The app is fully responsive:
- Works on phones, tablets, and desktops
- Touch-friendly map interface
- Mobile-optimized forms
- Responsive layout adapts to screen size

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Map not showing | Clear browser cache, refresh page |
| Location not saving | Make sure to click "Confirm Location" |
| Photos not uploading | Check file format (JPG, PNG) and size |
| No notifications | Check notifications list in "Updates" tab |
| Forgot mobile number | Choose a new name for new registration |

## 📞 Support

For issues or questions:
1. Check FEATURES.md for detailed information
2. Review the code comments for implementation details
3. Test with sample data to understand the workflow

---

**Enjoy using FIX MY STREET! Help your community by reporting and tracking civic issues! 🚀**
