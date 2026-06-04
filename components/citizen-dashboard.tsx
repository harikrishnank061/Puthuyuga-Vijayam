'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';
import { getComplaints, getNotificationsByCitizen, markNotificationAsRead, deleteComplaint, getCitizenById } from '@/lib/db';
import { ComplaintMap } from '@/components/complaint-map';
import type { Citizen, Complaint, LocalNotification } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReportIssueModal } from './report-issue-modal';
import { ComplaintManagementModal } from './complaint-management-modal';
import {
  Menu, X, Globe, LogOut, ShieldCheck, PhoneCall, Info,
  Plus, Map, ClipboardList, Bell, User, Building2,
  FileText, Clock, CheckCircle2, AlertCircle, Home,
  MoreHorizontal, TrendingUp, ChevronDown, Trash2
} from 'lucide-react';

export function CitizenDashboard() {
  const { currentCitizen, logoutCitizen } = useAuth();
  const { t, toggleLanguage, language } = useLanguage();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notifications, setNotifications] = useState<LocalNotification[]>([]);
  const [citizen, setCitizen] = useState<Citizen | null>(null);

  useEffect(() => {
    if (currentCitizen) {
      setCitizen(currentCitizen);
    }
  }, [currentCitizen]);

  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'updates'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showHelplineModal, setShowHelplineModal] = useState(false);

  useEffect(() => {
    const isModalOpen = showReportModal || showPrivacyModal || showAboutModal || showHelplineModal;
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showReportModal, showPrivacyModal, showAboutModal, showHelplineModal]);

  useEffect(() => {
    const loadData = async () => {
      if (currentCitizen) {
        try {
          const dbCitizen = await getCitizenById(currentCitizen.id);
          if (dbCitizen) {
            setCitizen(dbCitizen);
            localStorage.setItem('fix-my-street-current-citizen', JSON.stringify(dbCitizen));
          }
          const allComplaints = await getComplaints();
          setComplaints(allComplaints);
          const citizenNotifications = await getNotificationsByCitizen(currentCitizen.id);
          setNotifications(citizenNotifications);
        } catch (error) {
          console.error('Failed to load citizen data:', error);
        }
      }
    };

    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, [currentCitizen]);

  useEffect(() => {
    const markAllRead = async () => {
      if (activeTab === 'updates' && notifications.some(n => !n.read)) {
        try {
          await Promise.all(
            notifications.filter(n => !n.read).map(n => markNotificationAsRead(n.id))
          );
          if (currentCitizen) {
            const updated = await getNotificationsByCitizen(currentCitizen.id);
            setNotifications(updated);
          }
        } catch (error) {
          console.error('Failed to mark notifications as read:', error);
        }
      }
    };
    markAllRead();
  }, [activeTab, notifications, currentCitizen]);

  const handleReportSubmit = async () => {
    setShowReportModal(false);
    if (currentCitizen) {
      try {
        const updated = await getComplaints();
        setComplaints(updated);
      } catch (error) {
        console.error('Failed to update complaints after report:', error);
      }
    }
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    logoutCitizen();
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

  const unreadCount = notifications.filter((n) => !n.read).length;
  const stats = {
    total: complaints.length,
    reported: complaints.filter((c) => c.status === 'open').length,
    inProgress: complaints.filter((c) => c.status === 'in-progress' || c.status === 'assigned').length,
    resolved: complaints.filter((c) => c.status === 'resolved' || c.status === 'closed').length,
  };

  const complaintsThisWeek = complaints.filter(c => {
    const diffTime = Math.abs(new Date().getTime() - new Date(c.createdAt).getTime());
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  }).length;

  const resolutionPercentage = stats.total > 0
    ? Math.round((stats.resolved / stats.total) * 100)
    : 0;

  // Formats or mocks the timeline updates for the Recent Activity card
  const getRecentActivities = () => {
    if (complaints.length === 0) {
      return [];
    }

    return complaints.slice(0, 3).map((c) => {
      let timeLabel = '';
      const diffTime = Math.abs(new Date().getTime() - new Date(c.createdAt).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 1) {
        timeLabel = language === 'ta' ? 'இன்று' : 'Today';
      } else if (diffDays === 2) {
        timeLabel = language === 'ta' ? 'நேற்று' : 'Yesterday';
      } else {
        timeLabel = language === 'ta' ? `${diffDays - 1} நாட்களுக்கு முன்` : `${diffDays - 1} Days Ago`;
      }

      return {
        id: c.id,
        title: c.title,
        location: `${language === 'ta' ? 'ராஜபாளையம்' : 'Rajapalayam'} (${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)})`,
        time: timeLabel,
        status: c.status,
      };
    });
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full w-full bg-white text-card-foreground text-left">
      {/* Drawer Header with Logo */}
      <div className="relative p-6 border-b border-[#C31F26]/10 flex flex-col items-center justify-center text-center">
        {/* Close button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 left-4 p-1.5 text-gray-500 hover:text-gray-900 border border-gray-100 rounded-lg"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        <img
          src="/Puthuyuga Vijayam Logo.png"
          alt="App Logo"
          className="w-18 h-18 object-contain"
        />
      </div>

      {/* Citizen Details */}
      <div className="p-5 border-b border-[#C31F26]/5 bg-[#FAF4EB]/30 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-[#C31F26] text-white flex items-center justify-center font-bold text-base shadow-sm">
          {citizen?.name?.charAt(0).toUpperCase() || ''}
        </div>
        <div className="text-left">
          <h4 className="font-bold text-sm text-[#3D1515] leading-tight">
            {citizen?.name || ''}
          </h4>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            {citizen?.mobileNumber || ''}
          </p>
        </div>
      </div>

      {/* Navigation menu items */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        <button
          onClick={() => {
            setActiveTab('dashboard');
            setSidebarOpen(false);
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-bold transition-all ${activeTab === 'dashboard'
            ? 'bg-[#C31F26]/10 text-[#C31F26]'
            : 'text-gray-600 hover:bg-[#FAF4EB]/40 hover:text-[#C31F26]'
            }`}
        >
          <Home className="h-5 w-5" />
          <span>{t('dashboard')}</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('dashboard');
            setSidebarOpen(false);
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-bold transition-all ${activeTab === 'dashboard'
            ? 'bg-[#C31F26]/10 text-[#C31F26]'
            : 'text-gray-600 hover:bg-[#FAF4EB]/40 hover:text-[#C31F26]'
            }`}
        >
          <Map className="h-5 w-5" />
          <span>{t('mapView')}</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('reports');
            setSidebarOpen(false);
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-bold transition-all ${activeTab === 'reports'
            ? 'bg-[#C31F26]/10 text-[#C31F26]'
            : 'text-gray-600 hover:bg-[#FAF4EB]/40 hover:text-[#C31F26]'
            }`}
        >
          <ClipboardList className="h-5 w-5" />
          <span>{t('myReportsCount')}</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('updates');
            setSidebarOpen(false);
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-bold transition-all relative ${activeTab === 'updates'
            ? 'bg-[#C31F26]/10 text-[#C31F26]'
            : 'text-gray-600 hover:bg-[#FAF4EB]/40 hover:text-[#C31F26]'
            }`}
        >
          <Bell className="h-5 w-5" />
          <span>{t('updatesTab')}</span>
          {unreadCount > 0 && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#C31F26] text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-sm">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Footer controls & utilities */}
      <div className="p-4 border-t border-[#C31F26]/10 bg-white space-y-2">
        <div className="flex items-center justify-between px-2 py-1.5 text-xs font-bold text-gray-500">
          <span>{t('language')}</span>
          <button
            onClick={toggleLanguage}
            className="text-xs text-[#C31F26] bg-[#FAF4EB] hover:bg-[#FAF4EB]/85 px-3 py-1 rounded-full border border-[#C31F26]/20 font-bold transition-all"
          >
            {language === 'en' ? 'English' : 'தமிழ்'}
          </button>
        </div>

        <button
          onClick={() => { setShowHelplineModal(true); setSidebarOpen(false); }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-gray-600 hover:text-[#C31F26] rounded-lg hover:bg-gray-50 text-left transition-colors"
        >
          <PhoneCall className="h-4 w-4 text-[#C31F26]" />
          <span>{t('officialHelpline')}</span>
        </button>

        <button
          onClick={() => { setShowPrivacyModal(true); setSidebarOpen(false); }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-gray-600 hover:text-[#C31F26] rounded-lg hover:bg-gray-50 text-left transition-colors"
        >
          <ShieldCheck className="h-4 w-4 text-[#C31F26]" />
          <span>{t('privacyPolicy')}</span>
        </button>

        <button
          onClick={() => { setShowAboutModal(true); setSidebarOpen(false); }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-gray-600 hover:text-[#C31F26] rounded-lg hover:bg-gray-50 text-left transition-colors"
        >
          <Info className="h-4 w-4 text-[#C31F26]" />
          <span>{t('aboutApp')}</span>
        </button>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100 gap-2">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="flex items-center gap-2 px-3 py-2 h-9 text-xs font-bold text-[#C31F26] bg-[#C31F26]/5 hover:bg-[#C31F26]/10 rounded-xl transition-all"
          >
            <LogOut className="h-4 w-4 rotate-180" />
            {t('logout')}
          </Button>

          <div className="h-8 w-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-xs shadow-sm select-none flex-shrink-0">
            {citizen?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full flex bg-[#FDFBF7] text-card-foreground font-sans">
      {/* Drawer Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[1020]"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Drawer Container */}
      <div
        className={`fixed inset-y-0 left-0 w-[320px] max-w-[85vw] bg-white z-[1030] shadow-2xl transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <SidebarContent />
      </div>

      {/* ── Main View Content ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#FBF8F3]">
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-5 border-b border-[#C31F26]/10 bg-white sticky top-0 z-[1010]">
          <div className="flex items-center gap-4 text-left">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="text-[#C31F26] hover:bg-[#C31F26]/10 h-10 w-10 flex-shrink-0"
            >
              <Menu className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-2xl font-black text-[#6B1D1D] tracking-tight">
                {t('appTitle')}
              </h1>
              <p className="text-xs sm:text-sm text-[#8B3A3A] font-semibold mt-0.5">
                {t('publicGrievancePortal')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#FAF4EB] border border-[#C31F26]/15 rounded-full px-4.5 py-1.5">
              <div className="h-6 w-6 rounded-full bg-[#C31F26] text-white flex items-center justify-center text-xs font-black">
                {citizen?.name?.charAt(0).toUpperCase() || ''}
              </div>
              <span className="text-sm text-[#6B1D1D] font-bold">
                {citizen?.name || ''}
              </span>
            </div>

            <Button
              onClick={() => setShowReportModal(true)}
              className="bg-[#C31F26] hover:bg-[#a0191f] text-white font-bold text-sm px-5 h-11 rounded-xl flex items-center gap-2 shadow-sm"
            >
              <Plus className="h-4.5 w-4.5" />
              {t('reportNewIssue')}
            </Button>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 bg-white border-b border-[#C31F26]/10 z-[1010] px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="text-[#C31F26] hover:bg-[#C31F26]/10 h-9 w-9 flex-shrink-0"
            >
              <Menu className="h-5.5 w-5.5" />
            </Button>
            <div className="flex items-center gap-2 text-left">
              <img
                src="/Puthuyuga Vijayam Logo.png"
                alt="App Logo"
                className="w-10 h-10 object-contain flex-shrink-0"
              />
              <div>
                <h1 className="text-sm font-black text-[#C31F26] leading-none" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                  {t('appTitle')}
                </h1>
                <p className="text-[10px] text-gray-500 font-bold mt-1 leading-none">
                  {t('publicGrievancePortal')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1 bg-[#FAF4EB] border border-[#C31F26]/10 rounded-full px-2.5 py-1 text-xs font-bold text-[#6B1D1D]">
              <div className="h-5 w-5 rounded-full bg-[#C31F26] text-white flex items-center justify-center text-[10px] font-black">
                {citizen?.name?.charAt(0).toUpperCase() || ''}
              </div>
              <span>{citizen?.name?.split(' ')[0] || ''}</span>
            </div>
          </div>
        </header>

        {/* ── Main Content Body ── */}
        <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8 overflow-y-auto">

          {/* Desktop Navigation Tabs */}
          <div className="hidden lg:flex gap-6 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'dashboard'
                ? 'text-[#C31F26] border-b-2 border-[#C31F26]'
                : 'text-gray-500 hover:text-[#C31F26]'
                }`}
            >
              <div className="flex items-center gap-1.5">
                <Map className="h-4 w-4" />
                {t('mapView')}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'reports'
                ? 'text-[#C31F26] border-b-2 border-[#C31F26]'
                : 'text-gray-500 hover:text-[#C31F26]'
                }`}
            >
              <div className="flex items-center gap-1.5">
                <ClipboardList className="h-4 w-4" />
                {t('myReportsCount')} ({complaints.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('updates')}
              className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'updates'
                ? 'text-[#C31F26] border-b-2 border-[#C31F26]'
                : 'text-gray-500 hover:text-[#C31F26]'
                }`}
            >
              <div className="flex items-center gap-1.5">
                <Bell className="h-4 w-4" />
                {t('updatesTab')}
                {unreadCount > 0 && (
                  <span className="ml-1 bg-[#C31F26] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
            </button>
          </div>

          {/* Render Active View */}
          {activeTab === 'dashboard' && (
            <>
              {/* DESKTOP VIEW SECTION */}
              <div className="hidden lg:block space-y-6">
                {/* Map Legend Banner Box */}
                <div
                  className="rounded-2xl border border-[#C31F26]/10 p-8 text-left bg-[#FAF4EB]/60 flex justify-between items-center relative overflow-hidden"
                  style={{
                    backgroundImage: `url('/ChatGPT Image Jun 3, 2026, 05_13_05 PM-Photoroom.png')`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 20px center',
                    backgroundSize: 'contain',
                    minHeight: '180px',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FAF4EB] via-[#FAF4EB]/95 to-transparent z-0" />

                  <div className="z-10 max-w-2xl relative">
                    <h2 className="text-2xl font-black text-[#6B1D1D] mb-1.5">{t('yourReportsOnMap')}</h2>
                    <p className="text-sm text-gray-500 font-semibold mb-5">
                      {t('mapBannerDesc')}
                    </p>

                    <div className="flex gap-4 items-center flex-wrap text-xs font-bold">
                      <span className="flex items-center gap-1.5 text-[#C31F26]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#C31F26]" />
                        {t('legendRed')}
                      </span>
                      <span className="flex items-center gap-1.5 text-amber-500">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        {t('legendYellow')}
                      </span>
                      <span className="flex items-center gap-1.5 text-emerald-600">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        {t('legendGreen')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Map Display Panel */}
                <Card className="border-[#C31F26]/10 shadow-sm rounded-2xl overflow-hidden bg-white">
                  <CardContent className="p-4">
                    <div className="h-[420px] rounded-xl overflow-hidden border border-[#C31F26]/15">
                      <ComplaintMap
                        complaints={complaints}
                        onMarkerClick={(complaint) => {
                          setSelectedComplaint(complaint);
                          setShowDetailModal(true);
                        }}
                        selectedComplaintId={selectedComplaint?.id}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Report Summary (Desktop layout bottom) */}
                <div className="pt-2">
                  <h2 className="text-base font-extrabold text-[#6B1D1D] mb-4 text-left">{t('yourReportSummary')}</h2>
                  <div className="grid grid-cols-4 gap-4">
                    {/* Stats Card 1: Total */}
                    <div className="bg-[#FAF4EB]/30 border border-[#C31F26]/10 rounded-2xl p-5 shadow-sm text-left flex justify-between relative overflow-hidden">
                      <div>
                        <div className="w-10 h-10 bg-[#C31F26]/10 rounded-xl flex items-center justify-center mb-3">
                          <FileText className="h-5 w-5 text-[#C31F26]" />
                        </div>
                        <p className="text-xs font-bold text-gray-500">{t('totalReports')}</p>
                        <div className="text-3xl font-black text-gray-900 mt-1">{stats.total}</div>
                        <p className="text-[10px] text-gray-400 font-bold mt-1">{t('allTime')}</p>
                      </div>
                      <FileText className="h-20 w-20 text-[#C31F26]/5 absolute right-2 bottom-2" />
                    </div>

                    {/* Stats Card 2: Reported */}
                    <div className="bg-red-50/40 border border-red-100 rounded-2xl p-5 shadow-sm text-left flex justify-between relative overflow-hidden">
                      <div>
                        <div className="w-10 h-10 bg-red-100/60 rounded-xl flex items-center justify-center mb-3">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <p className="text-xs font-bold text-gray-500">{t('open')}</p>
                        <div className="text-3xl font-black text-red-600 mt-1">{stats.reported}</div>
                        <p className="text-[10px] text-red-500 font-bold mt-1">{t('needsAttention')}</p>
                      </div>
                      <AlertCircle className="h-20 w-20 text-red-600/5 absolute right-2 bottom-2" />
                    </div>

                    {/* Stats Card 3: In Progress */}
                    <div className="bg-amber-50/40 border border-amber-100 rounded-2xl p-5 shadow-sm text-left flex justify-between relative overflow-hidden">
                      <div>
                        <div className="w-10 h-10 bg-amber-100/60 rounded-xl flex items-center justify-center mb-3">
                          <Clock className="h-5 w-5 text-amber-600" />
                        </div>
                        <p className="text-xs font-bold text-gray-500">{t('inProgress')}</p>
                        <div className="text-3xl font-black text-amber-600 mt-1">{stats.inProgress}</div>
                        <p className="text-[10px] text-amber-500 font-bold mt-1">{t('underReview')}</p>
                      </div>
                      <Clock className="h-20 w-20 text-amber-600/5 absolute right-2 bottom-2" />
                    </div>

                    {/* Stats Card 4: Resolved */}
                    <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-5 shadow-sm text-left flex justify-between relative overflow-hidden">
                      <div>
                        <div className="w-10 h-10 bg-emerald-100/60 rounded-xl flex items-center justify-center mb-3">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        </div>
                        <p className="text-xs font-bold text-gray-500">{t('resolved')}</p>
                        <div className="text-3xl font-black text-emerald-600 mt-1">{stats.resolved}</div>
                        <p className="text-[10px] text-[#8B3A3A] font-bold mt-1">{t('completed')}</p>
                      </div>
                      <CheckCircle2 className="h-20 w-20 text-emerald-600/5 absolute right-2 bottom-2" />
                    </div>
                  </div>
                </div>
              </div>

              {/* MOBILE VIEW SECTION */}
              <div className="lg:hidden space-y-5">
                {/* Welcome Card Banner */}
                <div
                  className="rounded-2xl border border-[#C31F26]/10 p-5 text-left bg-[#FAF4EB]/60 flex justify-between items-center relative overflow-hidden"
                  style={{
                    backgroundImage: `url('/ChatGPT Image Jun 3, 2026, 05_13_05 PM-Photoroom.png')`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right -10px center',
                    backgroundSize: '45% auto',
                    minHeight: '140px',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FAF4EB] via-[#FAF4EB]/90 to-transparent z-0" />

                  <div className="z-10 max-w-[65%] relative">
                    <h2 className="text-lg font-black text-[#6B1D1D] mb-1">
                      {language === 'ta' ? `வரவேற்கிறோம், ${citizen?.name?.split(' ')[0] || ''}!` : `Welcome, ${citizen?.name?.split(' ')[0] || ''}!`}
                    </h2>
                    <p className="text-[11px] text-gray-500 font-semibold mb-4 leading-tight">
                      {t('welcomeSubtext')}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2 w-full max-w-sm sm:max-w-none">
                      <Button
                        onClick={() => setShowReportModal(true)}
                        className="bg-[#C31F26] hover:bg-[#a0191f] text-white font-bold text-[10px] px-3.5 h-8.5 rounded-xl flex items-center gap-1 shadow-sm w-full sm:w-auto justify-center"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        {t('reportNewIssue')}
                      </Button>
                      <Button
                        onClick={() => setActiveTab('reports')}
                        variant="outline"
                        className="bg-white border-[#C31F26]/20 text-[#C31F26] hover:bg-gray-50 font-bold text-[10px] px-3.5 h-8.5 rounded-xl flex items-center gap-1 shadow-sm w-full sm:w-auto justify-center"
                      >
                        <ClipboardList className="h-3.5 w-3.5" />
                        {t('trackReports')}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Map Display Panel on Mobile */}
                <Card className="border-[#C31F26]/10 shadow-sm rounded-2xl overflow-hidden bg-white">
                  <CardContent className="p-3">
                    <div className="h-[280px] rounded-xl overflow-hidden border border-[#C31F26]/15">
                      <ComplaintMap
                        complaints={complaints}
                        onMarkerClick={(complaint) => {
                          setSelectedComplaint(complaint);
                          setShowDetailModal(true);
                        }}
                        selectedComplaintId={selectedComplaint?.id}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* 4 Stats Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Total Reports */}
                  <div className="bg-white border border-[#C31F26]/10 rounded-2xl p-3 shadow-sm text-center">
                    <div className="w-8 h-8 bg-[#C31F26]/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <FileText className="h-4 w-4 text-[#C31F26]" />
                    </div>
                    <span className="text-[9px] font-bold text-gray-500 block leading-tight">{t('totalReports')}</span>
                    <span className="text-lg font-black text-gray-900 block mt-0.5">{stats.total}</span>
                    <span className="text-[8px] text-emerald-600 font-bold flex items-center justify-center gap-0.5 mt-0.5 leading-none">
                      <TrendingUp className="h-2.5 w-2.5 text-emerald-600" />
                      {complaintsThisWeek} {language === 'ta' ? 'இந்த வாரம்' : 'this week'}
                    </span>
                  </div>

                  {/* Reported */}
                  <div className="bg-white border border-red-100 rounded-2xl p-3 shadow-sm text-center">
                    <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    </div>
                    <span className="text-[9px] font-bold text-gray-500 block leading-tight">{t('open')}</span>
                    <span className="text-lg font-black text-red-600 block mt-0.5">{stats.reported}</span>
                    <span className="text-[8px] text-red-400 font-semibold block mt-0.5 leading-none">{t('needsAttention')}</span>
                  </div>

                  {/* In Progress */}
                  <div className="bg-white border border-amber-100 rounded-2xl p-3 shadow-sm text-center">
                    <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Clock className="h-4 w-4 text-amber-600" />
                    </div>
                    <span className="text-[9px] font-bold text-gray-500 block leading-tight">{t('inProgress')}</span>
                    <span className="text-lg font-black text-amber-600 block mt-0.5">{stats.inProgress}</span>
                    <span className="text-[8px] text-amber-500 font-semibold block mt-0.5 leading-none">{t('underReview')}</span>
                  </div>

                  {/* Resolved */}
                  <div className="bg-white border border-emerald-100 rounded-2xl p-3 shadow-sm text-center">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="text-[9px] font-bold text-gray-500 block leading-tight">{t('resolved')}</span>
                    <span className="text-lg font-black text-emerald-600 block mt-0.5">{stats.resolved}</span>
                    <span className="text-[8px] text-emerald-500 font-semibold block mt-0.5 leading-none">{t('completed')}</span>
                  </div>
                </div>

                {/* Complaint Resolution Rate Gauge */}
                <Card className="border-[#C31F26]/10 shadow-sm rounded-2xl bg-white overflow-hidden text-left">
                  <CardHeader className="px-4 py-3.5 border-b border-gray-100 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-xs font-black text-[#6B1D1D]">{t('complaintResolutionRate')}</CardTitle>
                    <select
                      className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 outline-none"
                      defaultValue="month"
                    >
                      <option value="month">{t('thisMonth')}</option>
                      <option value="week">{t('thisWeek')}</option>
                      <option value="year">{t('thisYear')}</option>
                    </select>
                  </CardHeader>
                  <CardContent className="p-4 flex items-center gap-5">
                    {/* SVG Circular Progress Gauge */}
                    <div className="relative h-20 w-20 flex-shrink-0 flex items-center justify-center">
                      <svg className="h-20 w-20 transform -rotate-90">
                        <circle
                          cx="40"
                          cy="40"
                          r="32"
                          className="stroke-gray-100 fill-none"
                          strokeWidth="8"
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r="32"
                          className="stroke-[#C31F26] fill-none"
                          strokeWidth="8"
                          strokeDasharray={2 * Math.PI * 32}
                          strokeDashoffset={2 * Math.PI * 32 * (1 - resolutionPercentage / 100)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute text-sm font-black text-[#3D1515]">
                        {resolutionPercentage}%
                      </div>
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <h4 className="text-xs font-black text-[#C31F26] flex items-center gap-1">
                        {resolutionPercentage > 50
                          ? (language === 'ta' ? 'சிறந்த முன்னேற்றம்! 🎉' : 'Great Progress! 🎉')
                          : (language === 'ta' ? 'புகார் நிலை' : 'Complaint Status')
                        }
                      </h4>
                      <p className="text-[10px] text-gray-500 font-bold leading-snug">
                        {language === 'ta'
                          ? `இந்த மாதத்தில் ${resolutionPercentage}% புகார்கள் தீர்க்கப்பட்டுள்ளன.`
                          : `You have resolved ${resolutionPercentage}% of complaints this month.`
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity List */}
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black text-[#6B1D1D] uppercase tracking-wider">{t('recentActivity')}</h3>
                    <button
                      onClick={() => setActiveTab('reports')}
                      className="text-[10px] font-black text-[#C31F26] hover:underline"
                    >
                      {t('viewAll')}
                    </button>
                  </div>

                  <div className="bg-white border border-[#C31F26]/10 rounded-2xl p-4.5 shadow-sm divide-y divide-gray-100 text-left">
                    {getRecentActivities().length > 0 ? (
                      getRecentActivities().map((act, index) => {
                        const getActIcon = (status: string) => {
                          if (status === 'resolved' || status === 'closed') {
                            return <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />;
                          } else if (status === 'open') {
                            return <AlertCircle className="h-4.5 w-4.5 text-red-600" />;
                          }
                          return <Clock className="h-4.5 w-4.5 text-amber-600" />;
                        };

                        return (
                          <div key={act.id} className="flex gap-4 items-start py-3 first:pt-0 last:pb-0">
                            <div className="flex flex-col items-center pt-0.5 flex-shrink-0">
                              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                                {getActIcon(act.status)}
                              </div>
                              {index < getRecentActivities().length - 1 && (
                                <div className="w-0.5 h-10 bg-gray-100 -mb-5 mt-1.5" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2">
                                <h4 className="text-[11px] font-black text-gray-900 truncate leading-snug">
                                  {act.title}
                                </h4>
                                <span className="text-[9px] text-gray-400 font-bold whitespace-nowrap">
                                  {act.time}
                                </span>
                              </div>
                              <p className="text-[9px] text-gray-500 font-semibold truncate mt-0.5">
                                {act.location}
                              </p>
                              <span className={`inline-block text-[8px] font-extrabold rounded-full px-2 py-0.5 mt-1.5 ${act.status === 'resolved' || act.status === 'closed'
                                ? 'bg-emerald-50 text-emerald-700'
                                : act.status === 'open'
                                  ? 'bg-red-50 text-red-700'
                                  : 'bg-amber-50 text-amber-700'
                                }`}>
                                {t(act.status as any)}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-xs text-gray-400 font-medium">{language === 'ta' ? 'சமீபத்திய செயல்பாடுகள் இல்லை' : 'No recent activity'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-4">
              <h2 className="text-base font-extrabold text-[#6B1D1D] mb-4 text-left hidden lg:block">
                {language === 'ta' ? `அனைத்து புகார்கள் (${complaints.length})` : `All Community Reports (${complaints.length})`}
              </h2>
              {complaints.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {complaints.map((complaint) => (
                    <Card
                      key={complaint.id}
                      className="hover:shadow-md transition-all border-[#C31F26]/10 rounded-2xl overflow-hidden hover:border-[#C31F26]/30 text-left bg-white"
                    >
                      <CardContent className="p-4.5">
                        <div className="flex justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <h3 className="font-extrabold text-sm sm:text-base text-[#3D1515]">{complaint.title}</h3>
                            <p className="text-[11px] sm:text-xs text-[#8B3A3A]/80 line-clamp-2">{complaint.description}</p>
                            <div className="flex gap-1.5 mt-2 flex-wrap">
                              <Badge className={getStatusColor(complaint.status)}>
                                {getStatusLabel(complaint.status)}
                              </Badge>
                              <Badge variant="outline" className="border-[#C31F26]/15 text-[#6B1D1D] text-[9px] font-bold">
                                {t(complaint.category as any)}
                              </Badge>
                            </div>
                            <p className="text-[9px] text-[#8B3A3A]/60 pt-0.5">
                              {language === 'ta' ? 'பதிவு செய்யப்பட்டது' : 'Reported'}:{' '}
                              {new Date(complaint.createdAt).toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-US')}
                            </p>
                          </div>
                          {complaint.photoUrls && complaint.photoUrls.length > 0 && (
                            <img
                              src={complaint.photoUrls[0]}
                              alt="complaint"
                              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-[#C31F26]/15 flex-shrink-0 align-self-start"
                            />
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-[#C31F26]/10">
                          {/* View Details Button - always visible */}
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedComplaint(complaint);
                              setShowDetailModal(true);
                            }}
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs font-bold text-[#C31F26] hover:bg-[#C31F26]/10 rounded-xl flex items-center gap-1.5 px-3"
                          >
                            <Info className="h-3.5 w-3.5" />
                            {language === 'ta' ? 'விவரங்கள் காண்க' : 'View Details'}
                          </Button>

                          {/* Delete - only for owner */}
                          {complaint.citizenId === currentCitizen?.id && (
                            <Button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (window.confirm(t('confirmDelete'))) {
                                  const deletedId = complaint.id;
                                  setComplaints((prev) => prev.filter((c) => c.id !== deletedId));
                                  try {
                                    await deleteComplaint(deletedId);
                                    const updated = await getComplaints();
                                    setComplaints(updated);
                                  } catch (error) {
                                    console.error('Failed to delete report:', error);
                                    const updated = await getComplaints();
                                    setComplaints(updated);
                                  }
                                }
                              }}
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl flex items-center gap-1.5 px-3"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {t('delete')}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-[#C31F26]/10 rounded-2xl bg-white">
                  <CardContent className="pt-16 pb-16 text-center">
                    <div className="w-16 h-16 bg-[#FAF4EB] rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-[#C31F26]/60" />
                    </div>
                    <p className="text-[#8B3A3A] font-extrabold mb-5">
                      {language === 'ta'
                        ? 'இதுவரை புகார்கள் ஏதுமில்லை. உங்கள் பகுதியை மேம்படுத்த புகாரளிக்கவும்!'
                        : 'No reports yet. Help us improve your locality!'}
                    </p>
                    <Button
                      onClick={() => setShowReportModal(true)}
                      className="bg-[#C31F26] hover:bg-[#a0191f] text-white font-bold rounded-xl"
                    >
                      <Plus className="h-4 w-4 mr-1.5" />
                      {t('reportNewIssue')}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'updates' && (
            <div className="space-y-4">
              <h2 className="text-base font-extrabold text-[#6B1D1D] mb-4 text-left hidden lg:block">{t('updatesTab')}</h2>
              <Card className="border-[#C31F26]/15 shadow-sm rounded-2xl overflow-hidden bg-white">
                <CardContent className="p-4">
                  {notifications.length > 0 ? (
                    <div className="space-y-3 text-left">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-4 border rounded-xl transition-colors ${notif.read
                            ? 'bg-white border-[#C31F26]/10'
                            : 'bg-[#FAF4EB]/30 border-[#C31F26]/20'
                            }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-bold text-sm text-[#3D1515]">{notif.message}</p>
                              <p className="text-[10px] text-gray-400 font-bold mt-1">
                                {new Date(notif.createdAt).toLocaleString(language === 'ta' ? 'ta-IN' : 'en-US')}
                              </p>
                            </div>
                            {!notif.read && (
                              <span className="w-2 h-2 bg-[#C31F26] rounded-full flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-14 h-14 bg-[#FAF4EB] rounded-full flex items-center justify-center mx-auto mb-3">
                        <Bell className="h-7 w-7 text-[#C31F26]/40" />
                      </div>
                      <p className="text-[#8B3A3A] font-bold">
                        {language === 'ta' ? 'அறிவிப்புகள் ஏதுமில்லை' : 'No notifications yet'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </main>

        {/* Mobile Sticky Bottom Navigation Menu */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#C31F26]/10 px-4 py-2 flex justify-around items-center z-[999] shadow-lg">
          {/* Dashboard/Home */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'text-[#C31F26] font-bold' : 'text-gray-400'}`}
          >
            <Home className="h-5 w-5" />
            <span className="text-[9px]">{language === 'ta' ? 'கட்டுப்பாட்டு' : 'Dashboard'}</span>
          </button>

          {/* My Reports */}
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${activeTab === 'reports' ? 'text-[#C31F26] font-bold' : 'text-gray-400'}`}
          >
            <ClipboardList className="h-5 w-5" />
            <span className="text-[9px]">{language === 'ta' ? 'எனது புகார்கள்' : 'My Reports'}</span>
          </button>

          {/* Floating Report Button */}
          <button
            onClick={() => setShowReportModal(true)}
            className="flex flex-col items-center justify-center -mt-6 bg-[#C31F26] text-white h-13 w-13 rounded-full shadow-lg border-4 border-white hover:bg-[#a0191f] transition-all relative z-[1000]"
          >
            <Plus className="h-6 w-6" />
          </button>

          {/* Updates Notifications */}
          <button
            onClick={() => setActiveTab('updates')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${activeTab === 'updates' ? 'text-[#C31F26] font-bold' : 'text-gray-400'}`}
          >
            <div className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#C31F26] text-white text-[8px] font-bold h-3.5 w-3.5 rounded-full flex items-center justify-center border border-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <span className="text-[9px]">{language === 'ta' ? 'அறிவிப்புகள்' : 'Updates'}</span>
          </button>

          {/* More Sidebar trigger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-gray-400 hover:text-[#C31F26] transition-all"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[9px]">{language === 'ta' ? 'மேலும்' : 'More'}</span>
          </button>
        </nav>

        {/* ── Report Issue Modal ── */}
        {showReportModal && (
          <div className="fixed inset-0 bg-black/60 flex items-start justify-center p-2 sm:p-4 z-[9999] overflow-y-auto animate-fade-in" style={{ zIndex: 9999 }}>
            <div className="w-full max-w-5xl my-4 sm:my-8 scrollbar-thin">
              <ReportIssueModal
                onClose={() => setShowReportModal(false)}
                onSubmit={handleReportSubmit}
              />
            </div>
          </div>
        )}

        {/* ── Complaint Detail Modal (Read-Only) ── */}
        {showDetailModal && selectedComplaint && (
          <ComplaintManagementModal
            complaint={selectedComplaint}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedComplaint(null);
            }}
            isReadOnly={true}
          />
        )}

        {/* ── Privacy Policy Modal ── */}
        {showPrivacyModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[9999] animate-fade-in" style={{ zIndex: 9999 }}>
            <Card className="w-full max-w-2xl shadow-2xl border-[#C31F26]/20 rounded-2xl overflow-hidden bg-white text-left">
              <CardHeader className="bg-gradient-to-r from-[#FDF5E6] to-[#FAE9C8] rounded-t-2xl px-5 py-4 border-b border-[#C31F26]/10">
                <CardTitle className="text-base flex items-center gap-2 text-[#6B1D1D] font-bold">
                  <ShieldCheck className="h-5 w-5 text-[#C31F26]" />
                  {t('privacyPolicy')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="text-sm text-[#3D1515]/80 leading-relaxed text-justify max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin space-y-4">
                  <p className="font-semibold">Effective Date: June 4, 2026</p>

                  <div>
                    <h4 className="font-bold text-base text-[#6B1D1D] mb-1">1. Introduction</h4>
                    <p>
                      Puthuyuga Vijayam ("we", "our", or "the App") is a civic issue reporting and resolution platform designed to help citizens report public infrastructure and service-related issues to relevant government departments.
                    </p>
                    <p className="mt-2">
                      This Privacy Policy explains how we collect, use, store, and protect information when you use our mobile application and related services.
                    </p>
                    <p className="mt-2">
                      By using Puthuyuga Vijayam, you agree to the collection and use of information in accordance with this Privacy Policy.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-base text-[#6B1D1D] mb-1">2. Information We Collect</h4>

                    <h5 className="font-bold text-sm text-[#6B1D1D] mt-2 mb-1">a) Location Information</h5>
                    <p>
                      When reporting an issue, the App may collect your device's location (GPS coordinates) to accurately identify the issue location. Location data is collected only when you submit a complaint or use location-based features.
                    </p>

                    <h5 className="font-bold text-sm text-[#6B1D1D] mt-3 mb-1">b) Photos and Media</h5>
                    <p>
                      The App allows users to upload photographs of public issues such as damaged roads, water leaks, sanitation concerns, and other civic problems. These images are stored on our servers and shared with relevant authorities for resolution purposes.
                    </p>

                    <h5 className="font-bold text-sm text-[#6B1D1D] mt-3 mb-1">c) User Information</h5>
                    <p>Depending on the features enabled, we may collect:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-1">
                      <li>Name</li>
                      <li>Mobile Number</li>
                      <li>Email Address</li>
                      <li>User ID</li>
                      <li>Complaint History</li>
                    </ul>
                    <p className="mt-2">Providing this information may be optional or required depending on service requirements.</p>

                    <h5 className="font-bold text-sm text-[#6B1D1D] mt-3 mb-1">d) Device Information</h5>
                    <p>We may automatically collect:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-1">
                      <li>Device model</li>
                      <li>Operating system version</li>
                      <li>Application version</li>
                      <li>Device identifiers</li>
                      <li>Crash reports and diagnostics</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-base text-[#6B1D1D] mb-1">3. How We Use Your Information</h4>
                    <p>We use collected information to:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-1">
                      <li>Register and manage complaints</li>
                      <li>Route complaints to the appropriate department</li>
                      <li>Display issue locations on maps</li>
                      <li>Track complaint status</li>
                      <li>Send notifications and updates</li>
                      <li>Improve application performance</li>
                      <li>Generate governance reports and analytics</li>
                      <li>Prevent misuse and fraudulent activities</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-base text-[#6B1D1D] mb-1">4. Sharing of Information</h4>
                    <p>We may share information with:</p>

                    <h5 className="font-bold text-sm text-[#6B1D1D] mt-2 mb-1">Government Departments</h5>
                    <p>
                      Complaint details, uploaded photos, descriptions, and locations may be shared with authorized government departments responsible for resolving the reported issue.
                    </p>

                    <h5 className="font-bold text-sm text-[#6B1D1D] mt-3 mb-1">Service Providers</h5>
                    <p>We may use third-party services for:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-1">
                      <li>Cloud hosting</li>
                      <li>Analytics</li>
                      <li>Notification delivery</li>
                      <li>Application monitoring</li>
                    </ul>
                    <p className="mt-2">These providers are required to protect your information.</p>

                    <h5 className="font-bold text-sm text-[#6B1D1D] mt-3 mb-1">Legal Requirements</h5>
                    <p>
                      Information may be disclosed if required by law, court order, government request, or to protect public safety.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-base text-[#6B1D1D] mb-1">5. Publicly Visible Information</h4>
                    <p>
                      Issue reports may be displayed publicly within the application to improve transparency and accountability.
                    </p>
                    <p className="mt-2">Publicly visible information may include:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-1">
                      <li>Issue description</li>
                      <li>Uploaded photos</li>
                      <li>Issue location</li>
                      <li>Complaint status</li>
                    </ul>
                    <p className="mt-2">Personal contact information will not be publicly displayed without your consent.</p>
                  </div>

                  <div>
                    <h4 className="font-bold text-base text-[#6B1D1D] mb-1">6. Data Retention</h4>
                    <p>We retain complaint and account information only for as long as necessary to:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-1">
                      <li>Provide services</li>
                      <li>Maintain records</li>
                      <li>Comply with legal obligations</li>
                      <li>Support governance reporting</li>
                    </ul>
                    <p className="mt-2">After the retention period, data may be securely deleted or anonymized.</p>
                  </div>

                  <div>
                    <h4 className="font-bold text-base text-[#6B1D1D] mb-1">7. Data Security</h4>
                    <p>
                      We implement reasonable administrative, technical, and physical safeguards to protect your information from:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 mt-1">
                      <li>Unauthorized access</li>
                      <li>Alteration</li>
                      <li>Disclosure</li>
                      <li>Destruction</li>
                    </ul>
                    <p className="mt-2">However, no internet-based system can guarantee complete security.</p>
                  </div>

                  <div>
                    <h4 className="font-bold text-base text-[#6B1D1D] mb-1">8. Children's Privacy</h4>
                    <p>
                      Puthuyuga Vijayam is not specifically directed toward children under 13 years of age. We do not knowingly collect personal information from children under 13. If such information is discovered, it will be removed promptly.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-base text-[#6B1D1D] mb-1">9. User Rights</h4>
                    <p>Users may have the right to:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-1">
                      <li>Access their information</li>
                      <li>Correct inaccurate information</li>
                      <li>Request deletion of their data</li>
                      <li>Withdraw consent where applicable</li>
                    </ul>
                    <p className="mt-2">Requests can be submitted using the contact details below.</p>
                  </div>

                  <div>
                    <h4 className="font-bold text-base text-[#6B1D1D] mb-1">10. Changes to This Privacy Policy</h4>
                    <p>
                      We may update this Privacy Policy from time to time. Changes will be posted within the application and on our website. Continued use of the App after updates constitutes acceptance of the revised policy.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-base text-[#6B1D1D] mb-1">11. Contact Us</h4>
                    <p>For any questions regarding this Privacy Policy, contact:</p>
                    <p className="mt-1 font-semibold text-[#6B1D1D]">Puthuyuga Vijayam Support Team</p>
                    <p>Email: support@puthuyugavijayam.in</p>
                    <p>Website: <a href="https://puthuyugavijayam.in/" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#C31F26]">https://puthuyugavijayam.in/</a></p>
                    <p>Tamil Nadu, India</p>
                  </div>

                  <div>
                    <h4 className="font-bold text-base text-[#6B1D1D] mb-1">12. Consent</h4>
                    <p>
                      By installing and using Puthuyuga Vijayam, you acknowledge that you have read, understood, and agreed to this Privacy Policy.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end pt-2 border-t border-[#C31F26]/10 mt-4">
                  <Button onClick={() => setShowPrivacyModal(false)} className="font-bold bg-[#C31F26] hover:bg-[#a0191f] text-white rounded-xl">
                    {t('close')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── About Modal ── */}
        {showAboutModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[9999] animate-fade-in" style={{ zIndex: 9999 }}>
            <Card className="w-full max-w-md shadow-2xl border-[#C31F26]/20 rounded-2xl overflow-hidden bg-white text-left">
              <CardHeader className="bg-gradient-to-r from-[#FDF5E6] to-[#FAE9C8] rounded-t-2xl px-5 py-4 border-b border-[#C31F26]/10">
                <CardTitle className="text-base flex items-center gap-2 text-[#6B1D1D] font-bold">
                  <Info className="h-5 w-5 text-[#C31F26]" />
                  {t('aboutApp')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <p className="text-sm text-[#3D1515]/80 leading-relaxed font-medium text-left">
                  {t('aboutDescription')}
                </p>
                <div className="mt-2 p-3 bg-[#FDF5E6] rounded-xl text-xs text-[#8B3A3A] space-y-1 text-left border border-[#C31F26]/10">
                  <p><strong>Version:</strong> 1.0.0</p>
                  <p><strong>Developer:</strong> Rajapalayam Municipality IT Division</p>
                </div>
                <div className="flex justify-end pt-2">
                  <Button onClick={() => setShowAboutModal(false)} className="font-bold bg-[#C31F26] hover:bg-[#a0191f] text-white rounded-xl">
                    {t('close')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Helpline Modal ── */}
        {showHelplineModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[9999] animate-fade-in" style={{ zIndex: 9999 }}>
            <Card className="w-full max-w-md shadow-2xl border-[#C31F26]/20 rounded-2xl overflow-hidden bg-white text-left">
              <CardHeader className="bg-gradient-to-r from-[#FDF5E6] to-[#FAE9C8] rounded-t-2xl px-5 py-4 border-b border-[#C31F26]/10">
                <CardTitle className="text-base flex items-center gap-2 text-[#6B1D1D] font-bold">
                  <PhoneCall className="h-5 w-5 text-[#C31F26]" />
                  {t('officialHelpline')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="space-y-3">
                  <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-[10px] text-red-600 uppercase font-bold tracking-wider">Municipality Control Room</p>
                      <p className="text-sm text-[#3D1515] font-bold mt-0.5">{t('helplineNumber')}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-200 text-red-600 font-bold bg-white rounded-xl"
                      onClick={() => window.open(`tel:${t('helplineNumber')}`)}
                    >
                      Call
                    </Button>
                  </div>
                  <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-[10px] text-blue-600 uppercase font-bold tracking-wider">Emergency WhatsApp</p>
                      <p className="text-sm text-[#3D1515] font-bold mt-0.5">+91 94451 94451</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-200 text-blue-600 font-bold bg-white rounded-xl"
                      onClick={() => window.open(`https://wa.me/919445194451`)}
                    >
                      Chat
                    </Button>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button onClick={() => setShowHelplineModal(false)} className="font-bold bg-[#C31F26] hover:bg-[#a0191f] text-white rounded-xl">
                    {t('close')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
