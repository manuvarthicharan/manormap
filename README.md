# ManorMap — Map-First Real Estate Discovery Engine

A high-performance, map-first real estate discovery platform powered by **Google Maps JavaScript API**, custom HTML **OverlayView price markers**, interactive pin dropping, and architected for **PostgreSQL + PostGIS**.

---

## 🌟 Key Architecture & Highlights

### 1. Google Maps Engine
- **Map Rendering**: Google Maps JavaScript API
- **Demo API Key**: Configured in `src/services/googleMapsLoader.ts` and `index.html`
- **Supported Map Types**: Roadmap, Satellite, Hybrid, and Terrain elevation modes
- **Custom Price Markers**: Rendered via `google.maps.OverlayView` to provide clean HTML/CSS price badges with hover effects, click selection, and Rent/Sale indicators
- **Geospatial Database Backend**: PostgreSQL + PostGIS ready (`ST_Contains`, `ST_MakeEnvelope`, `Point(lng, lat)`).

### 2. Map-First UI
- **Homepage is 100% Map**: Opening the app immediately presents the map across 100% of the viewport.
- **No Clutter**: No persistent sidebar, no default dashboard widgets, no pre-loaded list panels, no onboarding overlays.
- **Minimal Floating Controls**:
  - **Top**: Compact location search bar with quick Indian hub discovery chips, filter popover, user avatar button, and hamburger menu button.
  - **Bottom**: Unobtrusive floating `+ Add Property` button.
  - **Edge Controls**: Current location, Reset North compass, Zoom In (+), Zoom Out (-), Google Map layer switcher.
- **"Search this area" Action**: Automatically surfaces a floating pill when panning to fresh coordinates.

### 3. Interactive Pin Dropping (Zero Raw Coordinates)
- Adding a property features a dedicated pin dropping mode.
- Users pan or click on the map to place their pin.
- Live reverse geocoding detects the area, city, and PIN code in real time.
- Clicking "Set Pin Location Here" auto-populates the property address.

### 4. Hidden Slide-Out Navigation Drawer
- Hidden initially; opens smoothly when clicking the menu button.
- **Sections**:
  - **DISCOVER**: Explore Map
  - **MY ACTIVITY**: My Properties (with listing deletion), Messages, Favorites, Saved Searches, Notifications
  - **ACCOUNT**: My Profile, Settings & Map Source, Help & Support

### 5. Compact Floating Property Preview & Full Modal
- Desktop: Floating edge card with subtle shadows and high contrast.
- Mobile: Responsive bottom sheet with touch handle.
- Features: High-res photo galleries, interactive Home Loan EMI Estimator, one-click WhatsApp inquiries, and Google Maps direct directions.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or pnpm

### Development
```bash
# Start Vite development server
npm run dev
```

### Production Build
```bash
# Build production bundle with TypeScript check
npm run build

# Preview build locally
npm run preview
```

---

## 🗄️ PostgreSQL + PostGIS Schema

The backend query architecture is designed for production scale with PostGIS:

```sql
-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Properties Table
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  price NUMERIC(15, 2) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('sale', 'rent')),
  category VARCHAR(50) NOT NULL,
  bhk INT NOT NULL,
  bathrooms INT NOT NULL,
  area_sqft INT NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  geom GEOMETRY(Point, 4326) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2D R-Tree Spatial Index for ultra-fast spatial search
CREATE INDEX idx_properties_geom ON properties USING GIST (geom);

-- Viewport Bounding Box Query (executed when map moves)
SELECT 
  id, title, price, type, bhk, area_sqft,
  ST_X(geom) AS lng,
  ST_Y(geom) AS lat
FROM properties
WHERE ST_Contains(
  ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat, 4326),
  geom
)
LIMIT 100;
```

---

## 🗺️ OpenStreetMap Tile Usage Policy Compliance
- Map tiles are rendered via raster tile layer in MapLibre with native caching.
- Attribution `© OpenStreetMap contributors` is visible and cleanly styled at all times.
- Tile providers are swappable via the UI to self-hosted OSM tile servers (`http://localhost:8080/tile/{z}/{x}/{y}.png`), Carto Voyager, or Humanitarian styles.

