'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';
import { getComplaintsByCitizen, getNotificationsByCitizen, markNotificationAsRead } from '@/lib/db';
import { ComplaintMap } from '@/components/complaint-map';
import type { Complaint, LocalNotification } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReportIssueModal } from './report-issue-modal';
import { Menu, X, Globe, LogOut, ShieldCheck, PhoneCall, Info } from 'lucide-react';

export function CitizenDashboard() {
  const { currentCitizen, logoutCitizen } = useAuth();
  const { t, toggleLanguage, language } = useLanguage();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notifications, setNotifications] = useState<LocalNotification[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'list' | 'notifications'>('map');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showHelplineModal, setShowHelplineModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (currentCitizen) {
        try {
          const citizenComplaints = await getComplaintsByCitizen(currentCitizen.id);
          setComplaints(citizenComplaints);

          const citizenNotifications = await getNotificationsByCitizen(currentCitizen.id);
          setNotifications(citizenNotifications);
        } catch (error) {
          console.error('Failed to load citizen data:', error);
        }
      }
    };

    loadData();

    // Listen for cross-tab updates (e.g. admin making changes)
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, [currentCitizen]);

  useEffect(() => {
    const markAllRead = async () => {
      if (activeTab === 'notifications' && notifications.some(n => !n.read)) {
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
        const updated = await getComplaintsByCitizen(currentCitizen.id);
        setComplaints(updated);
      } catch (error) {
        console.error('Failed to update complaints after report:', error);
      }
    }
    setActiveTab('map');
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 flag-header shadow-lg">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="text-white hover:bg-white/10 h-10 w-10 flex-shrink-0"
              title="Open Menu"
            >
              <Menu className="h-6 w-6" />
            </Button>
            <div className="text-left">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold flag-header-text tracking-tight">{t('appTitle')}</h1>
              <p className="text-[10px] sm:text-xs flag-header-subtext hidden sm:block">
                {language === 'ta' ? 'ராஜபாளையம் - பொதுமக்கள் குறைதீர்வு தளம்' : 'Rajapalayam - Public Grievance Portal'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setShowReportModal(true)} 
              size="sm" 
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-2.5 sm:px-4 py-1.5 h-9"
            >
              🔴 <span className="hidden xs:inline ml-1">{t('reportNewIssue')}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">{t('welcome')}, {currentCitizen?.name}!</CardTitle>
                <CardDescription className="text-muted-foreground font-semibold">
                  {language === 'ta' ? 'கைபேசி எண்' : 'Mobile'}: {currentCitizen?.mobileNumber}
                </CardDescription>
              </div>
              <Button onClick={() => setShowReportModal(true)} size="lg" className="bg-red-600 hover:bg-red-700 text-white font-bold">
                🔴 {t('reportNewIssue')}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <Card className="border-primary/10">
            <CardContent className="p-3 sm:p-6 pt-4 sm:pt-6">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-primary">{stats.total}</div>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">{t('totalReports')}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-100">
            <CardContent className="p-3 sm:p-6 pt-4 sm:pt-6">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-red-600">{stats.reported}</div>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">{t('reportedRed')}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-100">
            <CardContent className="p-3 sm:p-6 pt-4 sm:pt-6">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-yellow-600">{stats.inProgress}</div>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">{t('inProgressYellow')}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-100">
            <CardContent className="p-3 sm:p-6 pt-4 sm:pt-6">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600">{stats.resolved}</div>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">{t('resolvedGreen')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 sm:gap-2 mb-6 border-b border-border overflow-x-auto scrollbar-none w-full">
          <Button
            variant={activeTab === 'map' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('map')}
            className="flex-1 text-center justify-center text-xs sm:text-sm px-2 sm:px-4 py-2.5 rounded-b-none font-semibold whitespace-nowrap"
          >
            📍 {t('mapView')}
          </Button>
          <Button
            variant={activeTab === 'list' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('list')}
            className="flex-1 text-center justify-center text-xs sm:text-sm px-2 sm:px-4 py-2.5 rounded-b-none font-semibold whitespace-nowrap"
          >
            📋 {t('myReportsCount')} ({complaints.length})
          </Button>
          <Button
            variant={activeTab === 'notifications' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('notifications')}
            className="flex-1 text-center justify-center text-xs sm:text-sm px-2 sm:px-4 py-2.5 rounded-b-none font-semibold whitespace-nowrap relative"
          >
            🔔 {t('updatesTab')}
            {unreadCount > 0 && (
              <span className="ml-1 sm:ml-2 bg-red-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-bold">
                {unreadCount}
              </span>
            )}
          </Button>
        </div>

        {/* Map View */}
        {activeTab === 'map' && (
          <Card className="border-border shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-bold">{t('yourReportsOnMap')}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground font-medium">
                {t('mapLegendDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {complaints.length > 0 ? (
                <div className="h-[450px] rounded-lg overflow-hidden border border-border">
                  <ComplaintMap
                    complaints={complaints}
                    onMarkerClick={setSelectedComplaint}
                    selectedComplaintId={selectedComplaint?.id}
                  />
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4 font-semibold">{t('noComplaints')}</p>
                  <Button onClick={() => setShowReportModal(true)} className="bg-red-600 hover:bg-red-700 text-white font-bold">
                    {t('reportNewIssue')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* List View */}
        {activeTab === 'list' && (
          <div className="space-y-4">
            {complaints.length > 0 ? (
              complaints.map((complaint) => (
                <Card
                  key={complaint.id}
                  className="cursor-pointer hover:shadow-md transition-shadow border-border"
                  onClick={() => {
                    setSelectedComplaint(complaint);
                    setActiveTab('map');
                  }}
                >
                  <CardContent className="p-4 sm:p-6 pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1 space-y-2 text-left">
                        <h3 className="font-semibold text-base sm:text-lg">{complaint.title}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{complaint.description}</p>
                        <div className="flex gap-1.5 mt-3 flex-wrap">
                          <Badge className={getStatusColor(complaint.status)}>
                            {getStatusLabel(complaint.status)}
                          </Badge>
                          <Badge variant="outline" className="border-border text-[10px] sm:text-xs">
                            {t(complaint.category as any)}
                          </Badge>
                          <Badge variant="outline" className="border-border font-mono text-[10px] sm:text-xs">
                            {t('priority')}: {t(complaint.priority as any).toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground pt-1">
                          {language === 'ta' ? 'பதிவு செய்யப்பட்ட நாள்' : 'Reported'}: {new Date(complaint.createdAt).toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-US')}
                        </p>
                      </div>
                      {complaint.photoUrls && complaint.photoUrls.length > 0 && (
                        <img
                          src={complaint.photoUrls[0]}
                          alt="complaint"
                          className="w-full h-48 sm:w-24 sm:h-24 object-cover rounded-md border border-border mt-2 sm:mt-0 self-center sm:self-start flex-shrink-0"
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-border">
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground mb-4 font-semibold">
                    {language === 'ta' ? 'இதுவரை புகார்கள் ஏதுமில்லை. உங்கள் பகுதியை மேம்படுத்த புகாரளிக்கவும்!' : 'No reports yet. Help us improve your locality!'}
                  </p>
                  <Button onClick={() => setShowReportModal(true)} className="bg-red-600 hover:bg-red-700 text-white font-bold">
                    {t('reportNewIssue')}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Notifications View */}
        {activeTab === 'notifications' && (
          <Card className="border-border shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-bold">{t('updatesTab')}</CardTitle>
            </CardHeader>
            <CardContent>
              {notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        notif.read
                          ? 'bg-background border-border'
                          : 'bg-primary/5 border-primary/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-sm text-foreground">{notif.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notif.createdAt).toLocaleString(language === 'ta' ? 'ta-IN' : 'en-US')}
                          </p>
                        </div>
                        {!notif.read && (
                          <span className="w-2.5 h-2.5 bg-primary rounded-full flex-shrink-0 mt-1"></span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground font-semibold">
                    {language === 'ta' ? 'அறிவிப்புகள் ஏதுமில்லை' : 'No notifications yet'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
      </main>

      {/* Sidebar Drawer */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 z-[999] transition-opacity" 
            onClick={() => setSidebarOpen(false)}
            style={{ zIndex: 999 }}
          />
          
          {/* Drawer Content */}
          <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-card text-card-foreground z-[1000] flex flex-col shadow-2xl transition-all duration-300 transform translate-x-0" style={{ zIndex: 1000 }}>
            {/* Drawer Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-primary/5">
              <div>
                <h2 className="text-xl font-bold text-primary tracking-tight">{t('appTitle')}</h2>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {language === 'ta' ? 'ராஜபாளையம் நகராட்சி' : 'Rajapalayam Municipality'}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSidebarOpen(false)}
                className="h-8 w-8 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Citizen Details */}
            <div className="p-5 border-b border-border bg-muted/40">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                  {currentCitizen?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-sm line-clamp-1">{currentCitizen?.name}</h4>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{currentCitizen?.mobileNumber}</p>
                </div>
              </div>
            </div>

            {/* Drawer Navigation Options */}
            <div className="flex-1 py-4 overflow-y-auto px-3 space-y-1">
              {/* Language Option */}
              <button
                onClick={() => {
                  toggleLanguage();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent hover:text-accent-foreground text-left text-sm font-semibold transition-colors"
              >
                <Globe className="h-5 w-5 text-primary" />
                <div className="flex-1 flex justify-between items-center">
                  <span>{t('language')}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded font-bold border border-border">
                    {language === 'en' ? 'English' : 'தமிழ்'}
                  </span>
                </div>
              </button>

              {/* Official Helpline Option */}
              <button
                onClick={() => {
                  setShowHelplineModal(true);
                  setSidebarOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent hover:text-accent-foreground text-left text-sm font-semibold transition-colors"
              >
                <PhoneCall className="h-5 w-5 text-primary" />
                <span>{t('officialHelpline')}</span>
              </button>

              {/* Privacy Policy Option */}
              <button
                onClick={() => {
                  setShowPrivacyModal(true);
                  setSidebarOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent hover:text-accent-foreground text-left text-sm font-semibold transition-colors"
              >
                <ShieldCheck className="h-5 w-5 text-primary" />
                <span>{t('privacyPolicy')}</span>
              </button>

              {/* About App Option */}
              <button
                onClick={() => {
                  setShowAboutModal(true);
                  setSidebarOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent hover:text-accent-foreground text-left text-sm font-semibold transition-colors"
              >
                <Info className="h-5 w-5 text-primary" />
                <span>{t('aboutApp')}</span>
              </button>
            </div>

            {/* Drawer Footer (Logout) */}
            <div className="p-4 border-t border-border">
              <Button 
                variant="destructive" 
                className="w-full flex items-center justify-center gap-2 font-bold"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                {t('logout')}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[9999] animate-fade-in" style={{ zIndex: 9999 }}>
          <Card className="w-full max-w-md shadow-2xl border-primary/20">
            <CardHeader className="bg-primary/5 rounded-t-lg">
              <CardTitle className="text-lg flex items-center gap-2 text-primary font-bold">
                <ShieldCheck className="h-5 w-5" />
                {t('privacyPolicy')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <p className="text-sm text-foreground/80 leading-relaxed font-semibold text-left">
                {t('privacyDescription')}
              </p>
              <div className="flex justify-end pt-2">
                <Button onClick={() => setShowPrivacyModal(false)} className="font-bold">
                  {t('close')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* About App Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[9999] animate-fade-in" style={{ zIndex: 9999 }}>
          <Card className="w-full max-w-md shadow-2xl border-primary/20">
            <CardHeader className="bg-primary/5 rounded-t-lg">
              <CardTitle className="text-lg flex items-center gap-2 text-primary font-bold">
                <Info className="h-5 w-5" />
                {t('aboutApp')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <p className="text-sm text-foreground/80 leading-relaxed font-semibold text-left">
                {t('aboutDescription')}
              </p>
              <div className="mt-2 p-3 bg-muted rounded text-xs text-muted-foreground space-y-1 text-left">
                <p><strong>Version:</strong> 1.0.0 (Capacitor Build)</p>
                <p><strong>Developer:</strong> Rajapalayam Municipality IT Division</p>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={() => setShowAboutModal(false)} className="font-bold">
                  {t('close')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Helpline Modal */}
      {showHelplineModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[9999] animate-fade-in" style={{ zIndex: 9999 }}>
          <Card className="w-full max-w-md shadow-2xl border-primary/20">
            <CardHeader className="bg-primary/5 rounded-t-lg">
              <CardTitle className="text-lg flex items-center gap-2 text-primary font-bold">
                <PhoneCall className="h-5 w-5" />
                {t('officialHelpline')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="space-y-3 font-semibold">
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-xs text-red-600 uppercase font-bold tracking-wider">Municipality Control Room</p>
                    <p className="text-sm text-foreground mt-0.5">{t('helplineNumber')}</p>
                  </div>
                  <Button variant="outline" size="sm" className="border-red-200 text-red-600 font-bold bg-white" onClick={() => window.open(`tel:${t('helplineNumber')}`)}>
                    Call
                  </Button>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-xs text-blue-600 uppercase font-bold tracking-wider">Emergency WhatsApp</p>
                    <p className="text-sm text-foreground mt-0.5">+91 94451 94451</p>
                  </div>
                  <Button variant="outline" size="sm" className="border-blue-200 text-blue-600 font-bold bg-white" onClick={() => window.open(`https://wa.me/919445194451`)}>
                    Chat
                  </Button>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={() => setShowHelplineModal(false)} className="font-bold">
                  {t('close')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
