import { useState, useEffect } from 'react';
import { mockApi } from '../api/mockApi';
import { Package } from '../types';
import { useAppSelector } from '../store/hooks';
import { Package as PackageIcon, Clock, CheckCircle, MapPin, Scan } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UserDashboard() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      if (!user) return;
      const response = await mockApi.packages.getMy(user.id);
      if (response.success) {
        setPackages(response.data!);
      }
    } catch (error) {
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const handlePickup = async (packageId: string) => {
    try {
      if (!user) return;
      const response = await mockApi.packages.pickup(packageId, user.id);
      if (response.success) {
        toast.success('Package picked up successfully!');
        loadPackages();
      } else {
        toast.error(response.error || 'Failed to pickup package');
      }
    } catch (error) {
      toast.error('Failed to pickup package');
    }
  };

  const activePackages = packages.filter(p => p.status !== 'picked_up');
  const historyPackages = packages.filter(p => p.status === 'picked_up');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">My Packages</h1>
          <p className="text-gray-600 mt-2">Track and manage your deliveries</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Active Packages</p>
                <p className="text-4xl font-bold mt-2">{activePackages.length}</p>
              </div>
              <PackageIcon className="w-12 h-12 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Ready for Pickup</p>
                <p className="text-4xl font-bold mt-2">
                  {packages.filter(p => p.status === 'delivered').length}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Total Received</p>
                <p className="text-4xl font-bold mt-2">{historyPackages.length}</p>
              </div>
              <Clock className="w-12 h-12 text-purple-200" />
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Active Deliveries</h2>
          {activePackages.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <PackageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No active packages</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activePackages.map((pkg) => (
                <PackageCard key={pkg.id} package={pkg} onPickup={handlePickup} />
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Delivery History</h2>
          {historyPackages.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No delivery history</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tracking #</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Description</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Size</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Picked Up</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyPackages.map((pkg) => (
                      <tr key={pkg.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">{pkg.tracking_number}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{pkg.description || 'N/A'}</td>
                        <td className="py-3 px-4 text-sm text-gray-700 capitalize">{pkg.size}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {pkg.picked_up_at ? new Date(pkg.picked_up_at).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PackageCard({ package: pkg, onPickup }: { package: Package; onPickup: (id: string) => void }) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <PackageIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{pkg.tracking_number}</h3>
              <p className="text-sm text-gray-600">{pkg.description || 'No description'}</p>
            </div>
          </div>
          <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusStyle(pkg.status)}`}>
            {pkg.status}
          </span>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="capitalize">Size: {pkg.size}</span>
          </div>

          {pkg.locker_id && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Scan className="w-4 h-4 text-gray-400" />
              <span>Locker Assigned</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>Created: {new Date(pkg.created_at).toLocaleDateString()}</span>
          </div>

          {pkg.delivered_at && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Delivered: {new Date(pkg.delivered_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {pkg.status === 'delivered' && (
          <button
            onClick={() => onPickup(pkg.id)}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            Pick Up Package
          </button>
        )}

        {pkg.status === 'queued' && (
          <div className="text-center py-2 bg-blue-50 rounded-lg text-blue-700 text-sm font-medium">
            Awaiting locker assignment
          </div>
        )}

        {pkg.status === 'assigned' && (
          <div className="text-center py-2 bg-purple-50 rounded-lg text-purple-700 text-sm font-medium">
            Out for delivery
          </div>
        )}
      </div>
    </div>
  );
}

function getStatusStyle(status: string): string {
  const styles: Record<string, string> = {
    queued: 'bg-blue-100 text-blue-700',
    assigned: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    picked_up: 'bg-orange-100 text-orange-700',
  };
  return styles[status] || 'bg-gray-100 text-gray-700';
}
