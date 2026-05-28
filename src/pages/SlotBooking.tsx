import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ArrowLeft, 
  Download, 
  ShieldCheck, 
  Info,
  History,
  Navigation,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  FileText,
  User,
  Phone,
  Package,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { 
  statesAndDistricts, 
  mockMarkets, 
  marketAcceptedProducts, 
  MarketAcceptedProduct,
  getMarketsByDistrict,
  Market 
} from '@/lib/indiaData';
import { auth, db } from '@/lib/firebase';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp, doc, getDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '@/lib/firebaseUtils';
import { useLocationContext } from '@/contexts/LocationContext';
import SafeImage from '@/components/SafeImage';
import { moduleImages } from '@/lib/imageAssets';

interface Booking {
  id?: string;
  marketName: string;
  state: string;
  district: string;
  date: string;
  timeSlot: string;
  cropName: string;
  quantity: string;
  pricePerUnit: number;
  unit: string;
  totalValue: number;
  farmerName: string;
  phoneNumber: string;
  createdAt: number;
}

export default function SlotBooking() {
  const [step, setStep] = useState<'location' | 'markets' | 'products' | 'details' | 'receipt' | 'history'>('location');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedMarket, setSelectedMarket] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<MarketAcceptedProduct | null>(null);
  const [isOtherCrop, setIsOtherCrop] = useState(false);
  const [otherCropName, setOtherCropName] = useState('');
  const [alternativeMarkets, setAlternativeMarkets] = useState<Market[]>([]);
  const [isValidCrop, setIsValidCrop] = useState<boolean | null>(null);
  const [bookingDetails, setBookingDetails] = useState({
    date: '',
    timeSlot: '',
    cropName: '',
    quantity: '',
    farmerName: '',
    phoneNumber: ''
  });
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [history, setHistory] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [autoDownload, setAutoDownload] = useState(false);
  const { location: globalLocation, refreshLocation } = useLocationContext();

  const states = Object.keys(statesAndDistricts);
  const districts = selectedState ? statesAndDistricts[selectedState] : [];
  const filteredMarkets = (selectedState && selectedDistrict) 
    ? getMarketsByDistrict(selectedState, selectedDistrict)
    : [];

  useEffect(() => {
    if (step === 'history') {
      fetchHistory();
    }
    
    // Auto-download receipt if flag is set and we're on receipt step
    if (step === 'receipt' && autoDownload && currentBooking) {
      const timer = setTimeout(() => {
        downloadReceipt();
        setAutoDownload(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [step, autoDownload, currentBooking]);

  const fetchHistory = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'bookings'),
        where('userId', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const bookings: Booking[] = [];
      querySnapshot.forEach((doc) => {
        bookings.push({ id: doc.id, ...doc.data() } as Booking);
      });
      setHistory(bookings);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleDetectLocation = async () => {
    setIsLocating(true);
    try {
      await refreshLocation();
      // Use detected state/district if they exist in our list
      if (globalLocation.state) {
        setSelectedState(globalLocation.state);
        if (globalLocation.district) {
          setSelectedDistrict(globalLocation.district);
        }
      }
      setStep('markets');
      toast.success(`Location detected: ${globalLocation.city}`);
    } catch (error) {
      toast.error('Location detection failed. Please select manually.');
    } finally {
      setIsLocating(false);
    }
  };

  const openMarketRoute = (market: Market) => {
    // We use the user's current city/district as origin if available, or just the market address
    const origin = globalLocation.city ? `${globalLocation.city}, ${globalLocation.state}` : '';
    const destination = encodeURIComponent(`${market.name}, ${market.address}`);
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${destination}&travelmode=driving`;
    window.open(url, '_blank', 'noreferrer');
  };

  const validateOtherCrop = (cropName: string) => {
    if (!selectedMarket || !cropName.trim()) return;
    
    const isAccepted = selectedMarket.acceptedCrops.some(
      (c: string) => c.toLowerCase().includes(cropName.toLowerCase()) || cropName.toLowerCase().includes(c.toLowerCase())
    );
    
    setIsValidCrop(isAccepted);
    
    if (!isAccepted) {
      // Find alternative markets in the SAME district that accept this crop
      const others = mockMarkets.filter(m => 
        m.id !== selectedMarket.id && 
        m.district === selectedMarket.district &&
        m.acceptedCrops.some(c => c.toLowerCase().includes(cropName.toLowerCase()) || cropName.toLowerCase().includes(c.toLowerCase()))
      );
      setAlternativeMarkets(others);
    } else {
      setAlternativeMarkets([]);
    }
  };

  const handleBooking = async () => {
    if (!bookingDetails.date || !bookingDetails.timeSlot || !bookingDetails.quantity || !bookingDetails.farmerName || !bookingDetails.phoneNumber) {
      toast.error('Please fill all details');
      return;
    }

    setLoading(true);
    const totalValue = isOtherCrop ? 0 : Number(bookingDetails.quantity) * (selectedProduct?.price || 0);
    
    const bookingData: any = {
      userId: auth.currentUser?.uid,
      marketName: selectedMarket.name,
      state: selectedState,
      district: selectedDistrict,
      cropName: isOtherCrop ? otherCropName : (selectedProduct?.name || bookingDetails.cropName),
      pricePerUnit: isOtherCrop ? 0 : (selectedProduct?.price || 0),
      unit: isOtherCrop ? 'quintal' : (selectedProduct?.unit || 'quintal'),
      totalValue,
      ...bookingDetails,
      createdAt: Date.now()
    };

    try {
      const docRef = await addDoc(collection(db, 'bookings'), bookingData);
      const finalBooking = { id: docRef.id, ...bookingData };
      setCurrentBooking(finalBooking);
      setStep('receipt');
      toast.success('Slot booked successfully!');

      // Fetch user profile for phone number if available
      let userPhone = auth.currentUser?.phoneNumber || '';
      if (!userPhone) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser!.uid));
        if (userDoc.exists()) {
          userPhone = userDoc.data().phone;
        }
      }

      // Trigger SMS/WhatsApp notifications
      if (userPhone) {
        try {
          await fetch('/api/send-receipt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ booking: finalBooking, userPhone })
          });
        } catch (e) {
          console.error('Notification failed', e);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'bookings');
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = async () => {
    const element = document.getElementById('receipt-content');
    if (!element) return;

    setLoading(true);
    try {
      const canvas = await html2canvas(element, {
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
      pdf.save(`AgriEasy_Receipt_${currentBooking?.id?.slice(-8).toUpperCase() || 'Booking'}.pdf`);
      toast.success('Receipt downloaded successfully');
    } catch (error) {
      console.error('PDF Generation Error:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderLocationStep = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="relative min-h-[160px] overflow-hidden rounded-[28px] bg-emerald-900 p-6 text-white shadow-sm">
        <SafeImage src={moduleImages.slotBooking} alt="Agricultural market yard for slot booking" className="absolute inset-0 h-full w-full opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-900/75 to-emerald-900/20" />
        <div className="relative max-w-xl">
          <Badge className="mb-3 bg-white/15 text-white border-none backdrop-blur">Mandi arrival slots</Badge>
          <h2 className="text-2xl font-black">Book a clean arrival window at your nearest market yard</h2>
          <p className="mt-2 text-sm leading-6 text-emerald-50">Select state, district, market, crop, and time slot before taking produce to the mandi.</p>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-[24px] bg-white overflow-hidden">
        <CardHeader className="bg-emerald-600 text-white p-6">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-6 w-6" />
            Select Your Location
          </CardTitle>
          <p className="text-emerald-100 text-sm">Find the nearest Mandi for your produce.</p>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <div className="text-center space-y-4">
            <Button 
              onClick={handleDetectLocation}
              disabled={isLocating}
              className="w-full h-14 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-2 border-emerald-200 rounded-2xl font-bold gap-2"
            >
              <Navigation className={`h-5 w-5 ${isLocating ? 'animate-spin' : ''}`} />
              {isLocating ? 'Detecting Location...' : 'Detect My Location'}
            </Button>
            <div className="flex items-center gap-4 text-[#7F8C8D]">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs font-bold uppercase">OR SELECT MANUALLY</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[#7F8C8D] ml-1">State</Label>
              <Select 
              value={selectedState}
              onValueChange={(val) => { setSelectedState(val); setSelectedDistrict(''); }}
            >
                <SelectTrigger className="h-12 rounded-xl border-emerald-100 bg-white">
                  <SelectValue placeholder="Choose State" />
                </SelectTrigger>
                <SelectContent>
                  {states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[#7F8C8D] ml-1">District</Label>
              <Select 
                onValueChange={setSelectedDistrict} 
                disabled={!selectedState}
                value={selectedDistrict}
              >
                <SelectTrigger className="h-12 rounded-xl border-emerald-100 bg-white">
                  <SelectValue placeholder="Choose District" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            disabled={!selectedDistrict}
            onClick={() => setStep('markets')}
            className="w-full h-14 bg-[#2D5A27] hover:bg-[#1E3D1A] text-white rounded-2xl font-bold shadow-lg shadow-[#2D5A27]/20"
          >
            Find Markets
          </Button>
        </CardContent>
      </Card>

      <Button 
        variant="ghost" 
        onClick={() => setStep('history')}
        className="w-full text-[#7F8C8D] hover:text-[#2D5A27] hover:bg-emerald-50 rounded-xl"
      >
        <History className="h-4 w-4 mr-2" /> View Booking History
      </Button>
    </motion.div>
  );

  const renderMarketStep = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setStep('location')} className="text-[#7F8C8D] hover:text-[#2D5A27]">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Location
        </Button>
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 px-4 py-1.5 rounded-full font-bold">
          {selectedDistrict}, {selectedState}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredMarkets.length > 0 ? (
          filteredMarkets.map((market) => (
            <Card 
              key={market.id} 
              className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer rounded-[24px] overflow-hidden bg-white group"
              onClick={() => { setSelectedMarket(market); setStep('products'); }}
            >
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    🏪
                  </div>
                  <div>
                    <h4 className="font-bold text-[#2C3E50]">{market.name}</h4>
                    <p className="text-[10px] text-[#7F8C8D] font-bold mt-0.5">{market.address}</p>
                    <div className="flex items-center gap-3 text-xs text-[#7F8C8D] mt-2">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {market.distance} km away
                      </span>
                      <span className="flex items-center gap-1 text-emerald-600 font-medium font-bold">
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-none text-[9px] flex items-center gap-1">
                          <CheckCircle2 className="h-2 w-2" /> {market.type}
                        </Badge>
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-[#2D5A27] group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-[32px] border-2 border-dashed border-gray-100">
            <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
            <h4 className="font-black text-[#2C3E50]">No Markets Found</h4>
            <p className="text-sm text-[#7F8C8D] mt-1">We couldn't find any registered Mandis in this district.</p>
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderProductsStep = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setStep('markets')} className="text-[#7F8C8D] hover:text-[#2D5A27]">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Markets
        </Button>
      </div>

      {/* Market Route Section */}
      <Card className="border-none shadow-sm rounded-[32px] bg-white overflow-hidden">
        <div className="bg-[#2D5A27] p-6 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black">{selectedMarket?.name}</h3>
            <p className="text-emerald-100 text-xs flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" /> {selectedMarket?.address}
            </p>
          </div>
          <Badge className="bg-white/20 text-white border-none font-bold uppercase text-[10px]">
            {selectedMarket?.type}
          </Badge>
        </div>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="flex gap-8">
              <div>
                <p className="text-[10px] font-black text-[#7F8C8D] uppercase tracking-widest">Distance</p>
                <p className="text-xl font-black text-[#2C3E50]">{selectedMarket?.distance} km</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-[#7F8C8D] uppercase tracking-widest">Travel Time</p>
                <p className="text-xl font-black text-[#2C3E50]">{Math.round(selectedMarket?.distance * 2.5)} mins</p>
              </div>
            </div>
            <Button 
              onClick={() => openMarketRoute(selectedMarket)}
              className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 rounded-xl px-6 font-bold flex items-center gap-2"
            >
              <Navigation className="h-4 w-4" /> View Route in Google Maps
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
          <h3 className="font-black text-[#2C3E50] flex items-center gap-2">
            <Package className="h-5 w-5 text-emerald-600" />
            Select Your Crop
          </h3>
          <p className="text-xs text-[#7F8C8D] mt-1">Choose a crop to see current pricing or select "Other" if not listed.</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {marketAcceptedProducts.map((product) => (
            <Card 
              key={product.id}
              className={`border-2 transition-all cursor-pointer rounded-[24px] overflow-hidden bg-white group ${
                !isOtherCrop && selectedProduct?.id === product.id ? 'border-emerald-500 shadow-md ring-4 ring-emerald-50' : 'border-gray-50 shadow-sm hover:border-emerald-100'
              }`}
              onClick={() => {
                setSelectedProduct(product);
                setIsOtherCrop(false);
                setOtherCropName('');
                setIsValidCrop(null);
                setAlternativeMarkets([]);
              }}
            >
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <h4 className="font-black text-[#2C3E50] text-lg">{product.name}</h4>
                    <div className="flex items-center gap-3">
                      <Badge className={`${
                        product.demand === 'High' ? 'bg-orange-100 text-orange-700' :
                        product.demand === 'Medium' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      } border-none font-bold text-[10px]`}>
                        {product.demand} Demand
                      </Badge>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-[#7F8C8D]">
                        {product.trend === 'up' ? <TrendingUp className="h-3 w-3 text-emerald-500" /> : 
                         product.trend === 'down' ? <TrendingDown className="h-3 w-3 text-rose-500" /> : 
                         <Minus className="h-3 w-3 text-amber-500" />}
                        {product.trend.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-[#2D5A27]">₹{product.price}</p>
                    <p className="text-[10px] text-[#7F8C8D] font-bold">PER {product.unit.toUpperCase()}</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex gap-2">
                    {product.lastThreeDays.map((p, i) => (
                      <div key={i} className="px-2 py-1 bg-gray-50 rounded-lg text-[9px] font-bold text-[#7F8C8D]">
                        ₹{p}
                      </div>
                    ))}
                    <span className="text-[9px] text-[#7F8C8D] flex items-center underline">3 Day Trend</span>
                  </div>
                  <Button 
                    size="sm" 
                    className={`${selectedProduct?.id === product.id ? 'bg-emerald-600' : 'bg-[#F0F4EF] text-emerald-700 hover:bg-emerald-100'} rounded-xl px-6 font-bold`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProduct(product);
                      setStep('details');
                    }}
                  >
                    Select
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Other Crop Option */}
          <Card 
            className={`border-2 transition-all cursor-pointer rounded-[24px] overflow-hidden bg-white group ${
              isOtherCrop ? 'border-emerald-500 shadow-md ring-4 ring-emerald-50' : 'border-gray-50 shadow-sm hover:border-emerald-100'
            }`}
            onClick={() => {
              setIsOtherCrop(true);
              setSelectedProduct(null);
            }}
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-xl">🌱</div>
                <div>
                  <h4 className="font-black text-[#2C3E50]">Other Crop</h4>
                  <p className="text-[10px] text-[#7F8C8D] font-bold">Manual name entry</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                className={`${isOtherCrop ? 'text-emerald-600 font-black' : 'text-[#7F8C8D]'}`}
              >
                Select
              </Button>
            </CardContent>
          </Card>

          {/* Manual Input for Other Crop */}
          <AnimatePresence>
            {isOtherCrop && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <Card className="border-none shadow-sm rounded-[24px] bg-white p-6 space-y-4 border border-emerald-50">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-[#2C3E50]">Enter Crop / Product Name</Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="e.g. Saffron, Garlic, etc."
                        className="h-12 rounded-xl border-emerald-100 bg-gray-50/50"
                        value={otherCropName}
                        onChange={(e) => {
                          setOtherCropName(e.target.value);
                          setIsValidCrop(null);
                        }}
                      />
                      <Button 
                        onClick={() => validateOtherCrop(otherCropName)}
                        className="h-12 rounded-xl bg-emerald-600 px-6 font-bold"
                      >
                        Check Availability
                      </Button>
                    </div>
                  </div>

                  {/* Validation Messages */}
                  {isValidCrop === true && (
                    <div className="bg-emerald-50 p-4 rounded-xl flex items-start gap-3 border border-emerald-100">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-emerald-800 font-bold text-sm">Supported!</p>
                        <p className="text-xs text-emerald-600">The {selectedMarket?.name} accepts {otherCropName}. You may proceed with the booking.</p>
                      </div>
                    </div>
                  )}

                  {isValidCrop === false && (
                    <div className="space-y-4">
                      <div className="bg-rose-50 p-4 rounded-xl flex items-start gap-3 border border-rose-100">
                        <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-rose-800 font-bold text-sm">Not Currently Accepted</p>
                          <p className="text-xs text-rose-600">This market may not currently accept {otherCropName}. Please choose another market or another crop.</p>
                        </div>
                      </div>

                      {/* Alternative Market Suggestions */}
                      {alternativeMarkets.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-xs font-black text-[#7F8C8D] uppercase tracking-widest px-1">Nearby Alternative Markets</p>
                          <div className="grid grid-cols-1 gap-3">
                            {alternativeMarkets.map(m => (
                              <Card key={m.id} className="border-none bg-[#FDFEFA] shadow-sm p-4 rounded-2xl flex items-center justify-between border border-emerald-50">
                                <div>
                                  <h5 className="font-black text-[#2C3E50] text-sm">{m.name}</h5>
                                  <p className="text-[10px] text-[#7F8C8D] font-bold">{m.district} • {m.distance} km away</p>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-emerald-700 font-bold hover:bg-emerald-50"
                                  onClick={() => {
                                    setSelectedMarket(m);
                                    setStep('products');
                                    setIsOtherCrop(false);
                                    setOtherCropName('');
                                    setIsValidCrop(null);
                                    setAlternativeMarkets([]);
                                  }}
                                >
                                  Go to Market <ArrowRight className="h-3 w-3 ml-2" />
                                </Button>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {isValidCrop === true && (
                    <Button 
                      onClick={() => setStep('details')}
                      className="w-full h-12 bg-[#2D5A27] text-white rounded-xl font-bold"
                    >
                      Continue Booking <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );

  const renderDetailsStep = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      <Button variant="ghost" onClick={() => setStep('products')} className="text-[#7F8C8D] hover:text-[#2D5A27]">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Products
      </Button>

      <Card className="border-none shadow-sm rounded-[32px] bg-white overflow-hidden">
        <CardHeader className="bg-[#2D5A27] p-8 text-white">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-black">{selectedMarket?.name}</CardTitle>
              <p className="text-emerald-100 text-sm flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" /> {selectedDistrict}, {selectedState}
              </p>
            </div>
            <div className="bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-sm text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-200">
                {isOtherCrop ? 'Price at Market' : 'Price Locked'}
              </p>
              <p className="text-xl font-black">
                {isOtherCrop ? 'TBD' : `₹${selectedProduct?.price}`}
                {!isOtherCrop && <span className="text-xs font-normal"> / {selectedProduct?.unit}</span>}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Farmer Info */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-[#7F8C8D] uppercase tracking-widest flex items-center gap-2">
                <User className="h-3 w-3 text-emerald-600" /> Farmer Personal Details
              </h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-[#2C3E50]">Full Name</Label>
                  <Input 
                    placeholder="Enter your name as per Aadhar"
                    className="h-12 rounded-xl border-emerald-100 bg-gray-50/50"
                    value={bookingDetails.farmerName}
                    onChange={(e) => setBookingDetails({ ...bookingDetails, farmerName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-[#2C3E50]">Phone Number</Label>
                  <Input 
                    placeholder="Enter 10-digit mobile number"
                    className="h-12 rounded-xl border-emerald-100 bg-gray-50/50"
                    value={bookingDetails.phoneNumber}
                    onChange={(e) => setBookingDetails({ ...bookingDetails, phoneNumber: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Slot Info */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-[#7F8C8D] uppercase tracking-widest flex items-center gap-2">
                <Calendar className="h-3 w-3 text-emerald-600" /> Booking Slot Information
              </h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-[#2C3E50]">Select Date</Label>
                  <Input 
                    type="date" 
                    min={new Date().toISOString().split('T')[0]}
                    className="h-12 rounded-xl border-emerald-100 bg-gray-50/50"
                    value={bookingDetails.date}
                    onChange={(e) => setBookingDetails({ ...bookingDetails, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-[#2C3E50]">Time Slot</Label>
                  <Select 
                    value={bookingDetails.timeSlot}
                    onValueChange={(val) => setBookingDetails({ ...bookingDetails, timeSlot: val })}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-emerald-100 bg-gray-50/50">
                      <SelectValue placeholder="Choose Arrival Window" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Morning (8 AM - 12 PM)">Morning (8 AM - 12 PM)</SelectItem>
                      <SelectItem value="Afternoon (12 PM - 4 PM)">Afternoon (12 PM - 4 PM)</SelectItem>
                      <SelectItem value="Evening (4 PM - 8 PM)">Evening (4 PM - 8 PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Produce Info */}
            <div className="md:col-span-2 space-y-4 bg-emerald-50/30 p-6 rounded-[24px] border border-emerald-50">
              <h4 className="text-xs font-black text-[#7F8C8D] uppercase tracking-widest flex items-center gap-2">
                <Package className="h-3 w-3 text-emerald-600" /> Quantity & Valuation
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-[#2C3E50]">
                    Estimated Quantity ({isOtherCrop ? 'quintal' : selectedProduct?.unit}s)
                  </Label>
                  <div className="relative">
                    <Input 
                      type="number"
                      placeholder="e.g. 50"
                      className="h-12 rounded-xl border-emerald-200 pr-12 text-lg font-black"
                      value={bookingDetails.quantity}
                      onChange={(e) => setBookingDetails({ ...bookingDetails, quantity: e.target.value })}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#7F8C8D]">
                      {isOtherCrop ? 'QUINTAL' : selectedProduct?.unit.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-100">
                  <p className="text-[10px] font-bold text-[#7F8C8D] uppercase tracking-wider">Estimated Total Value</p>
                  <p className="text-2xl font-black text-[#2D5A27]">
                    {isOtherCrop ? 'Calculating...' : `₹${(Number(bookingDetails.quantity) * (selectedProduct?.price || 0)).toLocaleString()}`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleBooking}
            disabled={loading}
            className="w-full h-16 bg-[#2D5A27] hover:bg-[#1E3D1A] text-white rounded-[20px] font-black text-lg shadow-xl shadow-emerald-900/10 transition-all active:scale-[0.98]"
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Processing Booking...
              </div>
            ) : 'Confirm and Generate Receipt'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderReceiptStep = () => (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
      <div id="receipt-content">
        <Card 
          className="border-none rounded-[40px] overflow-hidden bg-white"
          style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
        >
          <div className="bg-[#065f46] p-10 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
              <div className="grid grid-cols-6 h-full"> 
                {[...Array(24)].map((_, i) => <div key={i} className="border border-[rgba(255,255,255,0.1)]" />)}
              </div>
            </div>
            
            <div className="bg-[rgba(4,120,87,0.5)] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-3xl font-black tracking-tight">Booking Successful!</h2>
            <p className="text-[#a7f3d0] font-bold mt-2 uppercase tracking-widest text-[10px]">Your Market Slot is Confirmed</p>
            
            <div className="mt-8 flex justify-center gap-2">
              <div className="bg-[rgba(6,78,59,0.4)] px-4 py-2 rounded-full">
                <p className="text-[10px] text-[#a7f3d0] font-bold uppercase">Booking ID</p>
                <p className="font-mono text-lg font-black">{currentBooking?.id?.slice(-8).toUpperCase()}</p>
              </div>
            </div>
          </div>
          
          <CardContent className="p-10 space-y-10">
            {/* Invoice Header */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-8">
              <div className="space-y-1">
                <h1 className="text-3xl font-black text-[#2D5A27] italic">AgriEasy Receipt</h1>
                <p className="text-[#7F8C8D] text-sm">Issued to: <span className="font-bold text-[#2C3E50]">{currentBooking?.farmerName}</span></p>
                <p className="text-[#7F8C8D] text-xs">Contact: {currentBooking?.phoneNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-[#7F8C8D] uppercase tracking-widest">Date Issued</p>
                <p className="font-black text-[#2C3E50]">{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Market Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-[#7F8C8D] uppercase tracking-[0.2em] flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-[#059669]" /> Destination Market
                </p>
                <div className="bg-[#F8F9F3] p-6 rounded-[24px] border border-[#d1fae5]">
                  <h4 className="text-xl font-black text-[#2C3E50]">{currentBooking?.marketName}</h4>
                  <p className="text-[#7F8C8D] text-sm mt-1">{currentBooking?.district}, {currentBooking?.state}</p>
                  <div className="flex items-center gap-4 mt-6">
                    <div>
                      <p className="text-[10px] text-[#7F8C8D] font-bold uppercase">Reporting Date</p>
                      <p className="font-black text-[#2C3E50]">{currentBooking?.date}</p>
                    </div>
                    <div className="h-8 w-px bg-gray-200" />
                    <div>
                      <p className="text-[10px] text-[#7F8C8D] font-bold uppercase">Time Window</p>
                      <p className="font-black text-[#2C3E50]">{currentBooking?.timeSlot}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black text-[#7F8C8D] uppercase tracking-[0.2em] flex items-center gap-2">
                  <Package className="h-3 w-3 text-[#059669]" /> Produce Assessment
                </p>
                <div className="bg-gray-50 p-6 rounded-[24px] border border-gray-100 flex flex-col justify-between h-full">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xl font-black text-[#2C3E50]">{currentBooking?.cropName}</h4>
                      <p className="text-[#7F8C8D] text-sm font-bold uppercase">Qty: {currentBooking?.quantity} {currentBooking?.unit}s</p>
                    </div>
                      <div className="text-right">
                        <p className="text-[10px] text-[#7F8C8D] font-bold uppercase">Market Price</p>
                        <p className="font-black text-[#2D5A27]">
                          {currentBooking?.pricePerUnit === 0 ? 'Market determined' : `₹${currentBooking?.pricePerUnit.toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="mt-8 pt-4 border-t border-gray-200 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-[#7F8C8D] uppercase tracking-wider">Estimated Total Value</span>
                      <span className="text-2xl font-black text-[#2D5A27]">
                        {currentBooking?.totalValue === 0 ? 'TBD' : `₹${currentBooking?.totalValue.toLocaleString()}`}
                      </span>
                    </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-100" />
                <h4 className="font-black text-[#2D5A27] text-xs uppercase tracking-[0.3em] flex items-center gap-2">
                  <Info className="h-4 w-4" /> Transit & Arrival Instructions
                </h4>
                <div className="h-px flex-1 bg-gray-100" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-[#2C3E50]">What to Carry:</h5>
                  <ul className="space-y-2 text-xs text-[#7F8C8D]">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-[#10b981]" /> This digital or printed receipt
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-[#10b981]" /> Original Aadhar Card
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-[#10b981]" /> Farmer Registration Number
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-[#10b981]" /> Recent Bank Passbook Copy
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-[#2C3E50]">Gate Protocol:</h5>
                  <ul className="space-y-2 text-xs text-[#7F8C8D]">
                    <li className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-[#10b981]" /> Report 30 mins before your window
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-[#10b981]" /> Ensure vehicle weight is recorded
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-[#10b981]" /> Collect Tokens from Entry Gate #2
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
          <div className="bg-gray-50 p-6 text-center text-[#7F8C8D] text-[10px] font-bold border-t border-gray-100 flex items-center justify-center gap-6">
            <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> VERIFIED MARKET SLOT</span>
            <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> DIGITAL TRANSACTION COMPLIANT</span>
          </div>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 pt-4">
        <Button 
          disabled={loading}
          onClick={downloadReceipt}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-14 font-black transition-transform active:scale-95"
          style={{ boxShadow: '0 10px 15px -3px rgba(5, 150, 105, 0.1), 0 4px 6px -4px rgba(5, 150, 105, 0.1)' }}
        >
          {loading ? 'Generating PDF...' : <><Download className="h-5 w-5 mr-3" /> Download PDF Receipt</>}
        </Button>
        <Button variant="outline" onClick={() => setStep('location')} className="flex-1 border-[#2D5A27] text-[#2D5A27] hover:bg-[#F0F4EF] rounded-2xl h-14 font-black">
          Return to Dashboard
        </Button>
      </div>
    </motion.div>
  );

  const renderHistoryStep = () => (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setStep('location')} className="text-[#7F8C8D] hover:text-[#2D5A27]">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h3 className="text-xl font-black text-[#2C3E50]">Booking History</h3>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
            <p className="text-sm font-bold text-[#7F8C8D]">Loading your journey...</p>
          </div>
        ) : history.length > 0 ? (
          history.map((item) => (
            <Card key={item.id} className="border-none shadow-sm rounded-[32px] bg-white overflow-hidden group hover:shadow-md transition-all">
              <CardContent className="p-0">
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-[#F8F9F3] rounded-[24px] flex flex-col items-center justify-center border border-emerald-50">
                      <p className="text-[10px] font-black text-[#7F8C8D] uppercase">{item.date.split('-')[1]}</p>
                      <p className="text-2xl font-black text-[#2D5A27] leading-none">{item.date.split('-')[2]}</p>
                    </div>
                    <div>
                      <h4 className="font-black text-[#2C3E50]">{item.marketName}</h4>
                      <p className="text-xs text-[#7F8C8D] font-bold mt-0.5">{item.cropName} • {item.quantity} Qtl</p>
                      <div className="flex items-center gap-3 mt-3">
                        <Badge className="bg-emerald-50 text-emerald-700 border-none font-bold text-[10px]">Confirmed</Badge>
                        <span className="text-[10px] text-[#7F8C8D] flex items-center gap-1 font-bold">
                          <Clock className="h-3 w-3" /> {item.timeSlot.split(' ')[0]}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-emerald-700 font-black hover:bg-emerald-50 rounded-xl px-4"
                      onClick={() => {
                        setCurrentBooking(item);
                        setStep('receipt');
                      }}
                    >
                      View Receipt
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-emerald-100 text-emerald-700 font-bold hover:bg-emerald-50 rounded-xl px-4"
                      onClick={() => {
                        setCurrentBooking(item);
                        setAutoDownload(true);
                        setStep('receipt');
                      }}
                    >
                      <Download className="h-3 w-3 mr-2" /> PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-32 bg-white rounded-[48px] border-2 border-dashed border-gray-100">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">📭</div>
            <h4 className="text-2xl font-black text-[#2C3E50]">No bookings found</h4>
            <p className="text-[#7F8C8D] max-w-xs mx-auto mt-2 text-sm">Your market activity and slot receipts will be safely stored right here.</p>
            <Button onClick={() => setStep('location')} className="mt-8 bg-[#2D5A27] text-white rounded-2xl h-12 px-8 font-black">
              Start Booking Now
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <Layout title="Slot Booking">
      <div className="max-w-3xl mx-auto pb-12 px-4">
        <AnimatePresence mode="wait">
          {step === 'location' && renderLocationStep()}
          {step === 'markets' && renderMarketStep()}
          {step === 'products' && renderProductsStep()}
          {step === 'details' && renderDetailsStep()}
          {step === 'receipt' && renderReceiptStep()}
          {step === 'history' && renderHistoryStep()}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
