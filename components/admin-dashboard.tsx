'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';
import { getComplaints, getNotifications, getCitizens, updateComplaintStatus, createNotification, deleteCitizen, deleteComplaint } from '@/lib/db';
import { AdminMapView } from '@/components/admin-map-view';
import type { Citizen, Complaint, LocalNotification } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ComplaintManagementModal } from './complaint-management-modal';
import {
  Map, Users, CheckCircle2, AlertTriangle, Building2,
  X, FileText, Clock, AlertCircle, LogOut, Globe, Trash2
} from 'lucide-react';

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
    setTimeout(() => setSuccessBanner((prev) => (prev === msg ? '' : prev)), 4500);
  };

  const triggerError = (msg: string) => {
    setErrorBanner(msg);
    setSuccessBanner('');
    setTimeout(() => setErrorBanner((prev) => (prev === msg ? '' : prev)), 4500);
  };

  useEffect(() => {
    if (showManageModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showManageModal]);

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

  const handleLogout = () => logoutAdmin();

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
    if (!window.confirm(confirmMsg)) return;

    const pwdPrompt = language === 'ta'
      ? 'நீக்குவதை உறுதிப்படுத்த நிர்வாக கடவுச்சொல்லை உள்ளிடவும்:'
      : 'Please enter Admin Password to confirm deletion:';
    const password = window.prompt(pwdPrompt);
    if (password === 'ADMIN123') {
      setCitizens((prev) => prev.filter((c) => c.id !== citizenId));
      try {
        await deleteCitizen(citizenId);
        await loadData();
        triggerSuccess(language === 'ta' ? 'பயனர் வெற்றிகரமாக நீக்கப்பட்டார்.' : 'User deleted successfully.');
      } catch (error) {
        console.error('Failed to delete citizen:', error);
        await loadData();
      }
    } else if (password !== null) {
      triggerError(language === 'ta' ? 'தவறான கடவுச்சொல். நீக்கம் ரத்து செய்யப்பட்டது.' : 'Incorrect password. Deletion cancelled.');
    }
  };

  const getStatusColor = (status: Complaint['status']) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800 border-red-300';
      case 'assigned':
      case 'in-progress': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'resolved':
      case 'closed': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
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

  const filteredComplaints = complaints.filter((c) => {
    if (activeTab === 'map' || activeTab === 'users') return true;
    if (activeTab === 'resolved') {
      return c.status === 'resolved' || c.status === 'closed';
    }
    return c.status === activeTab;
  });
  const unreadNotifications = notifications.filter((n) => !n.read);

  const stats = {
    total: complaints.length,
    open: complaints.filter(c => c.status === 'open').length,
    inProgress: complaints.filter(c => c.status === 'in-progress' || c.status === 'assigned').length,
    resolved: complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length,
  };

  return (
    <div className="min-h-screen flex flex-col auth-page-bg">

      <header className="sticky top-0 bg-white/95 backdrop-blur-md shadow-md border-b-4 border-[#C31F26] safe-top" style={{ zIndex: 9999 }}>
        <div className="container mx-auto px-4 pt-[calc(env(safe-area-inset-top,0px)+12px)] pb-3 flex items-center justify-between gap-4">
          {/* Left: Logo + Title */}
          <div className="flex items-center gap-3">
            <img 
              src="/Puthuyuga Vijayam Logo.png" 
              alt="App Logo" 
              className="w-12 h-12 sm:w-14 sm:h-14 object-contain flex-shrink-0"
            />
            <div className="text-left">
              <h1
                className="text-base sm:text-lg font-bold text-[#C31F26] tracking-tight leading-none"
                style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}
              >
                {t('appTitle')}
              </h1>
              <p className="text-[10px] text-[#8B3A3A] font-semibold mt-0.5">
                {language === 'ta' ? 'ராஜபாளையம் - புகார் நிர்வாகம்' : 'Rajapalayam - Complaint Management'}
              </p>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2 justify-end flex-shrink-0">
            {unreadNotifications.length > 0 && (
              <div className="bg-[#C31F26] text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-sm whitespace-nowrap">
                {unreadNotifications.length} {language === 'ta' ? 'புதியவை' : 'New'}
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="text-[#C31F26] hover:bg-[#C31F26]/10 font-bold border border-[#C31F26]/30 text-xs px-2.5 py-1 h-8 rounded-lg flex items-center gap-1"
              title={language === 'en' ? 'தமிழ்' : 'English'}
            >
              <Globe className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">{language === 'en' ? 'தமிழ்' : 'English'}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-[#C31F26] hover:bg-[#C31F26]/10 font-bold border border-[#C31F26]/30 text-xs px-2.5 py-1 h-8 rounded-lg flex items-center gap-1"
              title={t('logout')}
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">{t('logout')}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="container mx-auto px-4 py-5 space-y-5">

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-[#FDF5E6] to-[#FAE9C8] border border-[#C31F26]/15 rounded-2xl p-4 shadow-sm">
            <div className="w-9 h-9 bg-[#C31F26]/10 rounded-xl flex items-center justify-center mb-2">
              <FileText className="h-4 w-4 text-[#C31F26]" />
            </div>
            <div className="text-2xl font-extrabold text-[#C31F26]">{stats.total}</div>
            <p className="text-xs font-bold text-[#8B3A3A] mt-0.5">{t('totalReports')}</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100/60 border border-red-200/60 rounded-2xl p-4 shadow-sm">
            <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center mb-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
            </div>
            <div className="text-2xl font-extrabold text-red-600">{stats.open}</div>
            <p className="text-xs font-bold text-red-800/70 mt-0.5">{t('reportedRed')}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/60 border border-amber-200/60 rounded-2xl p-4 shadow-sm">
            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center mb-2">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-2xl font-extrabold text-amber-600">{stats.inProgress}</div>
            <p className="text-xs font-bold text-amber-800/70 mt-0.5">{t('inProgressYellow')}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/60 border border-emerald-200/60 rounded-2xl p-4 shadow-sm">
            <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center mb-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-600">{stats.resolved}</div>
            <p className="text-xs font-bold text-emerald-800/70 mt-0.5">{t('resolvedGreen')}</p>
          </div>
        </div>

        {/* Success / Error Banners */}
        {successBanner && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-semibold animate-fade-in flex justify-between items-center">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              {successBanner}
            </span>
            <button type="button" onClick={() => setSuccessBanner('')} className="text-emerald-600 hover:opacity-70 focus:outline-none ml-2">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {errorBanner && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-semibold animate-fade-in flex justify-between items-center">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
              {errorBanner}
            </span>
            <button type="button" onClick={() => setErrorBanner('')} className="text-red-600 hover:opacity-70 focus:outline-none ml-2">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b-2 border-[#C31F26]/15 overflow-x-auto scrollbar-none w-full pb-0.5">
          <Button
            variant={activeTab === 'map' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('map')}
            className={`rounded-b-none font-semibold whitespace-nowrap text-xs sm:text-sm px-2.5 sm:px-4 py-2 flex items-center gap-1.5 ${activeTab === 'map' ? 'bg-[#C31F26] hover:bg-[#a0191f] text-white' : 'text-[#6B1D1D] hover:bg-[#C31F26]/10'}`}
          >
            <Map className="h-4 w-4" />
            {t('mapView')}
          </Button>
          <Button
            variant={activeTab === 'users' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('users')}
            className={`rounded-b-none font-semibold whitespace-nowrap text-xs sm:text-sm px-2.5 sm:px-4 py-2 flex items-center gap-1.5 ${activeTab === 'users' ? 'bg-[#C31F26] hover:bg-[#a0191f] text-white' : 'text-[#6B1D1D] hover:bg-[#C31F26]/10'}`}
          >
            <Users className="h-4 w-4" />
            {t('manageUsersLabel')}
          </Button>
          {STATUS_TABS.map((status) => (
            <Button
              key={status}
              variant={activeTab === status ? 'default' : 'ghost'}
              onClick={() => setActiveTab(status)}
              className={`rounded-b-none font-semibold whitespace-nowrap text-xs sm:text-sm px-2.5 sm:px-4 py-2 ${
                activeTab === status
                  ? status === 'open'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : status === 'in-progress' || status === 'assigned'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'text-[#6B1D1D] hover:bg-[#C31F26]/10'
              }`}
            >
              {t(status as any)} ({
                status === 'resolved'
                  ? complaints.filter((c) => c.status === 'resolved' || c.status === 'closed').length
                  : complaints.filter((c) => c.status === status).length
              })
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
          <div className="space-y-3">
            {citizens.length > 0 ? (
              citizens.map(citizen => (
                <Card key={citizen.id} className="border-[#C31F26]/10 shadow-sm rounded-2xl">
                  <CardContent className="p-4 sm:p-5 flex justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#C31F26] text-white flex items-center justify-center font-bold text-base shadow-sm flex-shrink-0">
                        {citizen.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-[#3D1515]">{citizen.name}</h3>
                        <p className="text-sm text-[#8B3A3A] font-mono">{citizen.mobileNumber}</p>
                        <p className="text-xs text-[#8B3A3A]/60 mt-1">
                          {t('registeredLabel')}: {new Date(citizen.registeredAt).toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-US')}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(citizen.id, citizen.name)}
                      className="font-bold rounded-xl bg-red-600 hover:bg-red-700 flex-shrink-0"
                    >
                      {t('deleteUserBtn')}
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-[#C31F26]/10 rounded-2xl">
                <CardContent className="py-12 text-center">
                  <div className="w-14 h-14 bg-[#FDF5E6] rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="h-7 w-7 text-[#C31F26]/40" />
                  </div>
                  <p className="text-[#8B3A3A] font-semibold">{t('noUsersRegistered')}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Complaints List View */}
        {activeTab !== 'map' && activeTab !== 'users' && (
          <div className="space-y-3">
            {filteredComplaints.length > 0 ? (
              filteredComplaints.map((complaint) => (
                <Card
                  key={complaint.id}
                  className="cursor-pointer hover:shadow-md transition-all border-[#C31F26]/10 rounded-2xl overflow-hidden hover:border-[#C31F26]/25 active:scale-[0.99]"
                  onClick={() => handleComplaintSelect(complaint)}
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1 space-y-2 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-base text-[#3D1515]">{complaint.title}</h3>
                          <Badge className={getStatusColor(complaint.status)}>
                            {getStatusLabel(complaint.status)}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-[#8B3A3A]/80 line-clamp-2">{complaint.description}</p>
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          <Badge variant="outline" className="border-[#C31F26]/20 text-[#6B1D1D] text-[10px]">
                            {t(complaint.category as any)}
                          </Badge>
                          <Badge variant="outline" className="border-[#C31F26]/20 font-mono text-[10px] text-[#6B1D1D]">
                            {t('priority')}: {t(complaint.priority as any).toUpperCase()}
                          </Badge>
                        </div>
                        <div className="mt-1 text-[11px] text-[#8B3A3A]/70 space-y-0.5">
                          <p><strong>{t('reportedByLabel')}:</strong> {complaint.citizenName}</p>
                          <p><strong>{t('dateLabel')}:</strong> {new Date(complaint.createdAt).toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-US')}</p>
                          {complaint.assignee && (
                            <p><strong>{t('assignedToLabel')}:</strong> {complaint.assignee}</p>
                          )}
                        </div>
                      </div>
                      {complaint.photoUrls && complaint.photoUrls.length > 0 && (
                        <img
                          src={complaint.photoUrls[0]}
                          alt="complaint"
                          className="w-full h-36 sm:w-20 sm:h-20 object-cover rounded-xl border border-[#C31F26]/15 mt-2 sm:mt-0 self-center sm:self-start flex-shrink-0"
                        />
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex justify-end mt-4 pt-4 border-t border-[#C31F26]/10 gap-2 flex-wrap">
                      <Button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (window.confirm(t('confirmDelete'))) {
                            const deletedId = complaint.id;
                            setComplaints((prev) => prev.filter((c) => c.id !== deletedId));
                            try {
                              await deleteComplaint(deletedId);
                              await loadData();
                              triggerSuccess(language === 'ta' ? 'புகார் வெற்றிகரமாக நீக்கப்பட்டது.' : 'Complaint deleted successfully.');
                            } catch (error) {
                              console.error('Failed to delete complaint:', error);
                              triggerError(language === 'ta' ? 'புகாரை நீக்குவதில் தோல்வி.' : 'Failed to delete complaint.');
                              await loadData();
                            }
                          }
                        }}
                        size="sm"
                        variant="destructive"
                        className="font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 mr-auto"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {t('delete')}
                      </Button>

                      {complaint.status === 'open' && (
                        <Button onClick={(e) => handleQuickAction(e, complaint)} size="sm" className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl">
                          {t('assignWorkerBtn')}
                        </Button>
                      )}
                      {complaint.status === 'assigned' && (
                        <Button onClick={(e) => handleQuickAction(e, complaint)} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl">
                          {t('markInProgressBtn')}
                        </Button>
                      )}
                      {complaint.status === 'in-progress' && (
                        <Button onClick={(e) => handleQuickAction(e, complaint)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl">
                          {t('markCompletedBtn')}
                        </Button>
                      )}
                      {complaint.status === 'resolved' && (
                        <Button onClick={(e) => handleQuickAction(e, complaint)} size="sm" variant="outline" disabled className="border-[#C31F26]/20 rounded-xl">
                          {t('completedBtn')}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-[#C31F26]/10 rounded-2xl">
                <CardContent className="py-12 text-center">
                  <div className="w-14 h-14 bg-[#FDF5E6] rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileText className="h-7 w-7 text-[#C31F26]/40" />
                  </div>
                  <p className="text-[#8B3A3A] font-semibold">{t('noComplaintsStatus')}</p>
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

      {/* ── City Skyline Footer ── */}
      <div className="auth-skyline-footer mt-8">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
          <path d="M0 120V80L40 75L60 40L80 75L120 70L140 30L160 70L200 65L220 20L230 15L240 20L260 65L300 70L320 50L340 70L380 65L400 35L420 65L460 60L500 55L520 25L530 10L540 25L560 55L600 60L640 50L660 35L670 20L680 35L700 50L740 55L780 45L800 30L820 45L860 50L900 55L920 40L940 55L980 50L1000 20L1010 8L1020 20L1040 50L1080 55L1120 45L1140 30L1160 45L1200 50L1220 35L1240 50L1280 55L1300 45L1320 30L1340 45L1380 50L1420 55L1440 60V120H0Z" fill="#E8C84A" fillOpacity="0.4"/>
          <path d="M0 120V90L60 85L100 80L140 55L160 80L200 75L240 40L260 75L300 80L340 60L380 80L420 75L460 50L480 35L500 50L540 75L580 70L620 55L660 45L680 30L700 45L740 60L780 65L820 50L860 65L900 60L940 45L960 30L980 45L1020 60L1060 65L1100 55L1140 40L1160 55L1200 65L1240 60L1280 50L1300 35L1320 50L1360 60L1400 65L1440 70V120H0Z" fill="#E8C84A" fillOpacity="0.7"/>
          <rect y="100" width="1440" height="20" fill="#D4A017"/>
          <rect y="95" width="1440" height="6" fill="#C31F26"/>
        </svg>
      </div>
    </div>
  );
}
