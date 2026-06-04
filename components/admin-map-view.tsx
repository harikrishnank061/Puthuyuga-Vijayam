'use client';

import { useState, useEffect } from 'react';
import { ComplaintMap } from '@/components/complaint-map';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getComplaints } from '@/lib/db';
import type { Complaint } from '@/lib/db';
import { useLanguage } from '@/lib/i18n';
import { Badge } from '@/components/ui/badge';

interface AdminMapViewProps {
  complaints: Complaint[];
  onComplaintSelect: (complaint: Complaint) => void;
  selectedComplaint?: Complaint | null;
}

export function AdminMapView({
  complaints,
  onComplaintSelect,
  selectedComplaint,
}: AdminMapViewProps) {
  const { t, language } = useLanguage();
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | Complaint['status']>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Complaint['priority']>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');

  // Reactively filter complaints whenever props or filter states change
  useEffect(() => {
    let filtered = complaints;

    if (statusFilter !== 'all') {
      if (statusFilter === 'resolved') {
        filtered = filtered.filter((c) => c.status === 'resolved' || c.status === 'closed');
      } else {
        filtered = filtered.filter((c) => c.status === statusFilter);
      }
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter((c) => c.priority === priorityFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((c) => c.category === categoryFilter);
    }

    setFilteredComplaints(filtered);
  }, [complaints, statusFilter, priorityFilter, categoryFilter]);

  const handleStatusFilterChange = (status: 'all' | Complaint['status']) => {
    setStatusFilter(status);
  };

  const handlePriorityFilterChange = (priority: 'all' | Complaint['priority']) => {
    setPriorityFilter(priority);
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

  const getStatistics = () => {
    const stats = {
      total: complaints.length,
      open: complaints.filter((c) => c.status === 'open').length,
      inProgress: complaints.filter((c) => c.status === 'in-progress' || c.status === 'assigned').length,
      resolved: complaints.filter((c) => c.status === 'resolved' || c.status === 'closed').length,
    };
    return stats;
  };

  const stats = getStatistics();

  return (
    <div className="space-y-6">
      {/* Filters and Map */}
      <Card className="border-border shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            {language === 'ta' ? 'புகார் இருப்பிட வரைபடம்' : 'Complaint Location Map'}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground font-medium">
            {t('mapLegendDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filter Section */}
          <div className="flex flex-col gap-4 sm:gap-6 bg-muted/20 p-3.5 sm:p-5 rounded-lg border border-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="text-xs sm:text-sm font-semibold mb-2 block text-foreground">
                  {language === 'ta' ? 'நிலை வாரியாக வடிகட்டுக' : 'Filter by Status'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(['all', 'open', 'assigned', 'in-progress', 'resolved'] as const).map((status) => (
                    <Button
                      key={status}
                      variant={statusFilter === status ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusFilterChange(status)}
                      className={`text-xs px-2.5 py-1.5 h-8 ${
                        statusFilter === status
                          ? status === 'open'
                            ? 'bg-red-600 hover:bg-red-700 text-white border-red-600'
                            : status === 'in-progress' || status === 'assigned'
                            ? 'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600'
                            : status === 'resolved'
                            ? 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                            : ''
                          : 'border-border bg-card text-foreground'
                      }`}
                    >
                      {status === 'all' ? (language === 'ta' ? 'அனைத்தும்' : 'All') : t(status as any)}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs sm:text-sm font-semibold mb-2 block text-foreground">
                  {language === 'ta' ? 'முன்னுரிமை வாரியாக வடிகட்டுக' : 'Filter by Priority'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(['all', 'low', 'medium', 'high', 'critical'] as const).map((priority) => (
                    <Button
                      key={priority}
                      variant={priorityFilter === priority ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePriorityFilterChange(priority)}
                      className={`text-xs px-2.5 py-1.5 h-8 border-border ${
                        priorityFilter === priority ? '' : 'bg-card text-foreground'
                      }`}
                    >
                      {priority === 'all' ? (language === 'ta' ? 'அனைத்தும்' : 'All') : t(priority as any)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <label className="text-xs sm:text-sm font-semibold mb-2 block text-foreground">
                {language === 'ta' ? 'வகை வாரியாக வடிகட்டுக' : 'Filter by Category'}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['all', 'roads', 'water', 'sanitation', 'electricity', 'environment', 'other'].map((cat) => (
                  <Button
                    key={cat}
                    variant={categoryFilter === cat ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCategoryFilter(cat)}
                    className={`text-xs px-2.5 py-1.5 h-8 border-border ${
                      categoryFilter === cat ? '' : 'bg-card text-foreground'
                    }`}
                  >
                    {cat === 'all' ? (language === 'ta' ? 'அனைத்தும்' : 'All') : t(cat as any)}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="h-[450px] rounded-lg overflow-hidden border border-border shadow-inner">
            <ComplaintMap
              complaints={filteredComplaints}
              onMarkerClick={onComplaintSelect}
              selectedComplaintId={selectedComplaint?.id}
            />
          </div>

          {/* Complaints List */}
          {filteredComplaints.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h3 className="font-semibold text-lg mb-3">
                {language === 'ta' ? `வரைபடத்தில் உள்ள புகார்கள் (${filteredComplaints.length})` : `Issues in View (${filteredComplaints.length})`}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                {filteredComplaints.map((complaint) => (
                  <div
                    key={complaint.id}
                    onClick={() => onComplaintSelect(complaint)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:-translate-y-[1px] hover:shadow-sm flex flex-col justify-between ${
                      selectedComplaint?.id === complaint.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-accent'
                    } ${getStatusColor(complaint.status)}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{complaint.title}</p>
                        <p className="text-xs opacity-75 mt-1">
                          {t('reportedByLabel')}: {complaint.citizenName}
                        </p>
                      </div>
                      <Badge className="bg-white/70 text-slate-800 text-[10px] font-mono select-none px-2 py-0.5 border border-slate-200">
                        {t(complaint.priority as any).toUpperCase()}
                      </Badge>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between text-[11px] opacity-80 pt-2 border-t border-black/5">
                      <span>{getStatusLabel(complaint.status)}</span>
                      <span>{new Date(complaint.createdAt).toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-US')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
        <Card className="border-border shadow-sm">
          <CardContent className="p-3 sm:p-6 pt-4 sm:pt-6">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary">{stats.total}</div>
              <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-1">{t('totalReports')}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-100 shadow-sm">
          <CardContent className="p-3 sm:p-6 pt-4 sm:pt-6">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-red-600">{stats.open}</div>
              <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-1">{t('reportedRed')}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-100 shadow-sm">
          <CardContent className="p-3 sm:p-6 pt-4 sm:pt-6">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-yellow-600">{stats.inProgress}</div>
              <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-1">{t('inProgressYellow')}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-100 shadow-sm">
          <CardContent className="p-3 sm:p-6 pt-4 sm:pt-6">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-600">{stats.resolved}</div>
              <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-1">{t('resolvedGreen')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
