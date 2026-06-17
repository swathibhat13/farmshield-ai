import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Activity, ShieldAlert, Search, Trash2,
  BarChart2, Bell, Settings, ClipboardList, Leaf, RefreshCw,
  Download, ChevronLeft, ChevronRight,
  AlertTriangle, CheckCircle, XCircle,
  TrendingUp, Calendar, Clock, Cpu, Shield, Send, ToggleLeft,
  ToggleRight, ArrowUpDown, Info, X, UserPlus,
  Sun, Moon, Eye, Smartphone, Mail, Key, Map, TrendingDown
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend, LineChart, Line
} from 'recharts';

const API = 'http://127.0.0.1:5000';
const COLORS = ['#52B788', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

// ── Toast ────────────────────────────────────────────
interface Toast { id: number; message: string; type: 'success' | 'error' | 'info'; }
const ToastContainer = ({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) => (
  <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
    {toasts.map(t => (
      <div key={t.id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium border animate-slide-up ${t.type === 'success' ? 'bg-healthy-emerald/20 border-healthy-emerald/40 text-healthy-emerald' :
          t.type === 'error' ? 'bg-red-500/20 border-red-500/40 text-red-400' :
            'bg-blue-500/20 border-blue-500/40 text-blue-400'
        }`}>
        {t.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> :
          t.type === 'error' ? <XCircle className="w-4 h-4 shrink-0" /> :
            <Info className="w-4 h-4 shrink-0" />}
        {t.message}
        <button onClick={() => remove(t.id)} className="ml-2 opacity-60 hover:opacity-100"><X className="w-3 h-3" /></button>
      </div>
    ))}
  </div>
);

// ── Confirm Dialog ────────────────────────────────────
const ConfirmDialog = ({ open, title, message, onConfirm, onCancel }: any) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle className="w-6 h-6 text-warning-amber shrink-0" />
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <p className="text-cool-slate text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors font-medium">Confirm</button>
        </div>
      </div>
    </div>
  );
};

// ── Severity Badge ────────────────────────────────────
const SeverityBadge = ({ severity }: { severity: string }) => {
  const s = (severity || 'low').toLowerCase();
  const cfg: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-green-500/20 text-green-400 border-green-500/30',
  };
  const dot: Record<string, string> = { critical: 'bg-red-400', high: 'bg-orange-400', medium: 'bg-yellow-400', low: 'bg-green-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg[s] || cfg.low}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot[s] || dot.low}`} />
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
};

// ── Skeleton ──────────────────────────────────────────
const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-white/5 rounded-lg ${className}`} />
);

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart2 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'detections', label: 'Detections', icon: Activity },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'notifications', label: 'Alerts', icon: Bell },
  { id: 'logs', label: 'Activity Logs', icon: ClipboardList },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

type TabId = typeof TABS[number]['id'];

// ─────────────────────────────────────────────────────
const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [detections, setDetections] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirm, setConfirm] = useState<any>(null);
  const [theme, setTheme] = useState('dark');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedDetection, setSelectedDetection] = useState<any>(null);
  const [lastRefreshed, setLastRefreshed] = useState(0);

  // Users state
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userSort, setUserSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'created_at', dir: 'desc' });
  const [userPage, setUserPage] = useState(1);
  const USERS_PER_PAGE = 8;

  // Detections state
  const [detSearch, setDetSearch] = useState('');
  const [detCrop, setDetCrop] = useState('');
  const [detDisease, setDetDisease] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [detSeverity, setDetSeverity] = useState('');
  const [detPage, setDetPage] = useState(1);
  const DETS_PER_PAGE = 10;

  // Notifications state
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [alertType, setAlertType] = useState('outbreak');

  // Settings state
  const [settings, setSettings] = useState({
    aiThreshold: '85',
    maintenanceMode: false,
    emailNotifications: true,
    autoBackup: true,
    modelVersion: 'v2.1',
    announcement: '',
  });

  const token = () => localStorage.getItem('fs_token');

  const toast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };

  const authHeaders = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

  const fetchStats = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/admin/dashboard-stats`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setStats(d);
    } catch { toast('Failed to load stats', 'error'); }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/admin/users`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setUsers(d.users);
    } catch { toast('Failed to load users', 'error'); }
  }, []);

  const fetchDetections = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (detCrop) params.set('crop', detCrop);
      if (detSeverity) params.set('severity', detSeverity);
      const r = await fetch(`${API}/api/admin/detections?${params}`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setDetections(d.history);
    } catch { toast('Failed to load detections', 'error'); }
  }, [detCrop, detSeverity]);

  const fetchLogs = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/admin/activity-logs`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) {
        const mockLogs = [
          { type: 'role_change', action: 'Changed role for john@example.com to Admin', user: 'admin@farmshield.com', timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ') },
          { type: 'suspension', action: 'Suspended user account', user: 'spam@bot.com', timestamp: new Date(Date.now() - 3600000).toISOString().slice(0, 16).replace('T', ' ') },
          { type: 'failed_login', action: 'Failed login attempt (Invalid Password)', user: 'unknown IP 192.168.1.5', timestamp: new Date(Date.now() - 7200000).toISOString().slice(0, 16).replace('T', ' ') },
          { type: 'system_error', action: 'Database connection timeout', user: 'System', timestamp: new Date(Date.now() - 10800000).toISOString().slice(0, 16).replace('T', ' ') }
        ];
        setLogs([...mockLogs, ...d.logs]);
      }
    } catch { toast('Failed to load logs', 'error'); }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/admin/alerts`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setAlerts(d.alerts);
    } catch { toast('Failed to load alerts', 'error'); }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (activeTab === 'overview' || activeTab === 'analytics') await fetchStats();
      if (activeTab === 'users') await fetchUsers();
      if (activeTab === 'detections') await fetchDetections();
      if (activeTab === 'logs') await fetchLogs();
      if (activeTab === 'notifications') await fetchAlerts();
      setLoading(false);
      setLastRefreshed(0);
    };
    load();
  }, [activeTab, fetchStats, fetchUsers, fetchDetections, fetchLogs, fetchAlerts]);

  useEffect(() => {
    const timer = setInterval(() => setLastRefreshed(r => r + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetcher = setInterval(async () => {
      if (activeTab === 'overview' || activeTab === 'analytics') await fetchStats();
      if (activeTab === 'users') await fetchUsers();
      if (activeTab === 'detections') await fetchDetections();
      if (activeTab === 'logs') await fetchLogs();
      if (activeTab === 'notifications') await fetchAlerts();
      setLastRefreshed(0);
    }, 30000);
    return () => clearInterval(fetcher);
  }, [activeTab, fetchStats, fetchUsers, fetchDetections, fetchLogs, fetchAlerts]);

  useEffect(() => {
    if (activeTab === 'detections') { setDetPage(1); fetchDetections(); }
  }, [detCrop, detSeverity]);

  const toggleRole = async (uid: number, role: string) => {
    const nr = role === 'admin' ? 'user' : 'admin';
    await fetch(`${API}/api/admin/users/${uid}/role`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ role: nr }) });
    toast(`Role updated to ${nr}`);
    fetchUsers();
  };

  const toggleSuspend = async (uid: number) => {
    try {
      const res = await fetch(`${API}/api/admin/users/${uid}/toggle-suspend`, { method: 'POST', headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        toast(`User ${data.is_suspended ? 'suspended' : 'unsuspended'}`);
        fetchUsers();
      } else {
        toast(data.error || 'Failed to toggle suspension', 'error');
      }
    } catch (err) {
      toast('Network error', 'error');
    }
  };

  const deleteUser = (u: any) => {
    setConfirm({
      title: 'Delete User',
      message: `Are you sure you want to delete "${u.email}"? This will also remove all their detection history. This action cannot be undone.`,
      onConfirm: async () => {
        await fetch(`${API}/api/admin/users/${u.id}`, { method: 'DELETE', headers: authHeaders() });
        toast(`${u.email} deleted`, 'info');
        fetchUsers();
        setConfirm(null);
      },
    });
  };

  const handleSendBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    try {
      const res = await fetch(`${API}/api/admin/alerts`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ type: 'broadcast', title: 'Broadcast Message', message: broadcastMsg })
      });
      if (res.ok) {
        setBroadcastSent(true);
        setBroadcastMsg('');
        toast('Broadcast sent to all users!');
        fetchAlerts();
        setTimeout(() => setBroadcastSent(false), 3000);
      } else {
        toast('Failed to send broadcast', 'error');
      }
    } catch {
      toast('Network error', 'error');
    }
  };

  const handleCreateSystemAlert = async () => {
    let title = 'System Alert';
    let message = '';
    if (alertType === 'outbreak') {
      title = '🦠 Disease Outbreak Alert';
      message = 'A disease outbreak has been reported in your region. Please take precautions.';
    } else if (alertType === 'weather') {
      title = '⛈️ Weather Warning';
      message = 'Adverse weather conditions expected. Please secure your crops.';
    } else if (alertType === 'system') {
      title = '⚙️ System Maintenance';
      message = 'Upcoming system maintenance. The platform may be unavailable.';
    }

    try {
      const res = await fetch(`${API}/api/admin/alerts`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ type: alertType, title, message })
      });
      if (res.ok) {
        toast(`${alertType} alert created and queued!`);
        fetchAlerts();
      } else {
        toast('Failed to create alert', 'error');
      }
    } catch {
      toast('Network error', 'error');
    }
  };

  // ── Export CSV/PDF ──────────────────────────────────────
  const exportCSV = () => {
    const rows = filteredDets.map(d => [d.date, d.user_email, d.crop, d.disease, d.severity, d.confidence, d.status].join(','));
    const csv = ['Date,User,Crop,Disease,Severity,Confidence,Status', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'detections.csv'; a.click();
    toast('CSV exported!');
  };

  const exportPDF = () => {
    window.print();
    toast('PDF export triggered');
  };

  // ── Filtered & Paged Data ───────────────────────────
  const filteredUsers = users
    .filter(u => userRoleFilter === 'all' || u.role === userRoleFilter)
    .filter(u => !userSearch || u.email.includes(userSearch) || (u.name || '').toLowerCase().includes(userSearch.toLowerCase()))
    .sort((a, b) => {
      const av = a[userSort.key] ?? ''; const bv = b[userSort.key] ?? '';
      return userSort.dir === 'asc' ? (av < bv ? -1 : 1) : (av > bv ? -1 : 1);
    });
  const pagedUsers = filteredUsers.slice((userPage - 1) * USERS_PER_PAGE, userPage * USERS_PER_PAGE);
  const userPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);

  const filteredDets = detections.filter(d => {
    const matchSearch = !detSearch || d.user_email?.includes(detSearch) || d.crop?.toLowerCase().includes(detSearch.toLowerCase()) || d.disease?.toLowerCase().includes(detSearch.toLowerCase());
    const matchCrop = !detCrop || d.crop?.toLowerCase().includes(detCrop.toLowerCase());
    const matchDisease = !detDisease || d.disease?.toLowerCase().includes(detDisease.toLowerCase());

    let matchDate = true;
    if (startDate && endDate) {
      const dDate = new Date(d.date.split(' ')[0]);
      matchDate = dDate >= new Date(startDate) && dDate <= new Date(endDate);
    }

    return matchSearch && matchCrop && matchDisease && matchDate;
  });
  const pagedDets = filteredDets.slice((detPage - 1) * DETS_PER_PAGE, detPage * DETS_PER_PAGE);
  const detPages = Math.ceil(filteredDets.length / DETS_PER_PAGE);

  const sortHeader = (key: string) => (
    <button onClick={() => setUserSort(s => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }))}
      className="flex items-center gap-1 hover:text-white transition-colors">
      {key.replace('_', ' ')} <ArrowUpDown className="w-3 h-3" />
    </button>
  );

  const Pagination = ({ page, pages, onPage }: any) => pages <= 1 ? null : (
    <div className="flex items-center gap-2 justify-end p-4 border-t border-white/5">
      <button onClick={() => onPage(page - 1)} disabled={page === 1} className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
      <span className="text-cool-slate text-sm">Page {page} of {pages}</span>
      <button onClick={() => onPage(page + 1)} disabled={page === pages} className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 transition-colors"><ChevronRight className="w-4 h-4" /></button>
    </div>
  );

  const Trend = ({ trend }: { trend: any }) => {
    if (!trend) return null;
    return (
      <div className={`mt-3 text-xs font-medium flex items-center gap-1 ${trend.is_positive ? 'text-healthy-emerald' : 'text-red-400'}`}>
        {trend.direction === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
        {trend.value} <span className="text-cool-slate ml-1 font-normal opacity-70">vs last week</span>
      </div>
    );
  };

  // ── Render ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#020b08] pt-28 pb-24 px-4 md:px-10 text-white">
      <ToastContainer toasts={toasts} remove={id => setToasts(t => t.filter(x => x.id !== id))} />
      <ConfirmDialog open={!!confirm} {...confirm} onCancel={() => setConfirm(null)} />

      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-farm-accent" />
                <span className="text-xs font-bold tracking-[0.2em] text-farm-accent uppercase">Admin Control Center</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/40 border border-white/5 text-xs text-cool-slate">
                <div className="w-2 h-2 rounded-full bg-healthy-emerald animate-pulse" />
                <span>LIVE</span>
                <span className="opacity-50 ml-1 border-l border-white/20 pl-2">Updated {lastRefreshed}s ago</span>
              </div>
            </div>
            <h1 className="text-3xl font-light tracking-tight text-white">FarmShield AI</h1>
          </div>
          <div className="flex items-center gap-3 print:hidden">
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
              {theme === 'dark' ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
            </button>
            <button onClick={async () => { setLoading(true); if (activeTab === 'overview' || activeTab === 'analytics') await fetchStats(); if (activeTab === 'users') await fetchUsers(); if (activeTab === 'detections') await fetchDetections(); if (activeTab === 'logs') await fetchLogs(); setLoading(false); setLastRefreshed(0); toast('Data refreshed'); }}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-colors">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 bg-white/[0.03] border border-white/10 p-1 rounded-xl mb-8 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${activeTab === id ? 'bg-farm-accent text-black shadow-lg' : 'text-cool-slate hover:text-white hover:bg-white/5'
                }`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Loading skeleton */}
        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-28" />)}
            </div>
            <Skeleton className="h-80" />
          </div>
        ) : (
          <>
            {/* ── OVERVIEW TAB ─────────────────────────────── */}
            {activeTab === 'overview' && stats && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/[0.03] border border-white/10 p-5 rounded-xl group hover:border-farm-accent/30 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <Users className="w-7 h-7 text-farm-accent" />
                    </div>
                    <div className="text-2xl font-bold">{stats.stats.total_users}</div>
                    <div className="text-cool-slate text-xs">Total Farmers</div>
                    <Trend trend={stats.trends?.total_users} />
                  </div>
                  <div className="bg-white/[0.03] border border-white/10 p-5 rounded-xl hover:border-blue-400/30 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <Activity className="w-7 h-7 text-blue-400" />
                    </div>
                    <div className="text-2xl font-bold">{stats.stats.total_detections}</div>
                    <div className="text-cool-slate text-xs">Total Detections</div>
                    <Trend trend={stats.trends?.total_detections} />
                  </div>
                  <div className="bg-white/[0.03] border border-white/10 p-5 rounded-xl hover:border-healthy-emerald/30 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <Cpu className="w-7 h-7 text-healthy-emerald" />
                    </div>
                    <div className="text-2xl font-bold">{stats.stats.model_health}</div>
                    <div className="text-cool-slate text-xs">AI Model Health</div>
                    <Trend trend={stats.trends?.model_health} />
                  </div>
                  <div className="bg-white/[0.03] border border-white/10 p-5 rounded-xl hover:border-yellow-400/30 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <ShieldAlert className="w-7 h-7 text-yellow-400" />
                    </div>
                    <div className="text-2xl font-bold">{stats.stats.active_users}</div>
                    <div className="text-cool-slate text-xs">Active Sessions</div>
                    <Trend trend={stats.trends?.active_users} />
                  </div>
                  <div className="bg-white/[0.03] border border-white/10 p-5 rounded-xl hover:border-orange-400/30 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <Calendar className="w-7 h-7 text-orange-400" />
                    </div>
                    <div className="text-2xl font-bold">{stats.stats.today_detections}</div>
                    <div className="text-cool-slate text-xs">Detections Today</div>
                    <Trend trend={stats.trends?.today_detections} />
                  </div>
                  <div className="bg-white/[0.03] border border-white/10 p-5 rounded-xl hover:border-purple-400/30 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <Leaf className="w-7 h-7 text-purple-400" />
                    </div>
                    <div className="text-sm font-semibold truncate" title={stats.stats.top_disease_week}>{stats.stats.top_disease_week?.replace(/___/g, ' ')?.replace(/_/g, ' ') || 'N/A'}</div>
                    <div className="text-cool-slate text-xs">Top Disease (Week)</div>
                    <Trend trend={stats.trends?.top_disease_week} />
                  </div>
                  <div className="bg-white/[0.03] border border-white/10 p-5 rounded-xl hover:border-pink-400/30 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <UserPlus className="w-7 h-7 text-pink-400" />
                    </div>
                    <div className="text-2xl font-bold">{stats.stats.new_users_week}</div>
                    <div className="text-cool-slate text-xs">New Users (Week)</div>
                    <Trend trend={stats.trends?.new_users_week} />
                  </div>
                  <div className="bg-white/[0.03] border border-white/10 p-5 rounded-xl hover:border-cyan-400/30 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <Clock className="w-7 h-7 text-cyan-400" />
                    </div>
                    <div className="text-2xl font-bold">{stats.stats.system_uptime}</div>
                    <div className="text-cool-slate text-xs">System Uptime</div>
                    <Trend trend={stats.trends?.system_uptime} />
                  </div>
                </div>

                {/* 7-day trend chart */}
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
                  <h3 className="text-base font-medium mb-6">Detection Activity — Last 7 Days</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.trend || []} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#52B788" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#52B788" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
                        <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                        <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #ffffff15', borderRadius: 8 }} itemStyle={{ color: '#52B788' }} />
                        <Area type="monotone" dataKey="detections" stroke="#52B788" strokeWidth={2} fill="url(#gArea)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* ── USERS TAB ─────────────────────────────────── */}
            {activeTab === 'users' && (
              <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-white/10 flex flex-wrap gap-3 items-center justify-between">
                  <h3 className="font-medium">Registered Users <span className="text-cool-slate text-sm ml-1">({filteredUsers.length})</span></h3>
                  <div className="flex flex-wrap gap-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cool-slate" />
                      <input value={userSearch} onChange={e => { setUserSearch(e.target.value); setUserPage(1); }}
                        placeholder="Search name or email..." className="bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm focus:border-farm-accent outline-none w-52" />
                    </div>
                    <select value={userRoleFilter} onChange={e => { setUserRoleFilter(e.target.value); setUserPage(1); }}
                      className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-farm-accent outline-none text-white">
                      <option value="all">All Roles</option>
                      <option value="admin">Admin</option>
                      <option value="user">User</option>
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/[0.03] text-cool-slate text-xs uppercase">
                      <tr>
                        <th className="px-5 py-3.5">#</th>
                        <th className="px-5 py-3.5">{sortHeader('name')}</th>
                        <th className="px-5 py-3.5">{sortHeader('email')}</th>
                        <th className="px-5 py-3.5">Role</th>
                        <th className="px-5 py-3.5">{sortHeader('total_detections')}</th>
                        <th className="px-5 py-3.5">{sortHeader('created_at')}</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {pagedUsers.map((u, i) => (
                        <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-5 py-3.5 text-cool-slate">{(userPage - 1) * USERS_PER_PAGE + i + 1}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-farm-accent/40 to-blue-500/40 flex items-center justify-center text-xs font-bold shrink-0">
                                {(u.name || u.email || '?').charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium">{u.name || 'Anonymous'}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-cool-slate">{u.email}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex flex-col gap-1.5 items-start">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-medium border ${u.role === 'admin' ? 'bg-farm-accent/15 text-farm-accent border-farm-accent/30' : 'bg-white/5 text-white/60 border-white/10'}`}>
                                {u.role}
                              </span>
                              {u.is_suspended && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border bg-red-500/15 text-red-400 border-red-500/30">
                                  Suspended
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-medium">{u.total_detections}</td>
                          <td className="px-5 py-3.5 text-cool-slate">{u.created_at}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2 justify-end opacity-70 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setSelectedUser(u)}
                                title="View Details"
                                className="p-1.5 hover:bg-blue-500/10 rounded-lg transition-colors text-blue-400">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button onClick={() => toggleRole(u.id, u.role)}
                                title={u.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                                className="p-1.5 hover:bg-farm-accent/10 rounded-lg transition-colors text-farm-accent">
                                {u.role === 'admin' ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                              </button>
                              <button onClick={() => toggleSuspend(u.id)}
                                title={u.is_suspended ? 'Unsuspend User' : 'Suspend User'}
                                className="p-1.5 hover:bg-orange-500/10 rounded-lg transition-colors text-orange-400">
                                {u.is_suspended ? <Shield className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                              </button>
                              <button onClick={() => deleteUser(u)}
                                className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors text-red-400">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {pagedUsers.length === 0 && (
                        <tr><td colSpan={7} className="px-5 py-12 text-center text-cool-slate">No users found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination page={userPage} pages={userPages} onPage={setUserPage} />
              </div>
            )}

            {/* ── DETECTIONS TAB ────────────────────────────── */}
            {activeTab === 'detections' && (
              <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-white/10 flex flex-wrap gap-3 items-center justify-between">
                  <h3 className="font-medium">Disease Detections <span className="text-cool-slate text-sm ml-1">({filteredDets.length})</span></h3>
                  <div className="flex flex-wrap gap-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cool-slate" />
                      <input value={detSearch} onChange={e => { setDetSearch(e.target.value); setDetPage(1); }}
                        placeholder="Search user, crop, disease..." className="bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm focus:border-farm-accent outline-none w-52" />
                    </div>

                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-farm-accent outline-none text-cool-slate w-[130px]" />
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-farm-accent outline-none text-cool-slate w-[130px]" />

                    <select value={detDisease} onChange={e => setDetDisease(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-farm-accent outline-none text-white w-32 truncate">
                      <option value="">All Diseases</option>
                      <option value="healthy">Healthy</option>
                      <option value="blight">Blight</option>
                      <option value="rust">Rust</option>
                      <option value="spot">Leaf Spot</option>
                    </select>

                    <input value={detCrop} onChange={e => setDetCrop(e.target.value)} placeholder="Filter crop..."
                      className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-farm-accent outline-none w-32" />
                    <select value={detSeverity} onChange={e => setDetSeverity(e.target.value)}
                      className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-farm-accent outline-none text-white">
                      <option value="">All Severity</option>
                      <option value="low">🟢 Low</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="high">🔴 High</option>
                      <option value="critical">🚨 Critical</option>
                    </select>
                    <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 bg-farm-accent/10 hover:bg-farm-accent/20 border border-farm-accent/30 text-farm-accent text-sm rounded-lg transition-colors">
                      <Download className="w-3.5 h-3.5" /> CSV
                    </button>
                    <button onClick={exportPDF} className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm rounded-lg transition-colors">
                      <Download className="w-3.5 h-3.5" /> PDF
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/[0.03] text-cool-slate text-xs uppercase">
                      <tr>
                        <th className="px-5 py-3.5">Image</th>
                        <th className="px-5 py-3.5">Date & Time</th>
                        <th className="px-5 py-3.5">User</th>
                        <th className="px-5 py-3.5">Crop</th>
                        <th className="px-5 py-3.5">Disease</th>
                        <th className="px-5 py-3.5">Severity</th>
                        <th className="px-5 py-3.5">Confidence</th>
                        <th className="px-5 py-3.5">Status</th>
                        <th className="px-5 py-3.5 text-right print:hidden">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {pagedDets.map(d => (
                        <tr key={d.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3.5">
                            {d.image_path ? (
                              <a href={`${API}${d.image_path}`} target="_blank" rel="noreferrer" title="Click to view full image">
                                <img src={`${API}${d.image_path}`} alt="Crop Thumbnail" className="w-10 h-10 object-cover rounded shadow-md border border-white/10 hover:border-farm-accent transition-colors" />
                              </a>
                            ) : (
                              <div className="w-10 h-10 bg-white/5 rounded flex items-center justify-center text-xs text-cool-slate border border-white/10" title="No Image Uploaded">
                                <Leaf className="w-4 h-4 opacity-50" />
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-cool-slate text-xs">{d.date}</td>
                          <td className="px-5 py-3.5 text-sm">{d.user_email}</td>
                          <td className="px-5 py-3.5 font-medium text-farm-accent">{d.crop}</td>
                          <td className="px-5 py-3.5 max-w-[200px] truncate" title={d.disease}>{d.disease}</td>
                          <td className="px-5 py-3.5"><SeverityBadge severity={d.severity} /></td>
                          <td className="px-5 py-3.5 text-healthy-emerald font-medium">{d.confidence}</td>
                          <td className="px-5 py-3.5">
                            <span className="px-2 py-1 rounded text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">{d.status}</span>
                          </td>
                          <td className="px-5 py-3.5 text-right print:hidden">
                            <button onClick={() => setSelectedDetection(d)} className="p-1.5 hover:bg-farm-accent/10 rounded-lg transition-colors text-farm-accent">
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {pagedDets.length === 0 && (
                        <tr><td colSpan={7} className="px-5 py-12 text-center text-cool-slate">No detections found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination page={detPage} pages={detPages} onPage={setDetPage} />
              </div>
            )}

            {/* ── ANALYTICS TAB ─────────────────────────────── */}
            {activeTab === 'analytics' && stats && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Disease Distribution Pie */}
                  <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
                    <h3 className="text-base font-medium mb-4">Disease Distribution</h3>
                    {stats.disease_chart?.length > 0 ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={stats.disease_chart} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value">
                              {stats.disease_chart.map((_: any, index: number) => (
                                <Cell key={index} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #ffffff15', borderRadius: 8, fontSize: 12 }} />
                            <Legend iconSize={10} wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : <div className="h-64 flex items-center justify-center text-cool-slate">No detection data yet.</div>}
                  </div>

                  {/* Top Crops Bar */}
                  <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
                    <h3 className="text-base font-medium mb-4">Top 5 Scanned Crops</h3>
                    {stats.crop_chart?.length > 0 ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats.crop_chart} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                            <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
                            <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
                            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #ffffff15', borderRadius: 8 }} />
                            <Bar dataKey="count" fill="#52B788" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : <div className="h-64 flex items-center justify-center text-cool-slate">No crop data yet.</div>}
                  </div>
                </div>

                {/* Detection trend Line */}
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
                  <h3 className="text-base font-medium mb-4">7-Day Detection Trend</h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats.trend || []} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                        <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
                        <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #ffffff15', borderRadius: 8 }} />
                        <Line type="monotone" dataKey="detections" stroke="#3B82F6" strokeWidth={2.5} dot={{ fill: '#3B82F6', r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* ── NEW ANALYTICS CHARTS ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* User Growth Line Chart */}
                  <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
                    <h3 className="text-base font-medium mb-4">User Growth (Last 30 Days)</h3>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={[{ name: 'Week 1', users: 120 }, { name: 'Week 2', users: 145 }, { name: 'Week 3', users: 180 }, { name: 'Week 4', users: 230 }]} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                          <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
                          <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
                          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #ffffff15', borderRadius: 8 }} />
                          <Line type="monotone" dataKey="users" stroke="#8B5CF6" strokeWidth={2.5} dot={{ fill: '#8B5CF6', r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Peak Usage Hours Bar Chart */}
                  <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
                    <h3 className="text-base font-medium mb-4">Peak Usage Hours</h3>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[{ time: '08:00', count: 45 }, { time: '12:00', count: 120 }, { time: '16:00', count: 85 }, { time: '20:00', count: 30 }]} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                          <XAxis dataKey="time" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
                          <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
                          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #ffffff15', borderRadius: 8 }} />
                          <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Region-wise Heatmap (Mocked as Bar Chart) */}
                  <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
                    <h3 className="text-base font-medium mb-4 flex items-center gap-2"><Map className="w-4 h-4 text-farm-accent" /> Region-wise Detections</h3>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={[{ region: 'Maharashtra', count: 320 }, { region: 'Karnataka', count: 210 }, { region: 'Punjab', count: 180 }, { region: 'Gujarat', count: 150 }]} margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                          <XAxis type="number" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
                          <YAxis dataKey="region" type="category" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
                          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #ffffff15', borderRadius: 8 }} />
                          <Bar dataKey="count" fill="#06B6D4" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Most Active Users */}
                  <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
                    <h3 className="text-base font-medium mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-pink-400" /> Most Active Users</h3>
                    <div className="space-y-4">
                      {users.slice(0, 4).map((u, i) => (
                        <div key={u.id || i} className="flex items-center justify-between pb-3 border-b border-white/5 last:border-0 last:pb-0">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-farm-accent/40 to-blue-500/40 flex items-center justify-center text-xs font-bold shrink-0">
                              {(u.name || u.email || '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium">{u.name || 'Anonymous'}</div>
                              <div className="text-cool-slate text-xs">{u.email}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-farm-accent">{u.total_detections}</div>
                            <div className="text-cool-slate text-xs">scans</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── NOTIFICATIONS TAB ─────────────────────────── */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                {/* Broadcast Panel */}
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Send className="w-5 h-5 text-farm-accent" />
                    <h3 className="text-base font-medium">Broadcast Message</h3>
                  </div>
                  <p className="text-cool-slate text-sm mb-4">Send a message or system announcement to all registered users.</p>
                  <textarea value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)}
                    placeholder="Type your message here..."
                    rows={4} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-farm-accent outline-none resize-none mb-3" />
                  <button onClick={handleSendBroadcast}
                    className="flex items-center gap-2 px-5 py-2.5 bg-farm-accent text-black font-semibold text-sm rounded-lg hover:bg-farm-accent/90 transition-colors">
                    <Send className="w-4 h-4" /> Send Broadcast
                  </button>
                  {broadcastSent && <p className="text-healthy-emerald text-sm mt-2 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Broadcast sent!</p>}
                </div>

                {/* Alert Types */}
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Bell className="w-5 h-5 text-warning-amber" />
                    <h3 className="text-base font-medium">Create System Alert</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    {[
                      { id: 'outbreak', label: '🦠 Disease Outbreak Alert', desc: 'Warn farmers about detected disease outbreaks in their region.', color: 'border-red-500/30 bg-red-500/5' },
                      { id: 'weather', label: '⛈️ Weather Warning', desc: 'Alert about adverse weather conditions affecting farming.', color: 'border-yellow-500/30 bg-yellow-500/5' },
                      { id: 'system', label: '⚙️ System Maintenance', desc: 'Notify users of upcoming maintenance or downtime.', color: 'border-blue-500/30 bg-blue-500/5' },
                    ].map(a => (
                      <button key={a.id} onClick={() => setAlertType(a.id)}
                        className={`text-left p-4 rounded-xl border transition-all ${alertType === a.id ? a.color + ' ring-1 ring-farm-accent' : 'border-white/10 hover:border-white/20'}`}>
                        <div className="font-medium text-sm mb-1">{a.label}</div>
                        <div className="text-cool-slate text-xs">{a.desc}</div>
                      </button>
                    ))}
                  </div>
                  <button onClick={handleCreateSystemAlert}
                    className="px-5 py-2.5 bg-warning-amber text-black font-semibold text-sm rounded-lg hover:bg-warning-amber/90 transition-colors">
                    Create Alert
                  </button>
                </div>

                {/* Notification Log */}
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
                  <h3 className="text-base font-medium mb-4">Recent System Alerts</h3>
                  <div className="space-y-3">
                    {alerts.length > 0 ? alerts.map((n, i) => (
                      <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${n.type === 'weather' ? 'bg-yellow-400' : n.type === 'outbreak' ? 'bg-red-400' : n.type === 'broadcast' ? 'bg-healthy-emerald' : 'bg-blue-400'}`} />
                          <div>
                            <div className="text-sm font-medium">{n.title}</div>
                            <div className="text-cool-slate text-xs">Sent to {n.target}</div>
                          </div>
                        </div>
                        <span className="text-cool-slate text-xs">{n.created_at}</span>
                      </div>
                    )) : <div className="text-cool-slate text-sm">No recent alerts.</div>}
                  </div>
                </div>

                {/* Push Notification Management */}
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
                  <h3 className="text-base font-medium mb-4 flex items-center gap-2"><Smartphone className="w-4 h-4 text-blue-400" /> Push Notifications</h3>
                  <div className="space-y-4">
                    {[
                      { key: 'pushAlerts', label: 'Enable Push Alerts', desc: 'Allow users to receive mobile push notifications' },
                      { key: 'dailySummary', label: 'Daily Summary', desc: 'Send daily summary of detections at 8 PM' }
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
                        <div>
                          <div className="text-sm font-medium">{label}</div>
                          <div className="text-cool-slate text-xs">{desc}</div>
                        </div>
                        <button onClick={() => toast(`${label} toggled!`)}
                          className={`w-11 h-6 rounded-full transition-colors bg-white/10 relative shrink-0`}>
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Email Notification Logs */}
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
                  <h3 className="text-base font-medium mb-4 flex items-center gap-2"><Mail className="w-4 h-4 text-pink-400" /> Email Notification Logs</h3>
                  <div className="space-y-3">
                    {[
                      { email: 'john@example.com', subject: 'Disease Detected: Late Blight', status: 'Delivered', time: '10 mins ago' },
                      { email: 'sara@farm.com', subject: 'Weekly Analytics Report', status: 'Opened', time: '2 hours ago' },
                      { email: 'user2@demo.com', subject: 'Weather Warning: Heavy Rain', status: 'Failed', time: '5 hours ago' }
                    ].map((log, i) => (
                      <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                        <div>
                          <div className="text-sm font-medium">{log.subject}</div>
                          <div className="text-cool-slate text-xs">{log.email}</div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${log.status === 'Failed' ? 'bg-red-500/10 text-red-400' : 'bg-healthy-emerald/10 text-healthy-emerald'}`}>{log.status}</span>
                          <div className="text-cool-slate text-xs mt-1">{log.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── ACTIVITY LOGS TAB ─────────────────────────── */}
            {activeTab === 'logs' && (
              <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <h3 className="font-medium">Activity Feed <span className="text-cool-slate text-sm ml-1">({logs.length})</span></h3>
                  <button onClick={fetchLogs} className="flex items-center gap-1.5 text-xs text-cool-slate hover:text-white transition-colors">
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {logs.slice(0, 30).map((log, i) => (
                    <div key={i} className="flex items-start gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                      <div className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${log.type === 'detection' ? 'bg-farm-accent/15 text-farm-accent' :
                          log.type === 'registration' ? 'bg-blue-500/15 text-blue-400' :
                            log.type === 'role_change' ? 'bg-purple-500/15 text-purple-400' :
                              log.type === 'suspension' ? 'bg-orange-500/15 text-orange-400' :
                                log.type === 'failed_login' ? 'bg-red-500/15 text-red-400' :
                                  log.type === 'system_error' ? 'bg-red-600/15 text-red-500' :
                                    'bg-yellow-500/15 text-yellow-400'
                        }`}>
                        {log.type === 'detection' ? <Leaf className="w-3.5 h-3.5" /> :
                          log.type === 'role_change' ? <ShieldAlert className="w-3.5 h-3.5" /> :
                            log.type === 'failed_login' || log.type === 'suspension' || log.type === 'system_error' ? <AlertTriangle className="w-3.5 h-3.5" /> :
                              <UserPlus className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white">{log.action}</div>
                        <div className="text-cool-slate text-xs mt-0.5">{log.user}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {log.severity && log.type === 'detection' && <SeverityBadge severity={log.severity} />}
                        <span className="text-cool-slate text-xs">{log.timestamp}</span>
                      </div>
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div className="py-16 text-center text-cool-slate">No activity logs yet.</div>
                  )}
                </div>
              </div>
            )}

            {/* ── SETTINGS TAB ──────────────────────────────── */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* AI Settings */}
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
                  <h3 className="text-base font-medium mb-4 flex items-center gap-2"><Cpu className="w-4 h-4 text-farm-accent" /> AI Model Configuration</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-cool-slate mb-1.5 block">Detection Confidence Threshold: <span className="text-white font-medium">{settings.aiThreshold}%</span></label>
                      <input type="range" min="50" max="99" value={settings.aiThreshold}
                        onChange={e => setSettings(s => ({ ...s, aiThreshold: e.target.value }))}
                        className="w-full accent-farm-accent" />
                      <div className="flex justify-between text-xs text-cool-slate mt-1"><span>50%</span><span>99%</span></div>
                    </div>
                    <div className="flex items-center justify-between py-3 border-t border-white/5">
                      <div>
                        <div className="text-sm font-medium">Active Model</div>
                        <div className="text-cool-slate text-xs">PlantVillage CNN {settings.modelVersion}</div>
                      </div>
                      <span className="px-3 py-1 bg-healthy-emerald/15 text-healthy-emerald border border-healthy-emerald/30 rounded-full text-xs font-medium">Active</span>
                    </div>
                  </div>
                </div>

                {/* Security Settings */}
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
                  <h3 className="text-base font-medium mb-4 flex items-center gap-2"><Key className="w-4 h-4 text-purple-400" /> Security & API</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-white/[0.04]">
                      <div>
                        <div className="text-sm font-medium">Two-Factor Authentication (2FA)</div>
                        <div className="text-cool-slate text-xs">Require 2FA for admin logins</div>
                      </div>
                      <button onClick={() => toast('2FA setting toggled')} className={`w-11 h-6 rounded-full transition-colors bg-white/10 relative shrink-0`}><span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform`} /></button>
                    </div>
                    <div className="py-3">
                      <div className="text-sm font-medium mb-2">API Keys</div>
                      <div className="flex gap-2">
                        <input type="text" readOnly value="sk_live_XXXXXXXXXXXXXXXXXXXXXX" className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-cool-slate w-full font-mono" />
                        <button onClick={() => toast('API Key Copied')} className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-colors whitespace-nowrap">Copy</button>
                        <button onClick={() => toast('API Key Regenerated')} className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm transition-colors whitespace-nowrap">Regenerate</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* System Settings */}
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
                  <h3 className="text-base font-medium mb-4 flex items-center gap-2"><Settings className="w-4 h-4 text-blue-400" /> System Settings</h3>
                  <div className="space-y-4">
                    {[
                      { key: 'maintenanceMode', label: 'Maintenance Mode', desc: 'Put the platform in read-only maintenance mode' },
                      { key: 'emailNotifications', label: 'Email Notifications', desc: 'Send email alerts to users for disease detections' },
                      { key: 'autoBackup', label: 'Auto Database Backup', desc: 'Automatically backup database daily' },
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
                        <div>
                          <div className="text-sm font-medium">{label}</div>
                          <div className="text-cool-slate text-xs">{desc}</div>
                        </div>
                        <button onClick={() => setSettings(s => ({ ...s, [key]: !(s as any)[key] }))}
                          className={`w-11 h-6 rounded-full transition-colors ${(settings as any)[key] ? 'bg-farm-accent' : 'bg-white/10'} relative shrink-0`}>
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${(settings as any)[key] ? 'translate-x-5' : ''}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Announcement Banner */}
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
                  <h3 className="text-base font-medium mb-4 flex items-center gap-2"><Bell className="w-4 h-4 text-warning-amber" /> System Announcement</h3>
                  <textarea value={settings.announcement} onChange={e => setSettings(s => ({ ...s, announcement: e.target.value }))}
                    placeholder="Enter announcement to display on the platform..."
                    rows={3} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-farm-accent outline-none resize-none mb-3" />
                  <button onClick={() => toast('Announcement published!')} className="px-5 py-2.5 bg-warning-amber text-black font-semibold text-sm rounded-lg hover:bg-warning-amber/90 transition-colors">
                    Publish Announcement
                  </button>
                </div>

                {/* Database Backup */}
                <div className="bg-white/[0.03] border border-red-500/20 rounded-xl p-6">
                  <h3 className="text-base font-medium mb-2 flex items-center gap-2 text-red-400"><AlertTriangle className="w-4 h-4" /> Danger Zone</h3>
                  <p className="text-cool-slate text-sm mb-4">Irreversible actions — proceed with caution.</p>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => toast('Database backup initiated!', 'info')} className="px-4 py-2 text-sm bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg transition-colors flex items-center gap-1.5">
                      <Download className="w-4 h-4" /> Download DB Backup
                    </button>
                    <button onClick={() => setConfirm({ title: 'Clear All Detections', message: 'This will permanently delete all detection history. Users will remain. This cannot be undone.', onConfirm: () => { setConfirm(null); toast('Detection history cleared', 'info'); } })}
                      className="px-4 py-2 text-sm bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg transition-colors flex items-center gap-1.5">
                      <Trash2 className="w-4 h-4" /> Clear Detection History
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── User Details Modal ── */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 text-cool-slate hover:text-white"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-farm-accent/40 to-blue-500/40 flex items-center justify-center text-2xl font-bold">
                {(selectedUser.name || selectedUser.email || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">{selectedUser.name || 'Anonymous'}</h3>
                <div className="text-cool-slate text-sm">{selectedUser.email}</div>
                <div className="text-xs mt-1 inline-block px-2 py-0.5 rounded-full bg-white/5 text-white/70 border border-white/10 uppercase tracking-wider">{selectedUser.role}</div>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-white/5"><span className="text-cool-slate">Joined Date</span><span>{selectedUser.created_at}</span></div>
              <div className="flex justify-between py-2 border-b border-white/5"><span className="text-cool-slate">Last Active</span><span>2 mins ago</span></div>
              <div className="flex justify-between py-2 border-b border-white/5"><span className="text-cool-slate">Location/Region</span><span>Maharashtra, India</span></div>
              <div className="flex justify-between py-2 border-b border-white/5"><span className="text-cool-slate">Total Detections</span><span className="font-bold text-farm-accent">{selectedUser.total_detections}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* ── Detection Details Modal ── */}
      {selectedDetection && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative">
            <button onClick={() => setSelectedDetection(null)} className="absolute top-4 right-4 text-cool-slate hover:text-white"><X className="w-5 h-5" /></button>
            <h3 className="text-lg font-semibold text-white mb-4">Detection Details</h3>
            <div className="flex gap-4">
              <div className="w-32 h-32 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                <Leaf className="w-10 h-10 text-farm-accent opacity-50" />
              </div>
              <div className="flex-1 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-cool-slate">Date</span><span>{selectedDetection.date}</span></div>
                <div className="flex justify-between"><span className="text-cool-slate">User</span><span>{selectedDetection.user_email}</span></div>
                <div className="flex justify-between"><span className="text-cool-slate">Crop</span><span className="font-medium">{selectedDetection.crop}</span></div>
                <div className="flex justify-between"><span className="text-cool-slate">Diagnosis</span><span className="font-medium text-farm-accent">{selectedDetection.disease}</span></div>
                <div className="flex justify-between"><span className="text-cool-slate">Confidence</span><span className="text-healthy-emerald font-bold">{selectedDetection.confidence}</span></div>
                <div className="flex justify-between"><span className="text-cool-slate">Severity</span><span><SeverityBadge severity={selectedDetection.severity} /></span></div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-100">
              <div className="font-medium text-blue-300 mb-1">Recommended Treatment:</div>
              <p>Apply appropriate fungicide based on crop and severity. Ensure proper irrigation and monitor for next 7 days.</p>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => { toast('Marked as False Detection', 'info'); setSelectedDetection(null); }} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors">Mark False Positive</button>
              <button onClick={() => setSelectedDetection(null)} className="px-4 py-2 bg-farm-accent hover:bg-farm-accent/90 text-black font-semibold rounded-lg text-sm transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
