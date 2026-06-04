'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useRef } from 'react';
import L from 'leaflet';
import type { Complaint } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n';

// Rajapalayam city coordinates
const RAJAPALAYAM_CENTER: [number, number] = [9.4515, 77.5543];
const RAJAPALAYAM_ZOOM = 14;

// Define custom marker icons with colors
const getMarkerIcon = (status: Complaint['status']) => {
  let color = '#FF0000'; // Red for open
  
  if (status === 'assigned' || status === 'in-progress') {
    color = '#FFD700'; // Yellow for in progress
  } else if (status === 'resolved' || status === 'closed') {
    color = '#00AA00'; // Green for resolved
  }

  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.35);
      ">
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
    className: 'complaint-marker',
  });
};

const StatusBadge = ({ status }: { status: Complaint['status'] }) => {
  const { t } = useLanguage();

  const colors: Record<Complaint['status'], string> = {
    open: 'bg-red-100 text-red-800 border-red-300',
    assigned: 'bg-purple-100 text-purple-800 border-purple-300',
    'in-progress': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    resolved: 'bg-green-100 text-green-800 border-green-300',
    closed: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  const labels: Record<Complaint['status'], string> = {
    open: t('reportedRed'),
    assigned: t('assignedYellow'),
    'in-progress': t('inProgressYellow'),
    resolved: t('resolvedGreen'),
    closed: t('closedGreen'),
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${colors[status]}`}>
      {labels[status]}
    </span>
  );
};

interface ComplaintMapProps {
  complaints: Complaint[];
  onMarkerClick?: (complaint: Complaint) => void;
  selectedComplaintId?: string;
}

export function ComplaintMap({ complaints, onMarkerClick, selectedComplaintId }: ComplaintMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const { t, language } = useLanguage();

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer
        center={RAJAPALAYAM_CENTER}
        zoom={RAJAPALAYAM_ZOOM}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        
        {complaints.map((complaint) => (
          <Marker
            key={complaint.id}
            position={[complaint.latitude, complaint.longitude]}
            icon={getMarkerIcon(complaint.status)}
          >
            <Popup closeButton={true} className="complaint-popup">
              <div className="w-72 max-w-sm p-3 space-y-2">
                <div>
                  <StatusBadge status={complaint.status} />
                </div>
                <h3 className="font-bold text-sm text-foreground leading-snug">{complaint.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{complaint.description}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-muted/50">
                  <span className="font-semibold text-foreground">{complaint.citizenName}</span>
                  <span className="font-mono bg-muted/65 px-1.5 py-0.5 rounded border text-[10px]">
                    {t(complaint.priority as any).toUpperCase()}
                  </span>
                </div>
                {complaint.photoUrls && complaint.photoUrls.length > 0 && (
                  <div className="pt-1.5">
                    <img
                      src={complaint.photoUrls[0]}
                      alt="complaint"
                      className="w-full h-24 object-cover rounded-md border border-border"
                    />
                  </div>
                )}
                {onMarkerClick && (
                  <div className="pt-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onMarkerClick(complaint);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                      }}
                      onTouchEnd={(e) => {
                        e.stopPropagation();
                      }}
                      size="sm"
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold py-1.5"
                    >
                      {t('viewDetailsLabel')}
                    </Button>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
