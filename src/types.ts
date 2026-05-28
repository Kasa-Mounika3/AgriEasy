export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  phone?: string;
  photoURL: string | null;
  location?: {
    lat: number;
    lng: number;
    address?: string;
    state?: string;
    district?: string;
  };
  language: string;
  createdAt: number;
}

export interface WeatherData {
  temp: number;
  humidity: number;
  description: string;
  icon: string;
  windSpeed: number;
  rainForecast?: string;
}

export interface Product {
  id: string;
  name: string;
  category: 'Seeds' | 'Fertilizers' | 'Pesticides' | 'Equipment';
  price: number;
  image: string;
  description: string;
}

export interface ColdStorage {
  id: string;
  name: string;
  address: string;
  state: string;
  district: string;
  contact: string;
  image: string;
  capacity: string;
  managerName: string;
  customerCare: string;
  emergencyContact?: string;
  pricePerUnit: {
    kg?: number;
    ton?: number;
    day: number;
    week?: number;
    month?: number;
  };
  supportedConditions: string[];
  rating: number;
  reviewsCount: number;
  lat: number;
  lng: number;
  tags?: string[];
}

export interface ColdStorageBooking {
  id: string;
  storageId: string;
  storageName: string;
  userId: string;
  farmerName: string;
  contactNumber: string;
  cropName: string;
  category: string;
  estimatedQuantity: number;
  actualQuantity?: number;
  unit: string;
  startDate: number;
  duration: number; // in days
  preferredIntakeDate: number;
  specialInstructions?: string;
  status: 'Pending' | 'Active' | 'Completed' | 'Cancelled';
  priceDetails: {
    baseRate: number;
    totalAmount: number;
  };
  weightFluctuations?: {
    estimated: number;
    actual: number;
    difference: number;
    reason?: string;
  };
  renewals?: {
    extendedBy: number; // days
    newEndDate: number;
    additionalAmount: number;
    createdAt: number;
  }[];
  createdAt: number;
}

export interface MarketSlot {
  id: string;
  marketName: string;
  state: string;
  district: string;
  date: string;
  status: 'Available' | 'Booked';
}

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  title: string;
  description: string;
  image?: string;
  likesCount: number;
  commentsCount: number;
  createdAt: number;
}

export interface CommunityComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: number;
}

export interface CommunityLike {
  id: string;
  postId: string;
  userId: string;
  createdAt: number;
}

export interface FPO {
  id: string;
  name: string;
  state: string;
  district: string;
  location: string;
  lat: number;
  lng: number;
  contact: string;
  email?: string;
  yearEstablished?: number;
  services: string[];
  rating?: number;
  description?: string;
  tags?: string[];
}

export interface GovScheme {
  id: string;
  name: string;
  description: string;
  eligibility: string;
  benefits: string;
  applyLink: string;
  state?: string;
  farmerType?: string;
}

export interface Technology {
  id: string;
  name: string;
  description: string;
  benefits: string[];
  useCases: string[];
  image: string;
}

export interface Expert {
  id: string;
  name: string;
  specialization: string;
  image: string;
  experience?: string;
  location?: string;
  rating?: number;
  availableNow?: boolean;
  isTopExpert?: boolean;
  contactOptions?: ('call' | 'chat' | 'voice' | 'query')[];
}

export interface ExpertQuery {
  id: string;
  expertId: string;
  userId: string;
  cropName?: string;
  question: string;
  location?: string;
  context?: any; // To store farm inputs
  imageUrl?: string;
  voiceUrl?: string;
  status: 'pending' | 'answered';
  createdAt: number;
}

export interface ExpertQA {
  id: string;
  question: string;
  answer?: string;
  expertId?: string;
  createdAt: number;
}

export type ProductCategory = 
  | 'Milk & Dairy' 
  | 'Cereals' 
  | 'Millets' 
  | 'Pulses' 
  | 'Fruits' 
  | 'Vegetables' 
  | 'Organic Products';

export interface MarketProduct {
  id: string;
  farmerId: string;
  farmerName: string;
  name: string;
  category: ProductCategory;
  price: number;
  unit: string; // kg, litre, bunch, etc.
  quantity: number;
  location: {
    state: string;
    district: string;
    address?: string;
    lat?: number;
    lng?: number;
  };
  image: string;
  harvestDate: number;
  isOrganic: boolean;
  rating: number;
  reviewsCount: number;
  createdAt: number;
}

export interface CartItem extends MarketProduct {
  cartQuantity: number;
}

export type OrderStatus = 'Ordered' | 'Shipped' | 'Out for delivery' | 'Delivered';

export interface MarketOrder {
  id: string;
  customerId: string;
  customerName: string;
  items: CartItem[];
  totalAmount: number;
  deliveryCharges: number;
  finalAmount: number;
  deliveryAddress: string;
  contactNumber: string;
  status: OrderStatus;
  trackingSteps: {
    status: OrderStatus;
    timestamp: number;
    completed: boolean;
  }[];
  estimatedDelivery: string;
  createdAt: number;
}

export interface CropRecommendation {
  name: string;
  suitabilityScore: number;
  reason: string;
  marketIntel: {
    demand: string;
    priceTrends: string;
    futurePrediction: string;
  };
  guide: {
    landPreparation: string;
    sowing: string;
    irrigation: string;
    fertilizers: string;
    pestControl: string;
    maintenance: string;
    harvesting: string;
    precautions: string[];
    dosAndDonts: { do: string[]; dont: string[] };
    riskAlerts: string[];
  };
}

export interface CropPlan {
  id?: string;
  userId: string;
  cropName: string;
  soilType: string;
  waterAvailability: string;
  irrigationType: string;
  landArea: string;
  labourAvailability: string;
  guide: CropRecommendation['guide'];
  createdAt: number;
}
