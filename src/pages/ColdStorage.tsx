import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  MapPin, 
  Phone, 
  Warehouse, 
  Info, 
  Mic, 
  Star, 
  Navigation, 
  ShieldCheck, 
  Clock, 
  ChevronRight, 
  Calendar, 
  Package, 
  ArrowRight, 
  CheckCircle2, 
  RefreshCw, 
  FileText,
  Download,
  Weight,
  Thermometer,
  AlertTriangle,
  History,
  CalendarRange,
  Zap,
  ArrowLeft
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { indiaData, mockColdStorages } from '@/lib/indiaData';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { ColdStorage as ColdStorageType, ColdStorageBooking } from '@/types';
import { useLocationContext } from '@/contexts/LocationContext';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import SafeImage from '@/components/SafeImage';
import { imageForColdStorage } from '@/lib/imageAssets';

// Distance calculation: Haversine formula
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export default function ColdStorage() {
  const [view, setView] = useState<'list' | 'details' | 'booking' | 'receipt' | 'renew' | 'history'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedStorage, setSelectedStorage] = useState<ColdStorageType | null>(null);
  const [bookings, setBookings] = useState<ColdStorageBooking[]>([]);
  const [activeBooking, setActiveBooking] = useState<ColdStorageBooking | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const { location } = useLocationContext();
  const receiptRef = useRef<HTMLDivElement>(null);

  const states = Object.keys(indiaData).sort();
  const districts = selectedState ? indiaData[selectedState] : [];

  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    farmerName: '',
    contactNumber: '',
    cropName: '',
    category: 'Fruits',
    estimatedQuantity: '',
    unit: 'kg',
    startDate: '',
    duration: '30',
    preferredIntakeDate: '',
    specialInstructions: ''
  });

  useEffect(() => {
    fetchUserBookings();
  }, []);

  const fetchUserBookings = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const q = query(collection(db, 'cold_storage_bookings'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ColdStorageBooking));
      setBookings(fetched);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice recognition not supported in your browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.start();
    setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast.error('Voice recognition failed. Please try again.');
    };
  };

    const filteredStorages = mockColdStorages
    .map(st => ({
      ...st,
      distance: getDistance(location.lat, location.lng, st.lat, st.lng)
    }))
    .filter(st => {
      const matchesSearch = st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          st.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          st.district.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesState = !selectedState || st.state === selectedState;
      const matchesDistrict = !selectedDistrict || st.district === selectedDistrict;
      return matchesSearch && matchesState && matchesDistrict;
    })
    .sort((a, b) => a.distance - b.distance);

  // Updated valid agriculture keywords
  const VALID_AGRI_PRODUCTS = [
    'rice', 'wheat', 'maize', 'corn', 'cotton', 'tomato', 'chilli', 'potato', 'onion', 'mango', 'grapes', 'apple', 'banana', 'orange', 
    'paddy', 'pulse', 'dal', 'grain', 'vegetable', 'fruit', 'milk', 'dairy', 'egg', 'meat', 'fish', 'poultry', 'spice', 'oilseed',
    'sugarcane', 'tea', 'coffee', 'rubber', 'jute', 'tobacco', 'seed', 'fertilizer', 'pesticide', 'flower', 'nursery'
  ];

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStorage || !auth.currentUser) return;

    // 6. Product Name Validation
    const productName = bookingForm.cropName.toLowerCase().trim();
    const isValidProduct = VALID_AGRI_PRODUCTS.some(keyword => productName.includes(keyword));
    
    if (!isValidProduct) {
      toast.error('Invalid product. Please enter a valid agricultural product.');
      return;
    }

    // 7. Date Validation
    const intakeDateMs = new Date(bookingForm.preferredIntakeDate).getTime();
    const startDateMs = new Date(bookingForm.startDate).getTime();

    if (intakeDateMs < startDateMs) {
      toast.error('Preferred intake slot cannot be before the start date.');
      return;
    }

    setIsBookingLoading(true);
    try {
      // Default duration is 30 days as requested to remove field but we need a default for calculation
      const durationDays = 30; 
      
      const newBooking: Omit<ColdStorageBooking, 'id'> = {
        storageId: selectedStorage.id,
        storageName: selectedStorage.name,
        userId: auth.currentUser.uid,
        farmerName: auth.currentUser.displayName || 'Farmer',
        contactNumber: selectedStorage.contact,
        cropName: bookingForm.cropName,
        category: bookingForm.category,
        estimatedQuantity: parseFloat(bookingForm.estimatedQuantity),
        unit: bookingForm.unit,
        startDate: startDateMs,
        duration: durationDays,
        preferredIntakeDate: intakeDateMs,
        specialInstructions: bookingForm.specialInstructions,
        status: 'Active',
        priceDetails: {
          baseRate: selectedStorage.pricePerUnit.day,
          totalAmount: selectedStorage.pricePerUnit.day * durationDays * (parseFloat(bookingForm.estimatedQuantity) / 100)
        },
        createdAt: Date.now()
      };

      const docRef = await addDoc(collection(db, 'cold_storage_bookings'), newBooking);
      const bookingWithId = { ...newBooking, id: docRef.id } as ColdStorageBooking;
      setActiveBooking(bookingWithId);
      setBookings([...bookings, bookingWithId]);
      setView('receipt');
      toast.success('Storage space booked successfully!');
    } catch (error) {
      console.error('Booking Error:', error);
      toast.error('Failed to book storage space. Please try again.');
    } finally {
      setIsBookingLoading(false);
    }
  };

  const handleRenew = async (newEndDateStr: string) => {
    if (!activeBooking?.id || !newEndDateStr) return;
    try {
      const currentEndDate = activeBooking.startDate + (activeBooking.duration * 24 * 60 * 60 * 1000);
      const newEndDate = new Date(newEndDateStr).getTime();
      
      if (newEndDate <= currentEndDate) {
        toast.error('New end date must be after current end date.');
        return;
      }

      const diffTime = Math.abs(newEndDate - currentEndDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const additionalCost = activeBooking.priceDetails.baseRate * diffDays * (activeBooking.estimatedQuantity / 100);
      
      const updatedRenewals = [
        ...(activeBooking.renewals || []),
        {
          extendedBy: diffDays,
          oldEndDate: currentEndDate,
          newEndDate: newEndDate,
          additionalAmount: additionalCost,
          createdAt: Date.now()
        }
      ];

      await updateDoc(doc(db, 'cold_storage_bookings', activeBooking.id), {
        duration: activeBooking.duration + diffDays,
        renewals: updatedRenewals,
        'priceDetails.totalAmount': activeBooking.priceDetails.totalAmount + additionalCost
      });

      setActiveBooking({
        ...activeBooking,
        duration: activeBooking.duration + diffDays,
        renewals: updatedRenewals,
        priceDetails: {
          ...activeBooking.priceDetails,
          totalAmount: activeBooking.priceDetails.totalAmount + additionalCost
        }
      });
      
      toast.success(`Slot renewed for ${diffDays} additional days!`);
      setView('receipt');
    } catch (error) {
      toast.error('Renewal failed.');
    }
  };

  const handleDownloadReceipt = async () => {
    if (!receiptRef.current) return;
    
    try {
      toast.loading('Generating PDF receipt...');
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`AgriEasy_Receipt_${activeBooking?.id?.slice(-8).toUpperCase()}.pdf`);
      toast.dismiss();
      toast.success('Receipt downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.dismiss();
      toast.error('Failed to download receipt');
    }
  };

  const getWeightFluctuationReason = (crop: string) => {
    const reasons: Record<string, string> = {
      'Rice': 'Slight moisture loss expected over 3 months (~0.5%)',
      'Wheat': 'Minimal weight change in dry storage',
      'Tomatoes': 'Significant respiration and water loss possible (~5-8%)',
      'Onions': 'Sprouting and moisture loss can cause 3-5% weight change',
      'Mangoes': 'Ripening process leads to standard moisture loss'
    };
    return reasons[crop] || 'Natural moisture evaporation and respiration during dormancy';
  };

  return (
    <Layout 
      title="Cold Storages" 
      showBackButton={view !== 'list'} 
      onBack={() => setView(view === 'details' ? 'list' : view === 'booking' ? 'details' : view === 'history' ? 'list' : view === 'receipt' ? 'history' : 'list')}
    >
      <div className="max-w-4xl mx-auto space-y-6 pb-24">
        
        {view === 'list' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Search & Voice */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search name, area or district..." 
                  className="pl-10 h-12 rounded-2xl border-emerald-100 bg-white shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-xl transition-colors ${isListening ? 'bg-rose-100 text-rose-600 animate-pulse' : 'text-emerald-600'}`}
                  onClick={handleVoiceSearch}
                >
                  <Mic className="h-5 w-5" />
                </Button>
              </div>
              <Button 
                variant="outline" 
                className="h-12 rounded-2xl border-emerald-100 bg-white gap-2 text-emerald-700 font-bold px-4"
                onClick={() => setView('history')}
              >
                <History className="h-5 w-5" />
                <span className="hidden sm:inline">Your Bookings</span>
              </Button>
            </div>

            {/* State & District Filters */}
            <div className="grid grid-cols-2 gap-3">
              <Select 
                value={selectedState}
                onValueChange={(v) => { setSelectedState(v); setSelectedDistrict(''); }}
              >
                <SelectTrigger className="h-11 rounded-xl bg-white border-gray-100">
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  {states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select onValueChange={setSelectedDistrict} disabled={!selectedState} value={selectedDistrict}>
                <SelectTrigger className="h-11 rounded-xl bg-white border-gray-100">
                  <SelectValue placeholder="Select District" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-bold text-gray-800">
                  {searchQuery || selectedState ? 'Search Results' : 'Nearby Storages'}
                </h3>
                <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                  {filteredStorages.length} found
                </Badge>
              </div>

              {filteredStorages.map((st) => (
                <Card 
                  key={st.id} 
                  className="border-none shadow-md hover:shadow-xl transition-all cursor-pointer group overflow-hidden bg-white"
                  onClick={() => { setSelectedStorage(st); setView('details'); }}
                >
                  <CardContent className="p-0 flex flex-col sm:flex-row">
                      <div className="sm:w-40 h-32 sm:h-auto overflow-hidden">
                        <SafeImage src={imageForColdStorage(st.name, st.image)} alt={st.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="p-5 flex-1 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-lg text-gray-800 group-hover:text-emerald-700 transition-colors">{st.name}</h4>
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                            <MapPin className="h-3 w-3" />
                            <span>{st.address}, {st.district}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1 text-amber-500">
                            <Star className="h-3 w-3 fill-current" />
                            <span className="text-xs font-bold">{st.rating}</span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{st.distance.toFixed(1)} km</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 pt-2">
                        {st.tags?.map(tag => (
                          <Badge key={tag} className="bg-slate-100 text-slate-600 hover:bg-slate-100 text-[10px] font-medium border-none px-2 py-0">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Package className="h-3 w-3 text-emerald-500" />
                            <span>{st.capacity}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Phone className="h-3 w-3 text-emerald-500" />
                            <span>{st.contact}</span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {view === 'details' && selectedStorage && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card className="border-none shadow-xl overflow-hidden bg-white rounded-[32px]">
                <div className="h-64 relative overflow-hidden group">
                  <SafeImage src={imageForColdStorage(selectedStorage.name, selectedStorage.image)} alt={selectedStorage.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-8 w-full">
                  <div className="flex justify-between items-end gap-6">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2 mb-1">
                        {selectedStorage.tags?.map(tag => (
                          <Badge key={tag} className="bg-emerald-500 text-white border-none py-0.5 px-2 text-[10px] font-black uppercase tracking-wider">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <h2 className="text-3xl font-black text-white leading-tight">{selectedStorage.name}</h2>
                      <p className="text-emerald-100 text-sm flex items-center gap-1.5 font-medium">
                        <MapPin className="h-4 w-4 text-emerald-400" />
                        {selectedStorage.address}, {selectedStorage.district}, {selectedStorage.state}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-xl border border-white/20 px-4 py-2 rounded-2xl text-white">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-black text-lg">{selectedStorage.rating}</span>
                        <span className="text-[10px] uppercase font-bold opacity-60 ml-1">{selectedStorage.reviewsCount} Reviews</span>
                      </div>
                      <div className="bg-emerald-500/90 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified Facility
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <CardContent className="p-8 space-y-10">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex flex-col p-4 rounded-3xl bg-slate-50 border border-slate-100 space-y-1 group hover:bg-emerald-50 hover:border-emerald-100 transition-colors">
                    <Navigation className="h-5 w-5 text-emerald-600 mb-1" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Distance</span>
                    <span className="font-black text-slate-800 text-lg">{selectedStorage.distance.toFixed(1)} km</span>
                  </div>
                  <div className="flex flex-col p-4 rounded-3xl bg-slate-50 border border-slate-100 space-y-1 group hover:bg-emerald-50 hover:border-emerald-100 transition-colors">
                    <Warehouse className="h-5 w-5 text-emerald-600 mb-1" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Capacity</span>
                    <span className="font-black text-slate-800 text-lg">{selectedStorage.capacity}</span>
                  </div>
                  <div className="flex flex-col p-4 rounded-3xl bg-slate-50 border border-slate-100 space-y-1 group hover:bg-emerald-50 hover:border-emerald-100 transition-colors">
                    <Clock className="h-5 w-5 text-emerald-600 mb-1" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status</span>
                    <span className="font-black text-slate-800 text-lg">Open 24/7</span>
                  </div>
                  <div className="flex flex-col p-4 rounded-3xl bg-slate-50 border border-slate-100 space-y-1 group hover:bg-emerald-50 hover:border-emerald-100 transition-colors">
                    <Zap className="h-5 w-5 text-emerald-600 mb-1" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Type</span>
                    <span className="font-black text-slate-800 text-lg">Multi-C</span>
                  </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <div>
                      <h3 className="font-black text-slate-800 flex items-center gap-2 mb-4 text-xl">
                        <Thermometer className="h-6 w-6 text-emerald-600" />
                        Storage Environment
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedStorage.supportedConditions.map(c => (
                          <div key={c} className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                              <CheckCircle2 className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-bold text-slate-700">{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="font-black text-slate-800 flex items-center gap-2 text-xl">
                          <MapPin className="h-6 w-6 text-emerald-600" />
                          Route Information
                        </h3>
                        <Button 
                          variant="outline" 
                          className="rounded-full gap-2 border-emerald-100 text-emerald-600 font-black h-10 hover:bg-emerald-50"
                          onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&origin=${location.lat},${location.lng}&destination=${selectedStorage.lat},${selectedStorage.lng}`, '_blank')}
                        >
                          <Navigation className="h-4 w-4" />
                          Get Directions
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start gap-4 p-5 bg-slate-900 text-white rounded-[24px]">
                          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                            <Navigation className="h-5 w-5 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Distance</p>
                            <p className="text-xl font-black text-emerald-400">{selectedStorage.distance.toFixed(1)} KM</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4 p-5 bg-emerald-600 text-white rounded-[24px]">
                          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                            <Clock className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest">Est. Travel Time</p>
                            <p className="text-xl font-black">{Math.ceil(selectedStorage.distance * 3)} MIN</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-slate-50 rounded-[32px] p-6 border border-slate-100 space-y-6 sticky top-24">
                      <h3 className="font-black text-slate-800 text-lg border-b border-slate-200 pb-3">Pricing Plan</h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-white rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                          <span className="text-xs font-bold text-slate-500 uppercase">Standard / Day</span>
                          <span className="text-xl font-black text-emerald-700">₹{selectedStorage.pricePerUnit.day}</span>
                        </div>
                        <div className="p-4 bg-white rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                          <span className="text-xs font-bold text-slate-500 uppercase">Per Ton / Month</span>
                          <span className="text-xl font-black text-emerald-700">₹{selectedStorage.pricePerUnit.ton}</span>
                        </div>
                        <div className="p-4 bg-white rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                          <span className="text-xs font-bold text-slate-500 uppercase">Per KG / Daily</span>
                          <span className="text-xl font-black text-emerald-700">₹{selectedStorage.pricePerUnit.kg}</span>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 space-y-2">
                        <div className="flex items-center gap-2 text-amber-800 font-black text-xs uppercase tracking-wider">
                          <ShieldCheck className="h-4 w-4" />
                          Facility Security
                        </div>
                        <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                          24/7 CCTV Monitoring, Biometric Access & Backup Generators ensuring 0% spoilage risk.
                        </p>
                      </div>

                      <Button 
                        className="w-full h-16 rounded-[20px] bg-slate-900 border-b-4 border-slate-950 hover:bg-slate-800 text-white font-black text-lg shadow-xl shadow-slate-200"
                        onClick={() => setView('booking')}
                      >
                        Reserve Space Now
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {view === 'booking' && selectedStorage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setView('details')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-2xl font-bold text-gray-800">Confirm Booking</h2>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-6">
              <Card className="border-none shadow-lg bg-white overflow-hidden">
                <CardHeader className="bg-emerald-50 pb-8">
                  <div className="flex items-center gap-4">
                    <div className="bg-white p-3 rounded-2xl shadow-sm">
                      <Warehouse className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-emerald-900">{selectedStorage.name}</CardTitle>
                      <CardDescription className="text-emerald-700">Storage Reservation Form</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 -mt-4 space-y-6 bg-white rounded-t-3xl border-t border-gray-50">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Farmer Name</label>
                       <Input 
                         value={auth.currentUser?.displayName || 'Farmer'} 
                         readOnly
                         className="h-12 rounded-xl bg-slate-50 border-gray-100 font-bold"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Number</label>
                       <Input 
                         placeholder="+91 00000 00000"
                         required
                         className="h-12 rounded-xl border-gray-100"
                         value={bookingForm.contactNumber}
                         onChange={e => setBookingForm({ ...bookingForm, contactNumber: e.target.value })}
                       />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Crop / Product Name</label>
                      <Input 
                        placeholder="e.g. Red Grapes" 
                        required
                        className="h-12 rounded-xl focus:ring-emerald-500 border-gray-100"
                        value={bookingForm.cropName}
                        onChange={e => setBookingForm({ ...bookingForm, cropName: e.target.value })}
                        disabled={isBookingLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Category</label>
                      <Select 
                        value={bookingForm.category}
                        onValueChange={v => setBookingForm({...bookingForm, category: v})}
                      >
                        <SelectTrigger className="h-12 rounded-xl border-gray-100">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Fruits">Fruits</SelectItem>
                          <SelectItem value="Vegetables">Vegetables</SelectItem>
                          <SelectItem value="Grains">Grains</SelectItem>
                          <SelectItem value="Processed">Processed Goods</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Estimated Quantity</label>
                      <div className="flex gap-2">
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          required
                          className="h-12 rounded-xl border-gray-100"
                          value={bookingForm.estimatedQuantity}
                          onChange={e => setBookingForm({ ...bookingForm, estimatedQuantity: e.target.value })}
                        />
                        <Select 
                          value={bookingForm.unit}
                          onValueChange={v => setBookingForm({...bookingForm, unit: v})}
                        >
                          <SelectTrigger className="h-12 w-24 rounded-xl border-gray-100">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg">KG</SelectItem>
                            <SelectItem value="ton">Tons</SelectItem>
                            <SelectItem value="crates">Crates</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Storage Start Date</label>
                      <Input 
                        type="date" 
                        required
                        className="h-12 rounded-xl border-gray-100"
                        value={bookingForm.startDate}
                        onChange={e => setBookingForm({ ...bookingForm, startDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Preferred Intake Slot</label>
                      <Input 
                        type="datetime-local" 
                        required
                        className="h-12 rounded-xl border-gray-100"
                        value={bookingForm.preferredIntakeDate}
                        onChange={e => setBookingForm({ ...bookingForm, preferredIntakeDate: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Special Instructions (Optional)</label>
                    <Input 
                      placeholder="e.g. Needs specific humidity level..." 
                      className="h-12 rounded-xl border-gray-100"
                      value={bookingForm.specialInstructions}
                      onChange={e => setBookingForm({ ...bookingForm, specialInstructions: e.target.value })}
                    />
                  </div>

                  <div className="bg-blue-50/50 p-4 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      About Weight Fluctuation
                    </div>
                    <p className="text-xs text-blue-600 leading-relaxed">
                      Please note: The quantity entered is an estimated weight. Actual weight will be measured upon arrival. 
                      Standard moisture loss of ~2-5% is expected for {bookingForm.cropName || 'fresh produce'} during long-term storage.
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="p-6 bg-slate-50 border-t border-slate-100">
                  <Button 
                    type="submit"
                    className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-lg font-bold shadow-lg shadow-emerald-200"
                    disabled={isBookingLoading}
                  >
                    {isBookingLoading ? 'Processing...' : 'Confirm & Generate Receipt'}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </motion.div>
        )}

        {view === 'receipt' && activeBooking && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <div className="text-center py-4 space-y-2">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-2">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-bold text-emerald-900 font-serif">Booking Confirmed!</h2>
              <p className="text-gray-500">Your digital receipt has been generated and saved.</p>
            </div>

            <Card ref={receiptRef} className="border-none shadow-2xl bg-white overflow-hidden relative">
              <div className="h-4 bg-emerald-600 w-full" />
              <div className="absolute top-8 right-8 text-slate-100 -rotate-12 opacity-5 pointer-events-none">
                <FileText className="w-64 h-64" />
              </div>
              
              <CardContent className="p-8 space-y-8">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-gray-800 uppercase tracking-tighter">AgriEasy Receipt</h3>
                    <p className="text-xs text-gray-400">Booking ID: CS-{activeBooking.id?.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-gray-400">Date: {new Date(activeBooking.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <h4 className="font-bold text-emerald-800">{activeBooking.storageName}</h4>
                    <p className="text-xs text-slate-500">Authorized Storage Facility</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 border-y border-dashed border-slate-200 py-6">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Farmer Details</p>
                      <p className="font-bold text-gray-800">{activeBooking.farmerName}</p>
                      <p className="text-xs text-gray-500">{activeBooking.contactNumber}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Storage Period</p>
                      <p className="text-sm font-bold text-gray-800">{new Date(activeBooking.startDate).toLocaleDateString()} - {new Date(activeBooking.startDate + (activeBooking.duration * 24 * 60 * 60 * 1000)).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-500 font-bold">Total: {activeBooking.duration} Days</p>
                      {activeBooking.renewals && activeBooking.renewals.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Renewal History</p>
                          {activeBooking.renewals.map((r, idx) => (
                             <p key={idx} className="text-[10px] text-slate-500">+{r.extendedBy} days added on {new Date(r.createdAt).toLocaleDateString()}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Product Details</p>
                      <p className="font-bold text-gray-800">{activeBooking.cropName} ({activeBooking.category})</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="text-center bg-slate-50 p-2 rounded-xl flex-1 border border-slate-100">
                          <p className="text-[8px] text-gray-400 uppercase font-black">Est. Weight</p>
                          <p className="text-sm font-black text-slate-700">{activeBooking.estimatedQuantity} {activeBooking.unit}</p>
                        </div>
                        <div className="text-center bg-emerald-50 p-2 rounded-xl flex-1 border border-emerald-100">
                          <p className="text-[8px] text-emerald-500 uppercase font-black">Final Weight</p>
                          <p className="text-sm font-black text-emerald-700">{activeBooking.actualQuantity || '--'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Base Rate / Day</span>
                    <span className="font-medium">₹{activeBooking.priceDetails.baseRate}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Service Fee</span>
                    <span className="font-medium">₹250.00</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                    <span className="font-bold text-gray-800">Total Charged</span>
                    <span className="text-xl font-bold text-emerald-700">₹{(activeBooking.priceDetails.totalAmount + 250).toLocaleString()}</span>
                  </div>
                </div>

                {/* Weight Fluctuation Intel */}
                <div className="bg-amber-50 p-4 rounded-2xl flex items-start gap-3">
                  <Weight className="h-5 w-5 text-amber-600 shrink-0" />
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-amber-800">Storage Prediction</h5>
                    <p className="text-[10px] text-amber-700 leading-relaxed italic">
                      {getWeightFluctuationReason(activeBooking.cropName)}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter data-html2canvas-ignore className="bg-slate-50 p-6 flex flex-col gap-3">
                <Button 
                  className="w-full h-14 rounded-xl bg-emerald-600 hover:bg-emerald-700 gap-2 shadow-lg shadow-emerald-200 font-bold"
                  onClick={handleDownloadReceipt}
                >
                  <Download className="h-5 w-5" />
                  Download PDF Receipt
                </Button>
                <div className="flex w-full gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 rounded-xl gap-2 border-slate-200 h-12"
                    onClick={() => setView('renew')}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Renew Slot
                  </Button>
                  <Button 
                    variant="ghost"
                    className="flex-1 rounded-xl text-slate-500 hover:bg-slate-100 h-12"
                    onClick={() => setView('list')}
                  >
                    Done
                  </Button>
                </div>
                <div className="flex items-center justify-center gap-4 py-2 opacity-50 grayscale hover:grayscale-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Share via:</p>
                  <button 
                    className="text-xs text-blue-600 font-bold hover:underline"
                    onClick={() => {
                      const text = `AgriEasy Receipt: ${activeBooking.storageName}\nID: CS-${activeBooking.id?.slice(-8).toUpperCase()}\nDate: ${new Date(activeBooking.startDate).toLocaleDateString()}`;
                      navigator.clipboard.writeText(text);
                      toast.success('Receipt details copied for SMS!');
                    }}
                  >
                    SMS
                  </button>
                  <button 
                    className="text-xs text-emerald-600 font-bold hover:underline"
                    onClick={() => {
                      const text = `AgriEasy Receipt: ${activeBooking.storageName}\nID: CS-${activeBooking.id?.slice(-8).toUpperCase()}\nDate: ${new Date(activeBooking.startDate).toLocaleDateString()}`;
                      navigator.clipboard.writeText(text);
                      toast.success('Receipt details copied for WhatsApp!');
                    }}
                  >
                    WhatsApp
                  </button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {view === 'history' && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xl font-black text-slate-800">Your Storage Journey</h3>
              <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-100 px-3 py-1 text-xs">
                {bookings.length} Bookings
              </Badge>
            </div>

            <div className="space-y-4">
              {bookings.length === 0 ? (
                <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 p-12 text-center">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto text-slate-300 mb-4 shadow-sm">
                    <History className="h-8 w-8" />
                  </div>
                  <h4 className="font-bold text-slate-400">No bookings found yet</h4>
                  <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-black">Book your first cold storage slot today!</p>
                  <Button 
                    className="mt-6 rounded-xl bg-emerald-600 font-bold"
                    onClick={() => setView('list')}
                  >
                    Explore Storages
                  </Button>
                </Card>
              ) : (
                bookings.map((booking) => (
                  <Card key={booking.id} className="border-none shadow-sm rounded-3xl bg-white overflow-hidden group hover:shadow-md transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex flex-col items-center justify-center border border-emerald-100 shrink-0">
                            <Warehouse className="h-6 w-6 text-emerald-600" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-black text-slate-800 text-lg group-hover:text-emerald-700 transition-colors line-clamp-1">{booking.storageName}</h4>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                                {booking.cropName} • {booking.estimatedQuantity} {booking.unit}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(booking.startDate).toLocaleDateString('en-IN')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="rounded-xl border-emerald-100 text-emerald-600 font-black hover:bg-emerald-50 h-9"
                            onClick={() => {
                              setActiveBooking(booking);
                              setView('receipt');
                            }}
                          >
                            View Receipt
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 h-9 p-0 w-9"
                            onClick={() => {
                              setActiveBooking(booking);
                              setView('receipt');
                              setTimeout(() => {
                                handleDownloadReceipt();
                              }, 500); 
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </motion.div>
        )}

        {view === 'renew' && activeBooking && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 max-w-lg mx-auto">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setView('receipt')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-2xl font-black text-slate-800">Renew Storage Slot</h2>
            </div>

            <Card className="border-none shadow-2xl bg-white rounded-[32px] overflow-hidden">
              <div className="h-3 bg-emerald-500" />
              <CardContent className="p-8 space-y-8">
                <div className="flex items-center gap-4 p-5 bg-emerald-50 rounded-3xl border border-emerald-100">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Current Expiring Date</p>
                    <p className="text-lg font-black text-emerald-900 leading-tight">
                      {new Date(activeBooking.startDate + (activeBooking.duration * 24 * 60 * 60 * 1000)).toLocaleDateString('en-IN', { dateStyle: 'full' })}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                   <div className="space-y-2">
                     <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Select New End Date</label>
                     <Input 
                        type="date"
                        className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-black text-slate-700"
                        id="renewalDate"
                        min={new Date(activeBooking.startDate + (activeBooking.duration * 24 * 60 * 60 * 1000) + 86400000).toISOString().split('T')[0]}
                        defaultValue={new Date(activeBooking.startDate + ((activeBooking.duration + 15) * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]}
                     />
                   </div>
                   
                   <div className="p-5 bg-slate-50 rounded-3xl space-y-3">
                     <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                        <span>Base Rate</span>
                        <span className="text-slate-800">₹{activeBooking.priceDetails.baseRate} / unit / day</span>
                     </div>
                     <div className="flex justify-between items-center text-sm font-black text-emerald-700">
                        <span>Min. Renewal Charge</span>
                        <span className="font-black">₹{(activeBooking.priceDetails.baseRate * 15 * (activeBooking.estimatedQuantity/100)).toFixed(0)}*</span>
                     </div>
                     <p className="text-[9px] text-slate-400 font-bold uppercase leading-relaxed pt-2">
                        *Final additional charges are calculated based on number of extra days selected.
                     </p>
                   </div>
                </div>

                <Button 
                  onClick={() => {
                    const dateInput = document.getElementById('renewalDate') as HTMLInputElement;
                    const value = dateInput?.value;
                    if (value) handleRenew(value);
                    else toast.error('Please select a valid date');
                  }}
                  className="w-full h-16 rounded-2xl bg-slate-900 border-b-4 border-slate-950 hover:bg-slate-800 text-white font-black text-lg shadow-xl shadow-slate-200"
                >
                  Confirm Slot Extension
                </Button>
                
                <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-wider">
                   Payment will be settled during final intake withdrawal
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

      </div>
    </Layout>
  );
}
