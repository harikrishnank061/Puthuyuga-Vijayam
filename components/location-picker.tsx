'use client';

import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/lib/i18n';

// Fix leaflet default icon issue
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Rajapalayam city coordinates
const RAJAPALAYAM_CENTER = [9.4515, 77.5543] as const;
const RAJAPALAYAM_ZOOM = 14;

// Rajapalayam constituency boundary coordinates
const LAT_MIN = 9.35;
const LAT_MAX = 9.55;
const LNG_MIN = 77.45;
const LNG_MAX = 77.65;

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
  initialLat?: number;
  initialLng?: number;
}

function ClickableMap({ 
  onSelect, 
}: { 
  onSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e: any) => {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
}

function MapUpdater({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom(), {
      animate: true,
      duration: 1
    });
  }, [lat, lng, map]);
  return null;
}

export function LocationPicker({
  onLocationSelect,
  initialLat = RAJAPALAYAM_CENTER[0],
  initialLng = RAJAPALAYAM_CENTER[1],
}: LocationPickerProps) {
  const { t, language } = useLanguage();
  const [selectedLat, setSelectedLat] = useState(initialLat);
  const [selectedLng, setSelectedLng] = useState(initialLng);
  const [searchAddress, setSearchAddress] = useState('');
  const [error, setError] = useState('');
  const mapRef = useRef(null);

  const isWithinRajapalayam = (lat: number, lng: number) => {
    return lat >= LAT_MIN && lat <= LAT_MAX && lng >= LNG_MIN && lng <= LNG_MAX;
  };

  useEffect(() => {
    // Try to get user's current location, but keep it within Rajapalayam bounds
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          if (isWithinRajapalayam(lat, lng)) {
            setSelectedLat(lat);
            setSelectedLng(lng);
            onLocationSelect(lat, lng, searchAddress); // Update parent form state automatically
          }
        },
        () => {
          // Fallback to default
        }
      );
    }
  }, []);

  const handleLocationSelect = (lat: number, lng: number) => {
    setError('');
    if (!isWithinRajapalayam(lat, lng)) {
      setError(language === 'ta' 
        ? 'இந்தச் செயலி ராஜபாளையம் தொகுதிக்குள் மட்டுமே செயல்படும்!' 
        : 'This application only supports issues within the Rajapalayam Constituency!');
      return;
    }
    setSelectedLat(lat);
    setSelectedLng(lng);
    onLocationSelect(lat, lng, searchAddress); // Update parent instantly
  };

  const handleConfirm = () => {
    onLocationSelect(selectedLat, selectedLng, searchAddress);
  };

  const handleGetCurrentLocation = () => {
    setError('');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          if (!isWithinRajapalayam(lat, lng)) {
            setError(language === 'ta'
              ? 'உங்கள் தற்போதைய இருப்பிடம் ராஜபாளையம் தொகுதிக்கு வெளியே உள்ளது!'
              : 'Your current location is outside the Rajapalayam Constituency!');
            return;
          }
          setSelectedLat(lat);
          setSelectedLng(lng);
          onLocationSelect(lat, lng, searchAddress); // Update parent instantly
        },
        () => {
          setError(language === 'ta' ? 'தற்போதைய இருப்பிடத்தைப் பெற முடியவில்லை' : 'Unable to get current location');
        }
      );
    } else {
      setError(language === 'ta' ? 'புவிஇருப்பிட சேவை ஆதரிக்கப்படவில்லை' : 'Geolocation is not supported');
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3.5 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-xs font-semibold animate-fade-in flex justify-between items-center">
          <span>⚠️ {error}</span>
          <button 
            type="button" 
            onClick={() => setError('')} 
            className="text-destructive hover:opacity-85 text-sm ml-2 font-bold focus:outline-none"
          >
            ✕
          </button>
        </div>
      )}
      <div className="space-y-2">
        <label className="text-sm font-semibold">{t('selectLocation')}</label>
        <p className="text-xs text-muted-foreground">
          {t('clickMapOrUseGPS')}
        </p>
      </div>

      <div className="w-full h-[300px] rounded-lg overflow-hidden border border-border">
        <MapContainer
          center={[selectedLat, selectedLng]}
          zoom={RAJAPALAYAM_ZOOM}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[selectedLat, selectedLng]} />
          <ClickableMap onSelect={handleLocationSelect} />
          <MapUpdater lat={selectedLat} lng={selectedLng} />
        </MapContainer>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <label className="text-xs font-semibold mb-1 block">{t('latitude')}</label>
          <Input
            type="number"
            step="0.0001"
            value={selectedLat.toFixed(4)}
            readOnly
            className="bg-muted"
          />
        </div>
        <div>
          <label className="text-xs font-semibold mb-1 block">{t('longitude')}</label>
          <Input
            type="number"
            step="0.0001"
            value={selectedLng.toFixed(4)}
            readOnly
            className="bg-muted"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold">
          {language === 'ta' ? 'இருப்பிட விளக்கம் (விருப்பப்பட்டால்)' : 'Location Description (Optional)'}
        </label>
        <Input
          placeholder={language === 'ta' ? 'உதாரணம்: அண்ணா சாலை சந்திப்பு அருகில், கோவில் எதிரில்' : 'e.g., Near Anna Salai Junction, Opposite Temple'}
          onChange={(e) => {
            setSearchAddress(e.target.value);
            onLocationSelect(selectedLat, selectedLng, e.target.value);
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          onClick={handleGetCurrentLocation}
          className="w-full font-semibold"
        >
          📍 {t('currentLocation')}
        </Button>
        <Button
          onClick={handleConfirm}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/95 font-semibold"
        >
          {language === 'ta' ? 'இருப்பிடத்தை உறுதிப்படுத்து' : 'Confirm Location'}
        </Button>
      </div>
    </div>
  );
}
