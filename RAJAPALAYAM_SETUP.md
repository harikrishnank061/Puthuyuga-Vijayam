# FIX MY STREET - Rajapalayam Setup

## Location Configuration

The application has been configured to focus exclusively on **Rajapalayam, Tamil Nadu**.

### Coordinates
- **Latitude**: 10.3667°N
- **Longitude**: 77.5667°E
- **Map Zoom Level**: 14 (City-level detail)
- **Map Center**: Rajapalayam city center

### Configuration Files Updated

#### 1. **complaint-map.tsx**
- Center: `[10.3667, 77.5667]`
- Zoom: `14`
- Displays all complaints on Rajapalayam map
- Color-coded markers: Red (Open) → Yellow (In Progress) → Green (Resolved)

#### 2. **location-picker.tsx**
- Default center: Rajapalayam coordinates
- GPS detection: Only accepts locations within Rajapalayam bounds
- Bounds check: Latitude 10.2-10.5, Longitude 77.4-77.7
- Fallback: Centers on Rajapalayam if GPS fails

#### 3. **admin-map-view.tsx**
- City label: "Rajapalayam, Tamil Nadu"
- Map focused on city boundaries
- Filters complaints by status and priority

#### 4. **citizen-dashboard.tsx**
- Header: "Rajapalayam - Civic Complaint System"
- Displays all user complaints on Rajapalayam map

#### 5. **admin-dashboard.tsx**
- Header: "Rajapalayam - Complaint Management"
- Shows all city complaints on map

#### 6. **app/page.tsx** (Home)
- Added city label: "Rajapalayam, Tamil Nadu"
- Professional branding

## Map Features

### Complaint Markers
- **Red Circle (Open)**: Newly reported issues
- **Yellow Circle (In Progress)**: Being worked on
- **Green Circle (Resolved)**: Issues fixed

### Interactive Elements
- Click on markers to view complaint details
- Popup shows:
  - Status badge with color
  - Issue title and description
  - Citizen name and priority
  - First photo (if available)
  - "View Details" button

### Location Selection
When citizens report an issue:
1. Map centers on Rajapalayam
2. Click any location on the map to pin the issue
3. GPS detection shows user's location (if within city)
4. Selected location coordinates are stored with the complaint

## Data Storage
All data is stored locally using LocalStorage:
- Complaints include latitude/longitude
- Locations are accurate to the city of Rajapalayam
- No data sent to external servers

## Testing the Setup

### Citizens
1. Register with name and mobile number
2. Click "Report Issue" → "Select Location on Map"
3. Click on any location in Rajapalayam
4. Complete the report with details and photos
5. View all your complaints on the map

### Admin (Username: ADMIN, Password: ADMIN123)
1. Login to admin panel
2. View all citizen complaints on Rajapalayam map
3. Click markers or use status tabs to filter
4. Update complaint status → triggers color change
5. Red → Yellow → Green workflow

## Benefits of Rajapalayam Focus

✓ **Localized System**: Focus on single city administration
✓ **Easy Navigation**: Clear map boundaries and zoom level
✓ **GPS Validation**: Prevents out-of-bounds entries
✓ **Professional**: City-specific branding throughout
✓ **Scalable**: Can be adapted for other cities with same coordinates
