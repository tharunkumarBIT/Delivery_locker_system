import { useState, useEffect } from 'react';
import { mockApi } from '../api/mockApi';
import { Package, Locker } from '../types';
import { useAppSelector } from '../store/hooks';
import { Truck, Package as PackageIcon, MapPin, CheckCircle, Box } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CourierDashboard() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [selectedLocker, setSelectedLocker] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [packagesRes, lockersRes] = await Promise.all([
        mockApi.courier.getDeliveryList(),
        mockApi.lockers.getAll(),
      ]);

      if (packagesRes.success) {
        setPackages(packagesRes.data!);
      }
      if (lockersRes.success) {
        setLockers(lockersRes.data!);
      }
    } catch (error) {
      toast.error('Failed to load delivery data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignLocker = async () => {
    if (!selectedPackage || !selectedLocker || !user) {
      toast.error('Please select a package and locker');
      return;
    }

    try {
      const response = await mockApi.packages.assignLocker(selectedPackage, selectedLocker, user.id);
      if (response.success) {
        toast.success('Locker assigned successfully!');
        setSelectedPackage(null);
        setSelectedLocker('');
        loadData();
      } else {
        toast.error(response.error || 'Failed to assign locker');
      }
    } catch (error) {
      toast.error('Failed to assign locker');
    }
  };

  const handleMarkDelivered = async (packageId: string) => {
    try {
      const response = await mockApi.packages.markDelivered(packageId);
      if (response.success) {
        toast.success('Package marked as delivered!');
        loadData();
      } else {
        toast.error(response.error || 'Failed to mark as delivered');
      }
    } catch (error) {
      toast.error('Failed to mark as delivered');
    }
  };

  const queuedPackages = packages.filter(p => p.status === 'queued');
  const assignedPackages = packages.filter(p => p.status === 'assigned');
  const availableLockers = lockers.filter(l => l.status === 'available');

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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Courier Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage deliveries and locker assignments</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Pending Assignments</p>
                <p className="text-4xl font-bold mt-2">{queuedPackages.length}</p>
              </div>
              <PackageIcon className="w-12 h-12 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Out for Delivery</p>
                <p className="text-4xl font-bold mt-2">{assignedPackages.length}</p>
              </div>
              <Truck className="w-12 h-12 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Available Lockers</p>
                <p className="text-4xl font-bold mt-2">{availableLockers.length}</p>
              </div>
              <Box className="w-12 h-12 text-green-200" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Pending Assignments</h2>
            {queuedPackages.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <PackageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No pending assignments</p>
              </div>
            ) : (
              <div className="space-y-4">
                {queuedPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`bg-white rounded-xl shadow-md p-6 cursor-pointer transition-all ${
                      selectedPackage === pkg.id ? 'ring-2 ring-blue-500' : 'hover:shadow-lg'
                    }`}
                    onClick={() => setSelectedPackage(pkg.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900">{pkg.tracking_number}</h3>
                        <p className="text-sm text-gray-600 mt-1">{pkg.description || 'No description'}</p>
                      </div>
                      {selectedPackage === pkg.id && (
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>To: {pkg.recipient_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Box className="w-4 h-4 text-gray-400" />
                        <span className="capitalize">Size: {pkg.size}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Assign Locker</h2>
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Select Available Locker</h3>
              {availableLockers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No available lockers</p>
              ) : (
                <div className="space-y-2 mb-4">
                  {availableLockers.map((locker) => (
                    <label
                      key={locker.id}
                      className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedLocker === locker.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="locker"
                          value={locker.id}
                          checked={selectedLocker === locker.id}
                          onChange={(e) => setSelectedLocker(e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{locker.locker_number}</p>
                          <p className="text-sm text-gray-600">{locker.location}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full capitalize">
                        {locker.size}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              <button
                onClick={handleAssignLocker}
                disabled={!selectedPackage || !selectedLocker}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Assign Locker
              </button>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Out for Delivery</h2>
            {assignedPackages.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No packages out for delivery</p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignedPackages.map((pkg) => (
                  <div key={pkg.id} className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-gray-900">{pkg.tracking_number}</h3>
                        <p className="text-sm text-gray-600 mt-1">{pkg.description || 'No description'}</p>
                      </div>
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                        Assigned
                      </span>
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>To: {pkg.recipient_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Box className="w-4 h-4 text-gray-400" />
                        <span className="capitalize">Size: {pkg.size}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleMarkDelivered(pkg.id)}
                      className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      Mark as Delivered
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
