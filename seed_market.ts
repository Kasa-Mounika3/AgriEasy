import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, addDoc, getDocs, query, limit } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

const SAMPLE_PRODUCTS = [
  {
    farmerId: "system_seed_1",
    farmerName: "Telangana Farms",
    name: "Fresh Buffalo Milk",
    category: "Milk & Dairy",
    price: 65,
    unit: "Litre",
    quantity: 50,
    image: "https://images.unsplash.com/photo-1550583724-125581f77833?auto=format&fit=crop&q=80&w=800",
    location: { state: "Telangana", district: "Hyderabad" },
    isOrganic: true,
    rating: 4.8,
    reviewsCount: 124,
    harvestDate: Date.now(),
    createdAt: Date.now()
  },
  {
    farmerId: "system_seed_2",
    farmerName: "Ratnagiri Orchards",
    name: "Organic Alphonso Mangoes",
    category: "Fruits",
    price: 1200,
    unit: "Dozen",
    quantity: 20,
    image: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&q=80&w=800",
    location: { state: "Maharashtra", district: "Ratnagiri" },
    isOrganic: true,
    rating: 4.9,
    reviewsCount: 85,
    harvestDate: Date.now() - 86400000,
    createdAt: Date.now()
  },
  {
    farmerId: "system_seed_3",
    farmerName: "Malwa Harvest",
    name: "Sharbati Wheat",
    category: "Cereals",
    price: 45,
    unit: "kg",
    quantity: 500,
    image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=800",
    location: { state: "Madhya Pradesh", district: "Sehore" },
    isOrganic: false,
    rating: 4.5,
    reviewsCount: 210,
    harvestDate: Date.now() - 172800000,
    createdAt: Date.now()
  },
  {
    farmerId: "system_seed_4",
    farmerName: "Krishna Dairy",
    name: "Pure Cow Ghee",
    category: "Milk & Dairy",
    price: 850,
    unit: "kg",
    quantity: 30,
    image: "https://images.unsplash.com/photo-1589927986089-35812388d1f4?auto=format&fit=crop&q=80&w=800",
    location: { state: "Gujarat", district: "Anand" },
    isOrganic: true,
    rating: 4.7,
    reviewsCount: 156,
    harvestDate: Date.now() - 432000000,
    createdAt: Date.now()
  },
  {
    farmerId: "system_seed_5",
    farmerName: "Green Valley",
    name: "Fresh Spinach",
    category: "Vegetables",
    price: 20,
    unit: "Bunch",
    quantity: 100,
    image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=800",
    location: { state: "Maharashtra", district: "Pune" },
    isOrganic: true,
    rating: 4.6,
    reviewsCount: 42,
    harvestDate: Date.now(),
    createdAt: Date.now()
  },
  {
    farmerId: "system_seed_6",
    farmerName: "Punjab Gold",
    name: "Basmati Rice (Long Grain)",
    category: "Cereals",
    price: 110,
    unit: "kg",
    quantity: 1000,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=800",
    location: { state: "Punjab", district: "Amritsar" },
    isOrganic: true,
    rating: 4.9,
    reviewsCount: 320,
    harvestDate: Date.now() - 2592000000,
    createdAt: Date.now()
  },
  {
    farmerId: "system_seed_7",
    farmerName: "Himalayan Orchards",
    name: "Kashmiri Red Apples",
    category: "Fruits",
    price: 180,
    unit: "kg",
    quantity: 200,
    image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&q=80&w=800",
    location: { state: "Jammu & Kashmir", district: "Sopore" },
    isOrganic: true,
    rating: 4.8,
    reviewsCount: 180,
    harvestDate: Date.now() - 432000000,
    createdAt: Date.now()
  },
  {
    farmerId: "system_seed_8",
    farmerName: "South Spice",
    name: "Organic Turmeric Powder",
    category: "Organic Products",
    price: 350,
    unit: "kg",
    quantity: 150,
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=800",
    location: { state: "Tamil Nadu", district: "Erode" },
    isOrganic: true,
    rating: 4.7,
    reviewsCount: 95,
    harvestDate: Date.now() - 15552000000,
    createdAt: Date.now()
  },
  {
    farmerId: "system_seed_9",
    farmerName: "Deccan Millets",
    name: "Finger Millet (Ragi)",
    category: "Millets",
    price: 55,
    unit: "kg",
    quantity: 300,
    image: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&q=80&w=800",
    location: { state: "Karnataka", district: "Tumkur" },
    isOrganic: true,
    rating: 4.6,
    reviewsCount: 64,
    harvestDate: Date.now() - 864000000,
    createdAt: Date.now()
  },
  {
    farmerId: "system_seed_10",
    farmerName: "Coastal Greens",
    name: "Fresh Coconuts",
    category: "Fruits",
    price: 40,
    unit: "piece",
    quantity: 500,
    image: "https://images.unsplash.com/photo-1526318896980-cf78c088247c?auto=format&fit=crop&q=80&w=800",
    location: { state: "Kerala", district: "Kochi" },
    isOrganic: true,
    rating: 4.8,
    reviewsCount: 112,
    harvestDate: Date.now() - 172800000,
    createdAt: Date.now()
  },
  {
    farmerId: "system_seed_11",
    farmerName: "Assam Tea Gardens",
    name: "Handpicked CTC Tea",
    category: "Organic Products",
    price: 450,
    unit: "kg",
    quantity: 100,
    image: "https://images.unsplash.com/photo-1594631252845-29fc4586c567?auto=format&fit=crop&q=80&w=800",
    location: { state: "Assam", district: "Dibrugarh" },
    isOrganic: true,
    rating: 4.9,
    reviewsCount: 245,
    harvestDate: Date.now() - 1209600000,
    createdAt: Date.now()
  },
  {
    farmerId: "system_seed_12",
    farmerName: "Bihar Pulses",
    name: "Toor Dal (Pigeon Peas)",
    category: "Pulses",
    price: 160,
    unit: "kg",
    quantity: 400,
    image: "https://images.unsplash.com/photo-1585996850201-14787063068b?auto=format&fit=crop&q=80&w=800",
    location: { state: "Bihar", district: "Patna" },
    isOrganic: false,
    rating: 4.4,
    reviewsCount: 89,
    harvestDate: Date.now() - 2592000000,
    createdAt: Date.now()
  }
];

async function seed() {
  console.log('Seeding market products...');
  for (const p of SAMPLE_PRODUCTS) {
    await addDoc(collection(db, 'market_products'), p);
  }
  console.log('Seeding complete!');
}

seed().catch(console.error);
