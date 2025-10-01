import { useState, useEffect } from 'react';
import { mockApi } from '../api/mockApi';
import { User, Package, Locker, Session } from '../types';
import {
  Package as PackageIcon,
  Users,
  Box,
  Activity,
  TrendingUp,
  Download,
  Search,
  Filter,
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, packagesRes, lockersRes, sessionsRes] = await Promise.all([
        mockApi.users.getAll(),
        mockApi.packages.getAll(),
        mockApi.lockers.getAll(),
        mockApi.sessions.getAll(),
      ]);

      if (usersRes.success) setUsers(usersRes.data!);
      if (packagesRes.success) setPackages(packagesRes.data!);
      if (lockersRes.success) setLockers(lockersRes.data!);
      if (sessionsRes.success) setSessions(sessionsRes.data!);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalUsers: users.length,
    totalPackages: packages.length,
    totalLockers: lockers.length,
    activeSessions: sessions.filter(s => s.status === 'active').length,
    availableLockers: lockers.filter(l => l.status === 'available').length,
    deliveredPackages: packages.filter(p => p.status === 'delivered').length,
  };

  const packageStatusData = {
    labels: ['Queued', 'Assigned', 'Delivered', 'Picked Up'],
    datasets: [
      {
        data: [
          packages.filter(p => p.status === 'queued').length,
          packages.filter(p => p.status === 'assigned').length,
          packages.filter(p => p.status === 'delivered').length,
          packages.filter(p => p.status === 'picked_up').length,
        ],
        backgroundColor: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B'],
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  const lockerUtilizationData = {
    labels: ['Available', 'Occupied', 'Maintenance'],
    datasets: [
      {
        data: [
          lockers.filter(l => l.status === 'available').length,
          lockers.filter(l => l.status === 'occupied').length,
          lockers.filter(l => l.status === 'maintenance').length,
        ],
        backgroundColor: ['#10B981', '#3B82F6', '#EF4444'],
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  const userRoleData = {
    labels: ['Admins', 'Couriers', 'Users'],
    datasets: [
      {
        label: 'User Distribution',
        data: [
          users.filter(u => u.role === 'admin').length,
          users.filter(u => u.role === 'courier').length,
          users.filter(u => u.role === 'user').length,
        ],
        backgroundColor: ['#8B5CF6', '#3B82F6', '#10B981'],
      },
    ],
  };

  const sessionActivityData = {
    labels: ['Pickup', 'Delivery', 'Access'],
    datasets: [
      {
        label: 'Session Types',
        data: [
          sessions.filter(s => s.session_type === 'pickup').length,
          sessions.filter(s => s.session_type === 'delivery').length,
          sessions.filter(s => s.session_type === 'access').length,
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
      },
    ],
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Locker System Dashboard Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

    doc.setFontSize(14);
    doc.text('Statistics Overview', 14, 45);

    autoTable(doc, {
      startY: 50,
      head: [['Metric', 'Value']],
      body: [
        ['Total Users', stats.totalUsers.toString()],
        ['Total Packages', stats.totalPackages.toString()],
        ['Total Lockers', stats.totalLockers.toString()],
        ['Active Sessions', stats.activeSessions.toString()],
        ['Available Lockers', stats.availableLockers.toString()],
        ['Delivered Packages', stats.deliveredPackages.toString()],
      ],
    });

    const finalY = (doc as any).lastAutoTable.finalY || 100;

    doc.setFontSize(14);
    doc.text('Recent Packages', 14, finalY + 15);

    autoTable(doc, {
      startY: finalY + 20,
      head: [['Tracking #', 'Recipient', 'Status', 'Size']],
      body: packages.slice(0, 10).map(p => [
        p.tracking_number,
        p.recipient_name,
        p.status,
        p.size,
      ]),
    });

    doc.save('locker-dashboard-report.pdf');
    toast.success('PDF report downloaded');
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    const statsWS = XLSX.utils.json_to_sheet([
      { Metric: 'Total Users', Value: stats.totalUsers },
      { Metric: 'Total Packages', Value: stats.totalPackages },
      { Metric: 'Total Lockers', Value: stats.totalLockers },
      { Metric: 'Active Sessions', Value: stats.activeSessions },
      { Metric: 'Available Lockers', Value: stats.availableLockers },
      { Metric: 'Delivered Packages', Value: stats.deliveredPackages },
    ]);
    XLSX.utils.book_append_sheet(wb, statsWS, 'Statistics');

    const packagesWS = XLSX.utils.json_to_sheet(
      packages.map(p => ({
        'Tracking Number': p.tracking_number,
        'Recipient': p.recipient_name,
        'Status': p.status,
        'Size': p.size,
        'Created': new Date(p.created_at).toLocaleDateString(),
      }))
    );
    XLSX.utils.book_append_sheet(wb, packagesWS, 'Packages');

    const lockersWS = XLSX.utils.json_to_sheet(
      lockers.map(l => ({
        'Locker Number': l.locker_number,
        'Size': l.size,
        'Status': l.status,
        'Location': l.location,
      }))
    );
    XLSX.utils.book_append_sheet(wb, lockersWS, 'Lockers');

    XLSX.writeFile(wb, 'locker-dashboard-report.xlsx');
    toast.success('Excel report downloaded');
  };

  const filteredPackages = packages.filter(p => {
    const matchesSearch = p.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.recipient_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your automated locker system</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Excel
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={<Users className="w-6 h-6" />}
            title="Total Users"
            value={stats.totalUsers}
            color="blue"
          />
          <StatCard
            icon={<PackageIcon className="w-6 h-6" />}
            title="Total Packages"
            value={stats.totalPackages}
            color="purple"
          />
          <StatCard
            icon={<Box className="w-6 h-6" />}
            title="Available Lockers"
            value={stats.availableLockers}
            color="green"
          />
          <StatCard
            icon={<Activity className="w-6 h-6" />}
            title="Active Sessions"
            value={stats.activeSessions}
            color="orange"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            title="Delivered Packages"
            value={stats.deliveredPackages}
            color="emerald"
          />
          <StatCard
            icon={<Box className="w-6 h-6" />}
            title="Total Lockers"
            value={stats.totalLockers}
            color="indigo"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Package Status Distribution</h3>
            <div className="h-64 flex items-center justify-center">
              <Pie data={packageStatusData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Locker Utilization</h3>
            <div className="h-64 flex items-center justify-center">
              <Pie data={lockerUtilizationData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">User Role Distribution</h3>
            <div className="h-64">
              <Bar data={userRoleData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Session Activity</h3>
            <div className="h-64">
              <Line data={sessionActivityData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h3 className="text-xl font-bold text-gray-900">Package Management</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search packages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="all">All Status</option>
                  <option value="queued">Queued</option>
                  <option value="assigned">Assigned</option>
                  <option value="delivered">Delivered</option>
                  <option value="picked_up">Picked Up</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tracking #</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Recipient</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Size</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredPackages.map((pkg) => (
                  <tr key={pkg.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{pkg.tracking_number}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{pkg.recipient_name}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(pkg.status)}`}>
                        {pkg.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700 capitalize">{pkg.size}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {new Date(pkg.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, color }: { icon: React.ReactNode; title: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    indigo: 'bg-indigo-100 text-indigo-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 transition-transform hover:scale-105">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    queued: 'bg-blue-100 text-blue-700',
    assigned: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    picked_up: 'bg-orange-100 text-orange-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}
