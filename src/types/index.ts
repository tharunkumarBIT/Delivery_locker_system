export type UserRole = 'admin' | 'courier' | 'user';

export type PackageStatus = 'queued' | 'assigned' | 'delivered' | 'picked_up';

export type LockerStatus = 'available' | 'occupied' | 'maintenance';

export type LockerSize = 'small' | 'medium' | 'large';

export type SessionType = 'pickup' | 'delivery' | 'access';

export type SessionStatus = 'active' | 'completed' | 'failed';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  facial_data?: string;
  created_at: string;
  updated_at: string;
}

export interface Locker {
  id: string;
  locker_number: string;
  size: LockerSize;
  status: LockerStatus;
  location: string;
  created_at: string;
  updated_at: string;
}

export interface Package {
  id: string;
  tracking_number: string;
  sender_id?: string;
  recipient_id: string;
  recipient_name: string;
  recipient_email: string;
  recipient_phone?: string;
  locker_id?: string;
  status: PackageStatus;
  size: LockerSize;
  description?: string;
  assigned_at?: string;
  delivered_at?: string;
  picked_up_at?: string;
  created_at: string;
  updated_at: string;
  locker?: Locker;
  recipient?: User;
  sender?: User;
}

export interface Session {
  id: string;
  user_id: string;
  locker_id: string;
  package_id?: string;
  session_type: SessionType;
  status: SessionStatus;
  facial_recognition_verified: boolean;
  started_at: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
  user?: User;
  locker?: Locker;
  package?: Package;
}

export interface PickupLog {
  id: string;
  package_id: string;
  user_id: string;
  locker_id: string;
  picked_up_at: string;
  facial_recognition_verified: boolean;
  notes?: string;
  created_at: string;
  package?: Package;
  user?: User;
  locker?: Locker;
}

export interface AssignmentLog {
  id: string;
  package_id: string;
  locker_id: string;
  assigned_by: string;
  assigned_at: string;
  notes?: string;
  created_at: string;
  package?: Package;
  locker?: Locker;
  assigned_by_user?: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
