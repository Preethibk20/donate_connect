export type Role = 'DONOR' | 'NGO' | 'ADMIN' | 'VOLUNTEER' | 'CORPORATE';

export type Category = 'CLOTHES' | 'FOOD' | 'BOOKS' | 'STATIONERY' | 'TOYS' | 'OTHER';

export type DonationStatus = 'REQUESTED' | 'ACCEPTED' | 'REJECTED' | 'PICKED_UP' | 'DELIVERED';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  createdAt: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  role?: Role;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface AuthResponse {
  token: string | null;
  user: User;
  requiresOtp?: boolean;
}

export interface NGOProfile {
  id: string;
  user: User;
  name: string;
  description?: string;
  address: string;
  phone: string;
  verified: boolean;
  createdAt: string;
}

export interface CreateNgoRequest {
  email: string;
  password: string;
  name: string;
  description?: string;
  address: string;
  phone: string;
}

export interface UpdateNgoProfileDto {
  name: string;
  description?: string;
  address: string;
  phone: string;
}

export interface Donation {
  id: string;
  donor: User;
  ngo: NGOProfile;
  category: Category;
  description?: string;
  photoUrls: string[];
  status: DonationStatus;
  pickupDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateDonationRequest {
  ngoId: string;
  category: Category;
  description?: string;
  photoUrls?: string[];
  pickupDate?: string;
}

export interface UpdateDonationStatusDto {
  status: DonationStatus;
}

export interface HealthStatus {
  status: string;
  service?: string;
  timestamp?: string;
}

export interface AdminStats {
  totalDonations: number;
  verifiedNgos: number;
  pendingRequests: number;
  completedDeliveries: number;
}

export interface NotificationItem {
  id: string;
  message: string;
  read: boolean;
  relatedDonationId?: string;
  createdAt: string;
}

export interface DonationComment {
  id: string;
  donationId: string;
  author: User;
  message: string;
  createdAt: string;
}

export interface CreateCommentRequest {
  message: string;
}

export interface NgoRating {
  id: string;
  ngoId: string;
  donor: User;
  rating: number;
  review?: string;
  createdAt: string;
}

export interface CreateRatingRequest {
  rating: number;
  review?: string;
}

export interface NgoUrgentNeed {
  id: string;
  ngo: NGOProfile;
  title: string;
  description: string;
  category: Category;
  active: boolean;
  createdAt: string;
}

export interface CreateUrgentNeedRequest {
  title: string;
  description: string;
  category: Category;
}

export interface ImpactMetrics {
  totalDonations: number;
  deliveredDonations: number;
  totalNgosSupported: number;
  totalActiveDonors: number;
  estimatedCo2SavedKg: number;
  donationsByCategory: Record<string, number>;
}

export interface VolunteerTask {
  id: string;
  donation: Donation;
  volunteer: User;
  status: 'CLAIMED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  routeNotes?: string;
  claimedAt: string;
}

export interface CorporateDrive {
  id: string;
  corporateUser: User;
  companyName: string;
  campaignTitle: string;
  description?: string;
  targetItemCount: number;
  collectedItemCount: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface SmartLocker {
  id: string;
  name: string;
  address: string;
  totalLockers: number;
  availableLockers: number;
  pinCode?: string;
  createdAt: string;
}

export interface BlockchainBlock {
  id: string;
  blockIndex: number;
  previousHash: string;
  hash: string;
  donationId: string;
  action: string;
  timestamp: string;
}

export interface NgoResourceTrade {
  id: string;
  offeringNgo: NGOProfile;
  offeredCategory: Category;
  offeredQuantity: number;
  requestedCategory: Category;
  requestedQuantity: number;
  active: boolean;
  createdAt: string;
}

export interface SosStatus {
  active: boolean;
  disasterTitle: string;
  urgentCategories: string[];
  priorityMessage: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
