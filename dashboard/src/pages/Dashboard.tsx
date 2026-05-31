import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  FolderKanban, 
  ClipboardList, 
  Settings, 
  TrendingUp, 
  TrendingDown,
  Activity,
  ChevronRight,
  Plus,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

type MonthlyDataPoint = {
  name: string;
  demandes: number;
  projets: number;
};

type StatusDataPoint = {
  name: string;
  value: number;
  color: string;
};

type DashboardStatsResponse = {
  clients: number;
  projets: number;
  demandes: number;
  services: number;
};

type MonthlyApiItem = {
  month: string;
  demandes: number;
  projets: number;
};

type StatusApiItem = {
  name: string;
  value: number;
};

type TooltipPayloadItem = {
  color?: string;
  name?: string;
  value?: number | string;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
};

// ---------- Fallback data (empty) ----------
const fallbackMonthlyData: MonthlyDataPoint[] = [
  { name: 'Jan', demandes: 0, projets: 0 },
  { name: 'Fév', demandes: 0, projets: 0 },
  { name: 'Mar', demandes: 0, projets: 0 },
  { name: 'Avr', demandes: 0, projets: 0 },
  { name: 'Mai', demandes: 0, projets: 0 },
  { name: 'Juin', demandes: 0, projets: 0 },
  { name: 'Juil', demandes: 0, projets: 0 },
  { name: 'Aoû', demandes: 0, projets: 0 },
  { name: 'Sep', demandes: 0, projets: 0 },
  { name: 'Oct', demandes: 0, projets: 0 },
  { name: 'Nov', demandes: 0, projets: 0 },
  { name: 'Déc', demandes: 0, projets: 0 },
];

const fallbackStatusData: StatusDataPoint[] = [
  { name: 'En attente', value: 0, color: '#f6b718' },
  { name: 'Approuvé', value: 0, color: '#4875bd' },
  { name: 'Rejeté', value: 0, color: '#ad2324' },
  { name: 'En cours', value: 0, color: '#193d71' },
];

const recentActivities = [
  { id: 1, client: 'TechCorp', type: 'Demande', status: 'En attente', date: '2025-05-25' },
  { id: 2, client: 'DesignStudio', type: 'Projet', status: 'Approuvé', date: '2025-05-24' },
  { id: 3, client: 'StartupX', type: 'Service', status: 'En cours', date: '2025-05-23' },
  { id: 4, client: 'AgencyY', type: 'Demande', status: 'Approuvé', date: '2025-05-22' },
  { id: 5, client: 'InnovateLabs', type: 'Projet', status: 'Rejeté', date: '2025-05-21' },
];

