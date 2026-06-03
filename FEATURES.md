# FIX MY STREET - Civic Complaint Management System

## 🗺️ Map-Based Complaint Tracking

### Interactive Map Interface
- **Location-Based Visualization**: All complaints are displayed on an interactive Leaflet map
- **Color-Coded Status System**:
  - 🔴 **RED** = Reported (Open status)
  - 🟡 **YELLOW** = In Progress (Assigned or In-Progress status)
  - 🟢 **GREEN** = Resolved (Resolved or Closed status)

### Features

#### 1. **Citizen Dashboard**
- **Map View**: Visual representation of all your reported issues
  - Click any marker to see complaint details in a popup
  - View before photos and issue descriptions
  - See complaint status at a glance

- **Location Selection During Reporting**:
  - Interactive map picker when reporting a new issue
  - Click directly on the map to select the exact location
  - Use "Get Current Location" button for GPS-based location
  - Manual latitude/longitude adjustment if needed
  - Add location description/landmark for clarity

- **Multi-Step Reporting Process**:
  1. **Details Step**: Enter title, description, category, priority
  2. **Location Step**: Select location on map or use GPS
  3. **Photos Step**: Upload before photos of the issue

- **Complaint Tracking**:
  - View all your complaints in list format
  - See status updates and timeline of actions
  - Receive notifications when status changes
  - Statistics showing reported, in-progress, and resolved issues

#### 2. **Admin Dashboard**
- **Map View with Full Control**:
  - See all complaints on the map from all citizens
  - Filter by status (Reported, In Progress, Resolved)
  - Filter by priority (Low, Medium, High, Critical)
  - Real-time statistics dashboard:
    - Total issues count
    - Issues by status with color coding
    - Quick overview of workload

- **Complaint Management**:
  - Click any marker to open management modal
  - Update complaint status with workflow
  - Add administrative notes
  - Upload after-completion photos
  - View full complaint timeline
  - See citizen contact information

- **Status Workflow**:
  - Open (Red) → Assign work
  - Assigned (Yellow) → Mark as In Progress
  - In Progress (Yellow) → Mark as Resolved
  - Resolved (Green) → Close if done
  - Each status change creates a timeline entry

### Technical Implementation

#### Components Created
1. **ComplaintMap** (`components/complaint-map.tsx`): 
   - Renders Leaflet map with color-coded markers
   - Displays complaint popups with details
   - Customizable icons based on status

2. **LocationPicker** (`components/location-picker.tsx`):
   - Interactive map interface for location selection
   - Geolocation support
   - Latitude/longitude display
   - Address description field

3. **AdminMapView** (`components/admin-map-view.tsx`):
   - Comprehensive admin map interface
   - Filtering and statistics
   - Complaint list sidebar
   - Quick action access

4. **Updated Dashboards**:
   - Citizen Dashboard: Integrated map view with multi-tab interface
   - Admin Dashboard: Map-first interface with status management

#### Data Structure
Each complaint includes:
- Location: `latitude`, `longitude`
- Status: `open` | `assigned` | `in-progress` | `resolved` | `closed`
- Priority: `low` | `medium` | `high` | `critical`
- Timeline: Array of status updates with timestamps
- Photos: Before and after photo URLs
- Citizen Info: Name and contact number

### Visual Design
- **Professional Government Portal Aesthetic**:
  - Tamil Nadu inspired color scheme
  - Deep green (#1A522A equivalent) for primary actions
  - Gold (#DAA520) accents for highlights
  - Clear status color indicators

- **Responsive Layout**:
  - Works on desktop, tablet, and mobile
  - Map scales automatically
  - Touch-friendly interface for mobile users
  - Full-screen map view on larger screens

### Multilingual Support
- **English & Tamil**: All UI elements support both languages
- **Language Toggle**: Switch between English and Tamil in header
- **Translations**: Category labels, status descriptions, and messages

### Local Storage Database
- All data persists in browser LocalStorage
- No backend server required
- Automatic data synchronization across tabs
- Demo data can be manually populated

### Usage Examples

#### For Citizens:
1. Click "Citizen" on home screen
2. Register with name and mobile number
3. Click "📍 Map View" or "Report New Issue"
4. Fill issue details (title, description, category, priority)
5. Select location by clicking on map or using GPS
6. Upload photos of the issue
7. Track all your reports on the map with real-time status updates

#### For Admins:
1. Click "Admin" on home screen
2. Login with: 
   - Username: `ADMIN`
   - Password: `ADMIN123`
3. View all citizen complaints on the map
4. Filter by status or priority
5. Click any red/yellow/green marker to open details
6. Update status, add notes, upload after-completion photos
7. Monitor statistics in real-time

### Color Status Guide
- **RED (🔴) - Reported**: Citizen just submitted the complaint
- **YELLOW (🟡) - In Progress**: Authorities are working on it
- **GREEN (🟢) - Resolved**: Issue has been fixed

### Future Enhancements
- SMS/Email notifications to citizens
- Integration with actual civic authority systems
- Real payment system for service complaints
- Advanced analytics and heatmaps
- Mobile app version
- Real backend database
