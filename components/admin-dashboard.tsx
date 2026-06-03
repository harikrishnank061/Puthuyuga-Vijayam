'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';
import { getComplaints, getNotifications, getCitizens, updateComplaintStatus, createNotification, deleteCitizen } from '@/lib/db';
import { AdminMapView } from '@/components/admin-map-view';
import type { Citizen, Complaint, LocalNotification } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ComplaintManagementModal } from './complaint-management-modal';

const STATUS_TABS = ['open', 'assigned', 'in-progress', 'resolved'] as const;

export function AdminDashboard() {
  const { logoutAdmin } = useAuth();
  const { t, toggleLanguage, language } = useLanguage();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notifications, setNotifications] = useState<LocalNotification[]>([]);
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [activeTab, setActiveTab] = useState<'map' | 'users' | typeof STATUS_TABS[number]>('map');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [successBanner, setSuccessBanner] = useState('');
  const [errorBanner, setErrorBanner] = useState('');

  const triggerSuccess = (msg: string) => {
    setSuccessBanner(msg);
    setErrorBanner('');
    setTimeout(() => {
      setSuccessBanner((prev) => (prev === msg ? '' : prev));
    }, 4500);
  };

  const triggerError = (msg: string) => {
    setErrorBanner(msg);
    setSuccessBanner('');
    setTimeout(() => {
      setErrorBanner((prev) => (prev === msg ? '' : prev));
    }, 4500);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const loadData = async () => {
    try {
      const allComplaints = await getComplaints();
      setComplaints(allComplaints);

      const allNotifications = await getNotifications();
      setNotifications(allNotifications);

      const allCitizens = await getCitizens();
      setCitizens(allCitizens);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    }
  };

  const handleLogout = () => {
    logoutAdmin();
  };

  const handleComplaintSelect = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setShowManageModal(true);
  };

  const handleComplaintUpdate = () => {
    loadData();
    setSelectedComplaint(null);
    setShowManageModal(false);
  };

  const handleQuickAction = async (e: React.MouseEvent, complaint: Complaint) => {
    e.stopPropagation();
    
    let nextStatus: Complaint['status'] | null = null;
    let assignee = undefined;
    let note = '';

    if (complaint.status === 'open') {
      nextStatus = 'assigned';
      const promptMsg = language === 'ta' 
        ? 'பணியாளர் பெயரை உள்ளிடவும் (பணியாளர்/ஒப்பந்தக்காரர்):' 
        : 'Enter Assignee Name (Worker/Contractor):';
      const input = window.prompt(promptMsg);
      if (!input || !input.trim()) return;
      assignee = input.trim();
      note = `Assigned via Quick Action to ${assignee}`;
    } else if (complaint.status === 'assigned') {
      nextStatus = 'in-progress';
      note = 'Work started via Quick Action';
    } else if (complaint.status === 'in-progress') {
      nextStatus = 'resolved';
      note = 'Work completed via Quick Action';
    }

    if (nextStatus) {
      try {
        await updateComplaintStatus(complaint.id, nextStatus, 'ADMIN', note, assignee);
        
        let message = `Your complaint status updated to: ${nextStatus}`;
        if (nextStatus === 'assigned') message = `Your complaint has been assigned to: ${assignee}`;
        else if (nextStatus === 'in-progress') message = `Work started on your complaint: ${complaint.title}`;
        else if (nextStatus === 'resolved') message = `Work completed for your complaint: ${complaint.title}`;

        await createNotification(
          complaint.id,
          message,
          nextStatus === 'resolved' ? 'completion' : nextStatus === 'assigned' ? 'assignment' : 'status-update'
        );
        
        await loadData();
        triggerSuccess(language === 'ta' ? 'புகாரின் நிலை வெற்றிகரமாக புதுப்பிக்கப்பட்டது.' : 'Status updated successfully');
      } catch (error) {
        console.error('Failed to update quick action:', error);
      }
    }
  };

  const handleDeleteUser = async (citizenId: string, citizenName: string) => {
    const confirmMsg = language === 'ta'
      ? `எச்சரிக்கை: பயனர் ${citizenName}-ஐ நீக்க விரும்புகிறீர்களா? இந்த நடவடிக்கையை ரத்து செய்ய முடியாது.`
      : `WARNING: Are you sure you want to delete user ${citizenName}? This action cannot be undone.`;
    const isConfirmed = window.confirm(confirmMsg);
    if (!isConfirmed) return;

    const pwdPrompt = language === 'ta'
      ? 'நீக்குவதை உறுதிப்படுத்த நிர்வாக கடவுச்சொல்லை உள்ளிடவும்:'
      : 'Please enter Admin Password to confirm deletion:';
    const password = window.prompt(pwdPrompt);
    if (password === 'ADMIN123') {
      try {
        await deleteCitizen(citizenId);
        await loadData();
        triggerSuccess(language === 'ta' ? 'பயனர் வெற்றிகரமாக நீக்கப்பட்டார்.' : 'User deleted successfully.');
      } catch (error) {
        console.error('Failed to delete citizen:', error);
      }
    } else if (password !== null) {
      triggerError(language === 'ta' ? 'தவறான கடவுச்சொல். நீக்கம் ரத்து செய்யப்பட்டது.' : 'Incorrect password. Deletion cancelled.');
    }
  };

  const getStatusColor = (status: Complaint['status']) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'assigned':
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'resolved':
      case 'closed':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusLabel = (status: Complaint['status']) => {
    const labels: Record<Complaint['status'], string> = {
      open: t('reportedRed'),
      assigned: t('assignedYellow'),
      'in-progress': t('inProgressYellow'),
      resolved: t('resolvedGreen'),
      closed: t('closedGreen'),
    };
    return labels[status];
  };

  const filteredComplaints = complaints.filter(
    (c) => activeTab === 'map' || c.status === activeTab
  );
  const unreadNotifications = notifications.filter((n) => !n.read);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 flag-header shadow-lg">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex flex-col sm:flex-row items-center sm:justify-between justify-center gap-3 sm:gap-4 text-center sm:text-left">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flag-header-text">{t('appTitle')} - {t('adminDashboard')}</h1>
            <p className="text-xs sm:text-sm flag-header-subtext max-w-xs sm:max-w-none mx-auto">
              {language === 'ta' ? 'ராஜபாளையம் - புகார் நிர்வாகம்' : 'Rajapalayam - Complaint Management'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            {unreadNotifications.length > 0 && (
              <div className="bg-[#C31F26] text-white px-2.5 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold">
                {unreadNotifications.length} {language === 'ta' ? 'புதியவை' : 'New'}
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="text-[#C31F26] hover:bg-[#C31F26]/10 font-bold border border-[#C31F26]/30 text-xs sm:text-sm px-2 sm:px-3 py-1 h-8"
            >
              {language === 'en' ? 'தமிழ்' : 'English'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-[#C31F26] hover:bg-[#C31F26]/10 font-bold border border-[#C31F26]/30 text-xs sm:text-sm px-2 sm:px-3 py-1 h-8"
            >
              {t('logout')}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-5">
        {successBanner && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-lg text-sm font-semibold animate-fade-in flex justify-between items-center">
            <span>🎉 {successBanner}</span>
            <button 
              type="button" 
              onClick={() => setSuccessBanner('')} 
              className="text-emerald-600 hover:opacity-80 font-bold focus:outline-none"
            >
              ✕
            </button>
          </div>
        )}
        
        {errorBanner && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm font-semibold animate-fade-in flex justify-between items-center">
            <span>⚠️ {errorBanner}</span>
            <button 
              type="button" 
              onClick={() => setErrorBanner('')} 
              className="text-destructive hover:opacity-80 font-bold focus:outline-none"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto scrollbar-none w-full pb-0.5">
          <Button
            variant={activeTab === 'map' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('map')}
            className="rounded-b-none font-semibold whitespace-nowrap text-xs sm:text-sm px-2.5 sm:px-4 py-2"
          >
            📍 {t('mapView')}
          </Button>
          <Button
            variant={activeTab === 'users' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('users')}
            className="rounded-b-none font-semibold whitespace-nowrap text-xs sm:text-sm px-2.5 sm:px-4 py-2"
          >
            👥 {t('manageUsersLabel')}
          </Button>
          {STATUS_TABS.map((status) => (
            <Button
              key={status}
              variant={activeTab === status ? 'default' : 'ghost'}
              onClick={() => setActiveTab(status)}
              className={`rounded-b-none font-semibold whitespace-nowrap text-xs sm:text-sm px-2.5 sm:px-4 py-2 ${
                activeTab === status
                  ? status === 'open'
                    ? 'bg-red-600 hover:bg-red-700'
                    : status === 'in-progress' || status === 'assigned'
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'bg-green-600 hover:bg-green-700'
                  : ''
              }`}
            >
              {t(status as any)} ({complaints.filter((c) => c.status === status).length})
            </Button>
          ))}
        </div>

        {/* Map View */}
        {activeTab === 'map' && (
          <AdminMapView
            complaints={complaints}
            onComplaintSelect={handleComplaintSelect}
            selectedComplaint={selectedComplaint}
          />
        )}

        {/* Users View */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {citizens.length > 0 ? (
              citizens.map(citizen => (
                <Card key={citizen.id} className="border-border shadow-sm">
                  <CardContent className="pt-6 flex justify-between items-center gap-4">
                    <div>
                      <h3 className="font-semibold text-lg">{citizen.name}</h3>
                      <p className="text-muted-foreground">{citizen.mobileNumber}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {t('registeredLabel')}: {new Date(citizen.registeredAt).toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-US')}
                      </p>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDeleteUser(citizen.id, citizen.name)}
                      className="font-semibold"
                    >
                      {t('deleteUserBtn')}
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-border">
                <CardContent className="pt-6 text-center text-muted-foreground font-semibold">
                  {t('noUsersRegistered')}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* List View */}
        {activeTab !== 'map' && activeTab !== 'users' && (
          <div className="space-y-4">
            {filteredComplaints.length > 0 ? (
              filteredComplaints.map((complaint) => (
                <Card
                  key={complaint.id}
                  className="cursor-pointer hover:shadow-md transition-shadow border-border"
                  onClick={() => handleComplaintSelect(complaint)}
                >
                  <CardContent className="p-4 sm:p-6 pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1 space-y-2 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-base sm:text-lg">{complaint.title}</h3>
                          <Badge className={getStatusColor(complaint.status)}>
                            {getStatusLabel(complaint.status)}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{complaint.description}</p>
                        <div className="flex gap-1.5 mt-3 flex-wrap">
                          <Badge variant="outline" className="border-border text-[10px] sm:text-xs">{t(complaint.category as any)}</Badge>
                          <Badge variant="outline" className="border-border font-mono text-[10px] sm:text-xs">{t('priority')}: {t(complaint.priority as any).toUpperCase()}</Badge>
                        </div>
                        <div className="mt-2 text-[11px] sm:text-xs text-muted-foreground space-y-1">
                          <p>
                            <strong>{t('reportedByLabel')}:</strong> {complaint.citizenName}
                          </p>
                          <p>
                            <strong>{t('dateLabel')}:</strong> {new Date(complaint.createdAt).toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-US')}
                          </p>
                          {complaint.assignee && (
                            <p className="mt-1">
                              <strong>{t('assignedToLabel')}:</strong> {complaint.assignee}
                            </p>
                          )}
                        </div>
                      </div>
                      {complaint.photoUrls && complaint.photoUrls.length > 0 && (
                        <img
                          src={complaint.photoUrls[0]}
                          alt="complaint"
                          className="w-full h-48 sm:w-24 sm:h-24 object-cover rounded-md border border-border mt-2 sm:mt-0 self-center sm:self-start flex-shrink-0"
                        />
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex justify-end mt-4 pt-4 border-t gap-2 flex-wrap">
                      <h4 className="sr-only">{t('quickActionsLabel')}</h4>
                      {complaint.status === 'open' && (
                        <Button onClick={(e) => handleQuickAction(e, complaint)} size="sm" className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold">
                          {t('assignWorkerBtn')}
                        </Button>
                      )}
                      {complaint.status === 'assigned' && (
                        <Button onClick={(e) => handleQuickAction(e, complaint)} size="sm" className="w-full sm:w-auto bg-yellow-600 hover:bg-yellow-700 text-white font-bold">
                          {t('markInProgressBtn')}
                        </Button>
                      )}
                      {complaint.status === 'in-progress' && (
                        <Button onClick={(e) => handleQuickAction(e, complaint)} size="sm" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold">
                          {t('markCompletedBtn')}
                        </Button>
                      )}
                      {complaint.status === 'resolved' && (
                        <Button onClick={(e) => handleQuickAction(e, complaint)} size="sm" variant="outline" disabled className="w-full sm:w-auto border-border">
                          {t('completedBtn')}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-border">
                <CardContent className="pt-6 text-center text-muted-foreground font-semibold">
                  {t('noComplaintsStatus')}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {showManageModal && selectedComplaint && (
          <ComplaintManagementModal
            complaint={selectedComplaint}
            onClose={() => setShowManageModal(false)}
            onStatusUpdate={handleComplaintUpdate}
          />
        )}
      </main>
    </div>
  );
}