// ---------- StatCard with custom color schemes ----------
const StatCard = ({ title, value, icon, trend, trendValue, colorScheme }: { 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  trend: 'up' | 'down';
  trendValue: string;
  colorScheme: 'navy' | 'blue' | 'gold' | 'red';
}) => {
  const schemes = {
    navy: { bg: '#ffffff', accent: '#2e7d32', trendBg: '#2e7d32', trendText: '#ffffff', iconBg: '#dddee0', iconColor: '#2e7d32' },
    blue: { bg: '#ffffff', accent: '#4875bd', trendBg: '#4875bd', trendText: '#ffffff', iconBg: '#dddee0', iconColor: '#4875bd' },
    gold: { bg: '#ffffff', accent: '#f6b718', trendBg: '#f6b718', trendText: '#193d71', iconBg: '#dddee0', iconColor: '#f6b718' },
    red: { bg: '#ffffff', accent: '#ad2324', trendBg: '#ad2324', trendText: '#ffffff', iconBg: '#dddee0', iconColor: '#ad2324' },
  };
  const scheme = schemes[colorScheme];

  return (
    <div className="group relative overflow-hidden rounded-2xl shadow-lg transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl" style={{ backgroundColor: scheme.bg }}>
      <div className="absolute -right-12 -top-12 h-24 w-24 rotate-45 transition-all duration-300 group-hover:scale-150" style={{ backgroundColor: `${scheme.accent}20` }} />
      <div className="absolute -bottom-16 -left-16 h-32 w-32 rounded-full blur-2xl" style={{ backgroundColor: `${scheme.accent}10` }} />
      
      <div className="relative p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="rounded-xl p-3 transition-all duration-300 group-hover:scale-110" style={{ backgroundColor: scheme.iconBg, color: scheme.iconColor }}>
            {icon}
          </div>
          <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold`} style={{ backgroundColor: `${scheme.accent}20`, color: scheme.accent }}>
            {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{trendValue}</span>
          </div>
        </div>
        <p className="text-sm font-medium uppercase tracking-wider text-gray-500">{title}</p>
        <h3 className="mt-2 text-4xl font-black" style={{ color: scheme.accent }}>{value.toLocaleString()}</h3>
        <div className="mt-4 h-0.5 w-12 transition-all duration-300 group-hover:w-full" style={{ backgroundColor: scheme.accent }} />
      </div>
    </div>
  );
};

// Elegant QuickActionCard - with new 'green' color
const QuickActionCard = ({ title, description, icon, onClick, color }: {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  color: 'blue' | 'yellow' | 'red' | 'green';
}) => {
  const colorConfig = {
    blue: { bg: '#4875bd', hover: '#193d71', text: 'white', light: '#4875bd15', gradientFrom: '#4875bd', gradientTo: '#4875bd' },
    yellow: { bg: '#f6b718', hover: '#d49a0c', text: '#193d71', light: '#f6b71815', gradientFrom: '#f6b718', gradientTo: '#f6b718' },
    red: { bg: '#ad2324', hover: '#8a1b1c', text: 'white', light: '#ad232415', gradientFrom: '#ad2324', gradientTo: '#ad2324' },
    green: { bg: '#2e7d32', hover: '#1b5e20', text: 'white', light: '#2e7d3215', gradientFrom: '#2e7d32', gradientTo: '#2e7d32' },
  };
  const config = colorConfig[color];

  return (
    <div 
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      style={{ borderTop: `3px solid ${config.bg}` }}
    >
      <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-10" style={{ background: `linear-gradient(135deg, ${config.gradientFrom}, ${config.gradientTo})` }} />
      
      <div className="relative flex flex-col items-center text-center">
        <div 
          className="rounded-2xl p-3 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md"
          style={{ backgroundColor: config.light, color: config.bg }}
        >
          {icon}
        </div>
        <h3 className="mt-3 font-bold text-[#193d71] group-hover:text-[#4875bd]">{title}</h3>
        <p className="mt-1 text-xs text-gray-500">{description}</p>
        <div className="mt-3 flex items-center text-xs font-semibold opacity-0 transition-all group-hover:opacity-100">
          <span style={{ color: config.bg }}>Démarrer</span>
          <ArrowUpRight size={14} className="ml-1" style={{ color: config.bg }} />
        </div>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-[#dddee0] bg-white p-4 shadow-xl backdrop-blur-sm">
        <p className="font-black text-[#193d71]">{label}</p>
        {payload.map((p, idx) => (
          <p key={idx} className="mt-1 text-sm font-medium" style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ---------- Main Dashboard Component ----------
const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    clients: 0,
    projets: 0,
    demandes: 0,
    services: 0,
  });
  const [monthlyData, setMonthlyData] = useState(fallbackMonthlyData);
  const [statusData, setStatusData] = useState(fallbackStatusData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const clientId = localStorage.getItem("userId");
        
        const statsRes = await fetch(`http://localhost:8080/api/dashboard/stats/${clientId}`);
        const statsData: DashboardStatsResponse = await statsRes.json();
        setStats({
          clients: statsData.clients,
          projets: statsData.projets,
          demandes: statsData.demandes,
          services: statsData.services,
        });
        
        const monthlyRes = await fetch(`http://localhost:8080/api/dashboard/monthly`);
        const monthly: MonthlyApiItem[] = await monthlyRes.json();
        if (monthly && monthly.length > 0) {
          const transformedMonthly = monthly.map((item) => ({
            name: item.month,
            demandes: item.demandes,
            projets: item.projets
          }));
          setMonthlyData(transformedMonthly);
        }
        
        const statusRes = await fetch(`http://localhost:8080/api/dashboard/status`);
        const status: StatusApiItem[] = await statusRes.json();
        if (status && status.length > 0) {
          const statusMapping: { [key: string]: { name: string; color: string } } = {
            'EN_ATTENTE': { name: 'En attente', color: '#f6b718' },
            'VALIDEE': { name: 'Approuvé', color: '#4875bd' },
            'REJETEE': { name: 'Rejeté', color: '#ad2324' },
            'EN_COURS': { name: 'En cours', color: '#193d71' },
          };
          
          const transformedStatus = status.map((item) => {
            const mapping = statusMapping[item.name] || { name: item.name, color: '#6b7280' };
            return {
              name: mapping.name,
              value: item.value,
              color: mapping.color
            };
          });
          setStatusData(transformedStatus);
        }
        
      } catch (error) {
        console.error("Erreur dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  // Navigation handlers for quick action cards
  const handleNewClient = () => navigate('/clients/new');
  const handleNewProject = () => navigate('/projets/new');
  const handleViewDemandes = () => navigate('/demandes');

  // Navigation handler for "Nouveau rapport" button
  const handleNewReport = () => navigate('/rapports/new');

  // Navigation handlers for activities table
  const handleViewAllActivities = () => navigate('/activites');
  const handleViewActivityDetails = (activityId: number, type: string) => {
    if (type === 'Demande') {
      navigate(`/demandes/${activityId}`);
    } else if (type === 'Projet') {
      navigate(`/projets/${activityId}`);
    } else if (type === 'Service') {
      navigate(`/services/${activityId}`);
    } else {
      navigate(`/activite/${activityId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-[#4875bd] border-t-transparent"></div>
          <p className="text-gray-500">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#dddee0' }}>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Page Header */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles size={28} className="text-[#f6b718]" />
                <h1 className="text-4xl font-black tracking-tight text-[#193d71]">Tableau de bord</h1>
              </div>
              <div className="mt-2 h-1 w-24 rounded-full bg-[#f6b718]" />
              <div className="mt-1 h-0.5 w-16 rounded-full bg-[#4875bd]" />
              <p className="mt-4 text-gray-600">
                Bienvenue ! Voici un aperçu de votre activité récente.
              </p>
            </div>
            <button 
              onClick={handleNewReport}
              className="group flex items-center gap-2 rounded-full bg-[#193d71] px-6 py-3 font-bold text-white shadow-lg transition-all duration-300 hover:bg-[#4875bd] hover:shadow-xl"
            >
              <Plus size={18} className="transition-transform group-hover:rotate-90" /> 
              Nouveau rapport
            </button>
          </div>

          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Clients"
              value={stats.clients}
              icon={<Users size={24} />}
              trend="up"
              trendValue="+12%"
              colorScheme="navy"
            />
            <StatCard
              title="Projets"
              value={stats.projets}
              icon={<FolderKanban size={24} />}
              trend="up"
              trendValue="+8%"
              colorScheme="blue"
            />
            <StatCard
              title="Demandes"
              value={stats.demandes}
              icon={<ClipboardList size={24} />}
              trend="up"
              trendValue="+23%"
              colorScheme="gold"
            />
            <StatCard
              title="Services"
              value={stats.services}
              icon={<Settings size={24} />}
              trend="up"
              trendValue="+5%"
              colorScheme="red"
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Bar Chart */}
            <div className="relative overflow-hidden rounded-3xl border border-white/50 bg-white p-6 shadow-xl backdrop-blur-sm transition-all duration-300 hover:shadow-2xl">
              <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#f6b718]/5 blur-2xl" />
              <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-[#4875bd]/5 blur-2xl" />
              
              <div className="relative mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-[#193d71]">Activité mensuelle</h2>
                  <p className="text-sm text-gray-500">Demandes vs Projets</p>
                </div>
                <div className="rounded-2xl bg-[#dddee0] p-3 text-[#4875bd]">
                  <BarChart3 size={20} />
                </div>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dddee0" />
                  <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: '#dddee0' }} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f6b71810' }} />
                  <Legend wrapperStyle={{ paddingTop: 16 }} />
                  <Bar dataKey="demandes" fill="#4875bd" name="Demandes" radius={[8, 8, 0, 0]} barSize={40} />
                  <Bar dataKey="projets" fill="#2e7d32" name="Projets" radius={[8, 8, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart */}
            <div className="relative overflow-hidden rounded-3xl border border-white/50 bg-white p-6 shadow-xl backdrop-blur-sm transition-all duration-300 hover:shadow-2xl">
              <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#ad2324]/5 blur-2xl" />
              <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-[#193d71]/5 blur-2xl" />
              
              <div className="relative mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-[#193d71]">État des demandes</h2>
                  <p className="text-sm text-gray-500">Répartition par statut</p>
                </div>
                <div className="rounded-2xl bg-[#dddee0] p-3 text-[#4875bd]">
                  <PieChartIcon size={20} />
                </div>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => {
                      if (!name || percent === undefined) return '';
                      return `${name} ${(percent * 100).toFixed(0)}%`;
                    }}
                    labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={3} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activities & Quick Actions */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            {/* Activities Table */}
            <div className="xl:col-span-2">
              <div className="overflow-hidden rounded-3xl border border-white/50 bg-white shadow-xl transition-all duration-300 hover:shadow-2xl">
                <div className="border-b border-[#dddee0] bg-gradient-to-r from-white to-[#dddee0]/30 px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-black text-[#193d71]">Activités récentes</h2>
                      <p className="text-sm text-gray-500">Dernières demandes et projets</p>
                    </div>
                    <button 
                      onClick={handleViewAllActivities}
                      className="flex items-center gap-1 rounded-full bg-[#193d71] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#4875bd]"
                    >
                      Voir tout <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-[#dddee0]/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#193d71]">Client</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#193d71]">Type</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#193d71]">Statut</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#193d71]">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#193d71]"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dddee0]">
                      {recentActivities.map((activity) => (
                        <tr key={activity.id} className="group transition-all duration-200 hover:bg-[#dddee0]/30">
                          <td className="whitespace-nowrap px-6 py-4 font-bold text-[#193d71]">{activity.client}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-gray-600">{activity.type}</td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold
                              ${activity.status === 'Approuvé' ? 'bg-[#4875bd]/20 text-[#4875bd]' : ''}
                              ${activity.status === 'En attente' ? 'bg-[#f6b718]/20 text-[#f6b718]' : ''}
                              ${activity.status === 'En cours' ? 'bg-[#2e7d32]/20 text-[#2e7d32]' : ''}
                              ${activity.status === 'Rejeté' ? 'bg-[#ad2324]/20 text-[#ad2324]' : ''}
                            `}>
                              {activity.status}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{activity.date}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-right">
                            <button 
                              onClick={() => handleViewActivityDetails(activity.id, activity.type)}
                              className="rounded-full bg-[#dddee0] px-4 py-1.5 text-xs font-bold text-[#193d71] opacity-0 transition-all group-hover:opacity-100 hover:bg-[#f6b718] hover:text-white"
                            >
                              Détails
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions - Horizontal */}
              <div className="rounded-3xl border border-white/50 bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center gap-2">
                  <Calendar size={20} className="text-[#f6b718]" />
                  <h3 className="text-lg font-black text-[#193d71]">Actions rapides</h3>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <QuickActionCard
                    title="Nouveau client"
                    description="Ajouter un client"
                    icon={<Users size={18} />}
                    onClick={handleNewClient}
                    color="blue"
                  />
                  <QuickActionCard
                    title="Nouveau projet"
                    description="Créer un projet"
                    icon={<FolderKanban size={18} />}
                    onClick={handleNewProject}
                    color="yellow"
                  />
                  <QuickActionCard
                    title="Voir demandes"
                    description="Gérer les demandes"
                    icon={<ClipboardList size={18} />}
                    onClick={handleViewDemandes}
                    color="green"
                  />
                </div>
              </div>

              {/* Conversion card */}
              <div className="relative overflow-hidden rounded-3xl p-6 shadow-xl" style={{ background: 'linear-gradient(135deg, #193d71 0%, #4875bd 100%)' }}>
                <div className="absolute -right-8 -top-8 h-32 w-32 rotate-12 bg-white/10" />
                <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
                
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-wider text-white/80">Taux de conversion</p>
                    <p className="mt-2 text-4xl font-black text-white">68%</p>
                    <div className="mt-3 flex items-center gap-1 rounded-full bg-[#f6b718]/30 px-2 py-0.5 text-xs font-bold text-white backdrop-blur-sm">
                      <TrendingUp size={12} /> +5% vs mois dernier
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-sm">
                    <Activity size={28} className="text-[#f6b718]" />
                  </div>
                </div>
                <div className="mt-5 h-1.5 w-full rounded-full bg-white/30">
                  <div className="h-1.5 w-[68%] rounded-full bg-[#f6b718]" />
                </div>
              </div>

              {/* Mini insight card */}
              <div className="flex items-center gap-4 rounded-2xl border border-[#f6b718]/30 bg-white p-5 shadow-md">
                <div className="rounded-xl bg-[#f6b718]/20 p-3 text-[#f6b718]">
                  <Sparkles size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#4875bd]">Bon à savoir</p>
                  <p className="text-sm font-medium text-gray-600">+32% de demandes ce trimestre</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
