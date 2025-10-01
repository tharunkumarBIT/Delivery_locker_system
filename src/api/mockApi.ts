import {
  User,
  Package,
  Locker,
  Session,
  PickupLog,
  AssignmentLog,
  LoginCredentials,
  RegisterData,
  ApiResponse,
  UserRole,
  LockerSize,
} from '../types';
import {
  mockUsers,
  mockPackages,
  mockLockers,
  mockSessions,
  mockPickupLogs,
  mockAssignmentLogs,
} from './mockData';

let users = [...mockUsers];
let packages = [...mockPackages];
let lockers = [...mockLockers];
let sessions = [...mockSessions];
let pickupLogs = [...mockPickupLogs];
let assignmentLogs = [...mockAssignmentLogs];
let currentUser: User | null = null;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateId = () => Math.random().toString(36).substr(2, 9);

export const mockApi = {
  auth: {
    register: async (data: RegisterData): Promise<ApiResponse<User>> => {
      await delay(500);

      if (users.find(u => u.email === data.email)) {
        return { success: false, error: 'User already exists' };
      }

      const newUser: User = {
        id: generateId(),
        email: data.email,
        full_name: data.full_name,
        phone: data.phone,
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      users.push(newUser);
      currentUser = newUser;
      localStorage.setItem('currentUser', JSON.stringify(newUser));

      return { success: true, data: newUser };
    },

    login: async (credentials: LoginCredentials): Promise<ApiResponse<User>> => {
      await delay(500);

      const user = users.find(u => u.email === credentials.email);

      if (!user) {
        return { success: false, error: 'Invalid credentials' };
      }

      currentUser = user;
      localStorage.setItem('currentUser', JSON.stringify(user));

      return { success: true, data: user };
    },

    logout: async (): Promise<ApiResponse<void>> => {
      await delay(300);
      currentUser = null;
      localStorage.removeItem('currentUser');
      return { success: true };
    },

    getCurrentUser: async (): Promise<ApiResponse<User>> => {
      await delay(200);

      if (!currentUser) {
        const stored = localStorage.getItem('currentUser');
        if (stored) {
          currentUser = JSON.parse(stored);
        }
      }

      if (!currentUser) {
        return { success: false, error: 'Not authenticated' };
      }

      return { success: true, data: currentUser };
    },
  },

  users: {
    getAll: async (): Promise<ApiResponse<User[]>> => {
      await delay(300);
      return { success: true, data: users };
    },

    getByRole: async (role: UserRole): Promise<ApiResponse<User[]>> => {
      await delay(300);
      const filtered = users.filter(u => u.role === role);
      return { success: true, data: filtered };
    },

    updateRole: async (userId: string, role: UserRole): Promise<ApiResponse<User>> => {
      await delay(400);
      const user = users.find(u => u.id === userId);

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      user.role = role;
      user.updated_at = new Date().toISOString();

      return { success: true, data: user };
    },

    delete: async (userId: string): Promise<ApiResponse<void>> => {
      await delay(400);
      users = users.filter(u => u.id !== userId);
      return { success: true };
    },
  },

  packages: {
    create: async (packageData: Partial<Package>): Promise<ApiResponse<Package>> => {
      await delay(500);

      const newPackage: Package = {
        id: generateId(),
        tracking_number: `TRK${Date.now()}`,
        recipient_id: packageData.recipient_id!,
        recipient_name: packageData.recipient_name!,
        recipient_email: packageData.recipient_email!,
        recipient_phone: packageData.recipient_phone,
        status: 'queued',
        size: packageData.size!,
        description: packageData.description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      packages.push(newPackage);
      return { success: true, data: newPackage };
    },

    getAll: async (): Promise<ApiResponse<Package[]>> => {
      await delay(300);
      return { success: true, data: packages };
    },

    getMy: async (userId: string): Promise<ApiResponse<Package[]>> => {
      await delay(300);
      const myPackages = packages.filter(p => p.recipient_id === userId || p.sender_id === userId);
      return { success: true, data: myPackages };
    },

    getByRecipient: async (recipientId: string): Promise<ApiResponse<Package[]>> => {
      await delay(300);
      const filtered = packages.filter(p => p.recipient_id === recipientId);
      return { success: true, data: filtered };
    },

    pickup: async (packageId: string, userId: string): Promise<ApiResponse<Package>> => {
      await delay(500);
      const pkg = packages.find(p => p.id === packageId);

      if (!pkg) {
        return { success: false, error: 'Package not found' };
      }

      if (pkg.status !== 'delivered') {
        return { success: false, error: 'Package not ready for pickup' };
      }

      pkg.status = 'picked_up';
      pkg.picked_up_at = new Date().toISOString();
      pkg.updated_at = new Date().toISOString();

      const pickupLog: PickupLog = {
        id: generateId(),
        package_id: packageId,
        user_id: userId,
        locker_id: pkg.locker_id!,
        picked_up_at: new Date().toISOString(),
        facial_recognition_verified: true,
        created_at: new Date().toISOString(),
      };
      pickupLogs.push(pickupLog);

      const locker = lockers.find(l => l.id === pkg.locker_id);
      if (locker) {
        locker.status = 'available';
        locker.updated_at = new Date().toISOString();
      }

      return { success: true, data: pkg };
    },

    assignLocker: async (packageId: string, lockerId: string, assignedBy: string): Promise<ApiResponse<Package>> => {
      await delay(500);
      const pkg = packages.find(p => p.id === packageId);
      const locker = lockers.find(l => l.id === lockerId);

      if (!pkg) {
        return { success: false, error: 'Package not found' };
      }

      if (!locker) {
        return { success: false, error: 'Locker not found' };
      }

      if (locker.status !== 'available') {
        return { success: false, error: 'Locker not available' };
      }

      pkg.locker_id = lockerId;
      pkg.status = 'assigned';
      pkg.assigned_at = new Date().toISOString();
      pkg.updated_at = new Date().toISOString();

      locker.status = 'occupied';
      locker.updated_at = new Date().toISOString();

      const assignmentLog: AssignmentLog = {
        id: generateId(),
        package_id: packageId,
        locker_id: lockerId,
        assigned_by: assignedBy,
        assigned_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      assignmentLogs.push(assignmentLog);

      return { success: true, data: pkg };
    },

    markDelivered: async (packageId: string): Promise<ApiResponse<Package>> => {
      await delay(400);
      const pkg = packages.find(p => p.id === packageId);

      if (!pkg) {
        return { success: false, error: 'Package not found' };
      }

      pkg.status = 'delivered';
      pkg.delivered_at = new Date().toISOString();
      pkg.updated_at = new Date().toISOString();

      return { success: true, data: pkg };
    },
  },

  lockers: {
    getAll: async (): Promise<ApiResponse<Locker[]>> => {
      await delay(300);
      return { success: true, data: lockers };
    },

    getAvailable: async (size?: LockerSize): Promise<ApiResponse<Locker[]>> => {
      await delay(300);
      let available = lockers.filter(l => l.status === 'available');

      if (size) {
        available = available.filter(l => l.size === size);
      }

      return { success: true, data: available };
    },

    create: async (lockerData: Partial<Locker>): Promise<ApiResponse<Locker>> => {
      await delay(500);

      const newLocker: Locker = {
        id: generateId(),
        locker_number: lockerData.locker_number!,
        size: lockerData.size!,
        status: 'available',
        location: lockerData.location!,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      lockers.push(newLocker);
      return { success: true, data: newLocker };
    },

    updateStatus: async (lockerId: string, status: 'available' | 'occupied' | 'maintenance'): Promise<ApiResponse<Locker>> => {
      await delay(400);
      const locker = lockers.find(l => l.id === lockerId);

      if (!locker) {
        return { success: false, error: 'Locker not found' };
      }

      locker.status = status;
      locker.updated_at = new Date().toISOString();

      return { success: true, data: locker };
    },
  },

  sessions: {
    getAll: async (): Promise<ApiResponse<Session[]>> => {
      await delay(300);
      return { success: true, data: sessions };
    },

    getMy: async (userId: string): Promise<ApiResponse<Session[]>> => {
      await delay(300);
      const mySessions = sessions.filter(s => s.user_id === userId);
      return { success: true, data: mySessions };
    },

    getActive: async (): Promise<ApiResponse<Session[]>> => {
      await delay(300);
      const active = sessions.filter(s => s.status === 'active');
      return { success: true, data: active };
    },

    getMyActive: async (userId: string): Promise<ApiResponse<Session[]>> => {
      await delay(300);
      const active = sessions.filter(s => s.user_id === userId && s.status === 'active');
      return { success: true, data: active };
    },

    getByUser: async (userId: string): Promise<ApiResponse<Session[]>> => {
      await delay(300);
      const userSessions = sessions.filter(s => s.user_id === userId);
      return { success: true, data: userSessions };
    },

    create: async (sessionData: Partial<Session>): Promise<ApiResponse<Session>> => {
      await delay(500);

      const newSession: Session = {
        id: generateId(),
        user_id: sessionData.user_id!,
        locker_id: sessionData.locker_id!,
        package_id: sessionData.package_id,
        session_type: sessionData.session_type!,
        status: 'active',
        facial_recognition_verified: false,
        started_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      sessions.push(newSession);
      return { success: true, data: newSession };
    },

    complete: async (sessionId: string): Promise<ApiResponse<Session>> => {
      await delay(400);
      const session = sessions.find(s => s.id === sessionId);

      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      session.status = 'completed';
      session.completed_at = new Date().toISOString();

      return { success: true, data: session };
    },
  },

  logs: {
    getPickupLogs: async (): Promise<ApiResponse<PickupLog[]>> => {
      await delay(300);
      return { success: true, data: pickupLogs };
    },

    getPickupLogsByUser: async (userId: string): Promise<ApiResponse<PickupLog[]>> => {
      await delay(300);
      const filtered = pickupLogs.filter(l => l.user_id === userId);
      return { success: true, data: filtered };
    },

    getAssignmentLogs: async (): Promise<ApiResponse<AssignmentLog[]>> => {
      await delay(300);
      return { success: true, data: assignmentLogs };
    },
  },

  courier: {
    getDeliveryList: async (): Promise<ApiResponse<Package[]>> => {
      await delay(300);
      const deliveries = packages.filter(p => p.status === 'queued' || p.status === 'assigned');
      return { success: true, data: deliveries };
    },
  },
};
