export type UserRole = 'president' | 'treasurer' | 'member';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string | null;
  photoURL: string | null;
  flatNumber: string;
  communityId: string;
  role: UserRole;
  isVerified: boolean;
  phoneNumber?: string;
  rating?: number;
  createdAt: any;
}

export interface Community {
  id: string;
  name: string;
  location: string;
  presidentUid: string;
  treasurerUid: string;
  status: 'pending' | 'active' | 'rejected';
  createdAt: any;
}

export interface Item {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  pricePerDay: number;
  category: string;
  ownerUid: string;
  ownerName: string;
  communityId: string;
  status: 'available' | 'rented' | 'inactive';
  createdAt: any;
}

export interface Booking {
  id: string;
  itemId: string;
  itemTitle: string;
  ownerUid: string;
  borrowerUid: string;
  borrowerName: string;
  startDate: any;
  endDate: any;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  depositPaid: boolean;
  createdAt: any;
}

export interface Message {
  id: string;
  text: string;
  senderUid: string;
  timestamp: any;
}
