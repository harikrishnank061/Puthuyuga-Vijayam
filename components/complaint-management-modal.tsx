'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { updateComplaintStatus, createNotification } from '@/lib/db';
import type { Complaint } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';

const NEXT_STATUS: Record<Complaint['status'], Complaint['status'] | null> = {
  open: 'assigned',
  assigned: 'in-progress',
  'in-progress': 'resolved',
  resolved: 'closed',
  closed: null,
};

// Custom status-colored marker icons for the mini map
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
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        font-size: 12px;
      ">
        📍
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    className: 'complaint-marker',
  });
};

export function ComplaintManagementModal({
  complaint,
  onClose,
  onStatusUpdate,
}: {
  complaint: Complaint;
  onClose: () => void;
  onStatusUpdate: () => void;
}) {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
  const [assignee, setAssignee] = useState('');
  const [selectedTab, setSelectedTab] = useState<'details' | 'timeline' | 'actions'>('details');
  const [error, setError] = useState('');

  const handleStatusUpdate = async () => {
    setError('');
    if (!note.trim()) {
      setError(t('requiredField'));
      return;
    }

    setLoading(true);
    try {
      const nextStatus = NEXT_STATUS[complaint.status];
      if (!nextStatus) {
        setError(language === 'ta' ? 'புகார் ஏற்கனவே மூடப்பட்டது' : 'Complaint is already closed');
        return;
      }
      
      if (nextStatus === 'assigned' && !assignee.trim()) {
        setError(language === 'ta' ? 'தயவுசெய்து நியமிக்கப்படும் பணியாளர் பெயரை உள்ளிடவும்' : 'Please enter the name of the person assigned to this task');
        return;
      }

      await updateComplaintStatus(
        complaint.id, 
        nextStatus, 
        'ADMIN', 
        note, 
        nextStatus === 'assigned' ? assignee : undefined
      );
      
      let message = `Your complaint status updated to: ${nextStatus}`;
      if (nextStatus === 'assigned') message = `Your complaint has been assigned to: ${assignee}`;
      else if (nextStatus === 'in-progress') message = `Work started on your complaint: ${complaint.title}`;
      else if (nextStatus === 'resolved') message = `Work completed for your complaint: ${complaint.title}`;

      await createNotification(
        complaint.id,
        message,
        nextStatus === 'resolved' ? 'completion' : nextStatus === 'assigned' ? 'assignment' : 'status-update'
      );

      setNote('');
      setAssignee('');
      onStatusUpdate();
    } catch (err: any) {
      setError(err.message || 'Error updating status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Complaint['status']) => {
    const colors: Record<Complaint['status'], string> = {
      open: 'bg-red-100 text-red-800 border-red-300',
      assigned: 'bg-purple-100 text-purple-800 border-purple-300',
      'in-progress': 'bg-orange-100 text-orange-800 border-orange-300',
      resolved: 'bg-green-100 text-green-800 border-green-300',
      closed: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const nextStatus = NEXT_STATUS[complaint.status];

  return (
    <div className="fixed inset-0 bg-black/65 flex items-start justify-center p-2 sm:p-4 z-[9999] overflow-y-auto animate-fade-in" style={{ zIndex: 9999 }}>
      <Card className="w-full max-w-4xl my-4 sm:my-8 shadow-2xl bg-card text-card-foreground">
        <CardHeader className="sticky top-0 bg-primary text-primary-foreground flex flex-row items-center justify-between z-10">
          <div>
            <CardTitle className="text-xl font-bold">{complaint.title}</CardTitle>
            <CardDescription className="text-primary-foreground/90 font-mono text-xs">
              {t('complaintId')}: {complaint.id}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-primary-foreground hover:bg-primary/80"
          >
            ✕
          </Button>
        </CardHeader>

        {/* Tabs */}
        <div className="border-b flex bg-muted/30 w-full overflow-x-auto scrollbar-none">
          {(['details', 'timeline', 'actions'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`flex-1 text-center px-3 sm:px-6 py-3 font-semibold text-xs sm:text-sm transition-colors border-b-2 whitespace-nowrap ${
                selectedTab === tab
                  ? 'border-primary text-primary bg-background'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {language === 'ta'
                ? tab === 'details'
                  ? 'விவரங்கள்'
                  : tab === 'timeline'
                  ? 'காலவரிசை'
                  : 'நடவடிக்கைகள்'
                : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <CardContent className="pt-6">
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm animate-fade-in">
              {error}
            </div>
          )}
          {selectedTab === 'details' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Complaint metadata & photos */}
              <div className="lg:col-span-7 space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t('status')}</p>
                    <Badge className={getStatusColor(complaint.status)}>
                      {t(complaint.status as any).toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t('priority')}</p>
                    <p className="font-semibold capitalize">{t(complaint.priority as any)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t('category')}</p>
                    <p className="font-semibold">{t(complaint.category as any)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t('reportedByLabel')}</p>
                    <p className="font-semibold">{complaint.citizenName}</p>
                  </div>
                  {complaint.assignee && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t('assignedToLabel')}</p>
                      <p className="font-semibold text-primary">{complaint.assignee}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t('createdAt')}</p>
                    <p className="font-semibold">
                      {new Date(complaint.createdAt).toLocaleString(language === 'ta' ? 'ta-IN' : 'en-US')}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t('complaintDescription')}</p>
                  <p className="p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap">{complaint.description}</p>
                </div>

                {complaint.photoUrls.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">{t('beforeAfterPhotosLabel')}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                      {complaint.photoUrls.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`Photo ${idx + 1}`}
                          className="rounded border border-border w-full h-24 sm:h-32 object-cover cursor-pointer hover:opacity-85 transition"
                          onClick={() => window.open(url, '_blank')}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {complaint.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">{t('adminNotesLabel')}</p>
                    <p className="p-3 bg-accent/5 rounded-lg text-sm border-l-4 border-primary">
                      {complaint.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: Mini Interactive Map */}
              <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-border pt-6 lg:pt-0 lg:pl-8 space-y-4">
                <div>
                  <p className="text-sm font-semibold mb-1">{t('locationLabel')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('latitude')}: {complaint.latitude.toFixed(4)}, {t('longitude')}: {complaint.longitude.toFixed(4)}
                  </p>
                </div>

                <div className="w-full h-[200px] sm:h-[280px] rounded-lg overflow-hidden border border-border bg-muted">
                  <MapContainer
                    center={[complaint.latitude, complaint.longitude]}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={true}
                  >
                    <TileLayer
                      attribution='&copy; OpenStreetMap'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[complaint.latitude, complaint.longitude]} icon={getMarkerIcon(complaint.status)} />
                  </MapContainer>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'timeline' && (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {complaint.timeline.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">{t('noTimelineEntries')}</p>
              ) : (
                complaint.timeline.map((entry, idx) => (
                  <div key={idx} className="p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold capitalize text-primary">
                        {t(entry.status as any)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleString(language === 'ta' ? 'ta-IN' : 'en-US')}
                      </p>
                    </div>
                    {entry.note && (
                      <p className="text-sm mb-1 text-foreground">
                        {entry.note === 'Complaint registered' 
                          ? (language === 'ta' ? 'புகார் வெற்றிகரமாக பதிவு செய்யப்பட்டது' : 'Complaint registered') 
                          : entry.note}
                      </p>
                    )}
                    {entry.adminName && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {language === 'ta' ? 'நிர்வாகி மூலம்:' : 'by:'} {entry.adminName}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {selectedTab === 'actions' && (
            <div className="space-y-6">
              {nextStatus ? (
                <div className="p-5 bg-primary/5 rounded-lg border border-primary/10 space-y-4">
                  <h3 className="font-semibold text-lg">
                    {t('updateStatusTo')} <span className="text-primary capitalize">{t(nextStatus as any)}</span>
                  </h3>

                  <div>
                    <label className="text-sm font-semibold">{t('updateStatus')}</label>
                    <textarea
                      placeholder={t('statusExplanationPlaceholder')}
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      disabled={loading}
                      className="w-full mt-2 px-3 py-2 border border-border rounded-md bg-background text-foreground min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {nextStatus === 'assigned' && (
                    <div>
                      <label className="text-sm font-semibold">{t('assignToLabel')}</label>
                      <Input
                        placeholder={t('workerNamePlaceholder')}
                        value={assignee}
                        onChange={e => setAssignee(e.target.value)}
                        disabled={loading}
                        className="w-full mt-2 bg-background text-foreground border-border"
                      />
                    </div>
                  )}

                  <Button
                    onClick={handleStatusUpdate}
                    disabled={loading || !note.trim()}
                    className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/95"
                  >
                    {loading ? t('loading') : `${t('updateStatusButton')} (${t(nextStatus as any).toUpperCase()})`}
                  </Button>
                </div>
              ) : (
                <div className="p-4 bg-muted rounded-lg border text-center">
                  <p className="text-sm text-muted-foreground">
                    {t('complaintAlreadyClosed')}
                  </p>
                </div>
              )}

              <div className="p-4 bg-muted/30 rounded-lg border border-border">
                <h3 className="font-semibold mb-3 text-sm text-foreground">{t('workflowStatusLabel')}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                  <span className="inline-block w-3 h-3 bg-red-500 rounded-full"></span>
                  {t('open')}
                  <span className="text-muted-foreground/50">→</span>
                  <span className="inline-block w-3 h-3 bg-purple-500 rounded-full"></span>
                  {t('assigned')}
                  <span className="text-muted-foreground/50">→</span>
                  <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full"></span>
                  {t('inProgress')}
                  <span className="text-muted-foreground/50">→</span>
                  <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
                  {t('resolved')}
                  <span className="text-muted-foreground/50">→</span>
                  <span className="inline-block w-3 h-3 bg-gray-500 rounded-full"></span>
                  {t('closed')}
                </div>
              </div>
            </div>
          )}

          {/* Back Button */}
          <div className="mt-6 pt-4 border-t flex justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              className="px-6 border-border"
            >
              {t('back')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
