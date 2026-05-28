import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Phone, 
  MapPin, 
  Globe, 
  Save, 
  Edit2, 
  LogOut, 
  Warehouse, 
  Receipt, 
  RefreshCw, 
  ChevronRight, 
  Clock, 
  Package,
  Weight,
  Thermometer,
  ShieldCheck,
  CheckCircle2,
  X,
  Store,
  Calendar,
  Download
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '@/lib/firebaseUtils';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { UserProfile, ColdStorageBooking } from '@/types';
import { indiaData } from '@/lib/indiaData';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import SafeImage from '@/components/SafeImage';
import { moduleImages } from '@/lib/imageAssets';

export default function Profile() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<ColdStorageBooking[]>([]);
  const [mandiBookings, setMandiBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [bookingType, setBookingType] = useState<'cold' | 'mandi' | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    displayName: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    location: {
      state: 'Telangana',
      district: 'Hyderabad'
    },
    language: 'English'
  });

  const states = Object.keys(indiaData).sort();
  const districts = profile.location?.state ? indiaData[profile.location.state] : [];

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      try {
        // Fetch Profile
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }

        // Fetch Cold Storage Bookings
        const bQuery = query(collection(db, 'cold_storage_bookings'), where('userId', '==', user.uid));
        const bSnap = await getDocs(bQuery);
        setBookings(bSnap.docs.map(d => ({ id: d.id, ...d.data() } as ColdStorageBooking)));

        // Fetch Mandi Bookings
        const mQuery = query(collection(db, 'bookings'), where('userId', '==', user.uid));
        const mSnap = await getDocs(mQuery);
        setMandiBookings(mSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...profile,
        uid: user.uid,
        updatedAt: Date.now()
      }, { merge: true });
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  if (loading) return <Layout title="Profile"><div className="flex justify-center p-12">Loading...</div></Layout>;

  return (
    <Layout title="My Profile">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card className="border-none shadow-sm rounded-[24px] overflow-hidden bg-white">
          <div className="h-36 relative bg-gradient-to-r from-[#7FB069] to-[#2D5A27] overflow-hidden">
            <SafeImage src={moduleImages.profile} alt="Farmer account profile" className="absolute inset-0 h-full w-full opacity-35" />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/70 to-emerald-700/25" />
          </div>
          <CardContent className="relative pt-12 pb-6 px-8">
            <div className="absolute -top-12 left-8">
              <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                <AvatarImage src={user?.photoURL || ''} />
                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-2xl font-bold">
                  {profile.displayName?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-[#2C3E50]">{profile.displayName}</h2>
                <p className="text-[#7F8C8D]">{profile.email}</p>
              </div>
              <Button 
                variant={isEditing ? "outline" : "default"}
                className={isEditing ? "border-emerald-100 text-emerald-700" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              >
                {isEditing ? <><Save className="h-4 w-4 mr-2" /> Save</> : <><Edit2 className="h-4 w-4 mr-2" /> Edit</>}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="border-none shadow-sm rounded-[24px] bg-white">
          <CardHeader>
            <CardTitle className="text-lg text-[#2D5A27]">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[#7F8C8D]">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
                  <Input 
                    disabled={!isEditing}
                    value={profile.displayName || ''}
                    onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                    className="pl-10 rounded-xl border-emerald-100 disabled:bg-gray-50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[#7F8C8D]">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
                  <Input 
                    disabled={!isEditing}
                    value={profile.phone || ''}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="pl-10 rounded-xl border-emerald-100 disabled:bg-gray-50"
                    placeholder="+91 00000 00000"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[#7F8C8D]">State</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600 z-10" />
                  <Select 
                    disabled={!isEditing}
                    value={profile.location?.state}
                    onValueChange={(val) => setProfile({ ...profile, location: { ...profile.location!, state: val, district: indiaData[val][0] } })}
                  >
                    <SelectTrigger className="pl-10 rounded-xl border-emerald-100 disabled:bg-gray-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[#7F8C8D]">District</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600 z-10" />
                  <Select 
                    disabled={!isEditing}
                    value={profile.location?.district}
                    onValueChange={(val) => setProfile({ ...profile, location: { ...profile.location!, district: val } })}
                  >
                    <SelectTrigger className="pl-10 rounded-xl border-emerald-100 disabled:bg-gray-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {districts?.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[#7F8C8D]">Preferred Language</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600 z-10" />
                  <Select 
                    disabled={!isEditing}
                    value={profile.language}
                    onValueChange={(val) => setProfile({ ...profile, language: val })}
                  >
                    <SelectTrigger className="pl-10 rounded-xl border-emerald-100 disabled:bg-gray-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Hindi">Hindi</SelectItem>
                      <SelectItem value="Marathi">Marathi</SelectItem>
                      <SelectItem value="Punjabi">Punjabi</SelectItem>
                      <SelectItem value="Telugu">Telugu</SelectItem>
                      <SelectItem value="Tamil">Tamil</SelectItem>
                      <SelectItem value="Kannada">Kannada</SelectItem>
                      <SelectItem value="Bengali">Bengali</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <Button 
                variant="ghost" 
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" /> Logout from AgriEasy
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cold Storage Bookings Section */}
        <Card className="border-none shadow-sm rounded-[24px] bg-white overflow-hidden">
          <CardHeader className="bg-emerald-50/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-[#2D5A27] flex items-center gap-2">
                <Warehouse className="h-5 w-5" />
                My Cold Storage Bookings
              </CardTitle>
              <Badge variant="outline" className="bg-white text-emerald-600 border-emerald-100">
                {bookings.length} active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {bookings.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Package className="h-10 w-10 text-gray-200 mx-auto" />
                <p className="text-gray-500 text-sm">No storage bookings found.</p>
                <Button variant="link" onClick={() => navigate('/cold-storage')} className="text-emerald-600">
                  Find nearby cold storages
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {bookings.map((booking) => (
                  <div key={booking.id} className="p-6 hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => { setSelectedBooking(booking); setShowReceipt(true); }}>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="font-bold text-gray-800 flex items-center gap-2">
                          {booking.storageName}
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[10px] h-4">
                            {booking.status}
                          </Badge>
                        </h4>
                        <p className="text-xs text-slate-500">{booking.cropName} • {booking.estimatedQuantity} {booking.unit}</p>
                        <div className="flex items-center gap-3 pt-2">
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            <Clock className="h-3 w-3" />
                            Ends on {new Date(booking.startDate + (booking.duration * 24 * 60 * 60 * 1000)).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <span className="font-bold text-emerald-700">₹{booking.priceDetails?.totalAmount.toLocaleString() || '0'}</span>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 text-[10px] rounded-lg gap-1 border-emerald-100 text-emerald-700 hover:bg-emerald-50"
                        >
                          <Receipt className="h-3 w-3" />
                          View Receipt
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mandi Slot Bookings Section */}
        <Card className="border-none shadow-sm rounded-[24px] bg-white overflow-hidden">
          <CardHeader className="bg-blue-50/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
                <Store className="h-5 w-5 text-blue-600" />
                My Mandi Slot Bookings
              </CardTitle>
              <Badge variant="outline" className="bg-white text-blue-600 border-blue-100">
                {mandiBookings.length} total
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {mandiBookings.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Calendar className="h-10 w-10 text-gray-200 mx-auto" />
                <p className="text-gray-500 text-sm">No mandi bookings found.</p>
                <Button variant="link" onClick={() => navigate('/slot-booking')} className="text-blue-600">
                  Book a market slot
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {mandiBookings.map((mb) => (
                  <div key={mb.id} className="p-6 hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => { setSelectedBooking(mb); setBookingType('mandi'); setShowReceipt(true); }}>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="font-bold text-gray-800 flex items-center gap-2">
                          {mb.marketName}
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-[10px] h-4">
                            Confirmed
                          </Badge>
                        </h4>
                        <p className="text-xs text-slate-500">{mb.cropName} • {mb.quantity} Quintals</p>
                        <div className="flex items-center gap-3 pt-2">
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            <Clock className="h-3 w-3" />
                            {mb.date} • {mb.timeSlot}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <span className="text-[10px] font-bold text-gray-400">ID: {mb.id?.slice(-8).toUpperCase()}</span>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 text-[10px] rounded-lg gap-1 border-blue-100 text-blue-700 hover:bg-blue-50"
                        >
                          <Receipt className="h-3 w-3" />
                          View Receipt
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Receipt Dialog */}
        <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
          <DialogContent className="max-w-md bg-white p-0 overflow-hidden rounded-[24px]">
            {selectedBooking && bookingType === 'cold' && (
              <div className="flex flex-col">
                <div className="bg-emerald-600 p-6 text-white text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">Booking Receipt</h3>
                  <p className="text-emerald-100 text-sm mt-1">Booking ID: {selectedBooking.id?.slice(-8).toUpperCase()}</p>
                </div>
                
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start pb-4 border-b border-dashed border-gray-100">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Cold Storage</p>
                        <p className="font-bold text-gray-800">{selectedBooking.storageName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Status</p>
                        <Badge className="bg-emerald-50 text-emerald-600 border-none">{selectedBooking.status}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Farmer</p>
                        <p className="text-sm font-medium text-gray-800">{selectedBooking.farmerName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Phone</p>
                        <p className="text-sm font-medium text-gray-800">{selectedBooking.farmerPhone}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Crop</p>
                        <p className="text-sm font-medium text-gray-800">{selectedBooking.cropName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Quantity</p>
                        <p className="text-sm font-medium text-gray-800">{selectedBooking.estimatedQuantity} {selectedBooking.unit}</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg shadow-sm">
                          <Clock className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Duration</p>
                          <p className="text-xs font-bold text-slate-700">{selectedBooking.duration} Days</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Start Date</p>
                        <p className="text-xs font-bold text-slate-700">{new Date(selectedBooking.startDate).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                       <p className="text-[10px] font-bold text-gray-400 uppercase">Cost Breakdown</p>
                       <div className="space-y-1.5">
                         <div className="flex justify-between text-xs">
                           <span className="text-gray-500">Storage Fee</span>
                           <span className="font-medium">₹{selectedBooking.priceDetails?.storageFee.toLocaleString() || '0'}</span>
                         </div>
                         <div className="flex justify-between text-xs">
                           <span className="text-gray-500">Loading/Unloading</span>
                           <span className="font-medium">₹{selectedBooking.priceDetails?.loadingCharge.toLocaleString() || '0'}</span>
                         </div>
                         <div className="flex justify-between text-xs">
                           <span className="text-gray-500">Security & Insurance</span>
                           <span className="font-medium">₹{selectedBooking.priceDetails?.insuranceCharge.toLocaleString() || '0'}</span>
                         </div>
                         {selectedBooking.renewals && selectedBooking.renewals.length > 0 && (
                           <div className="flex justify-between text-xs text-orange-600 font-medium">
                             <span>Renewal Extensions ({selectedBooking.renewals.length})</span>
                             <span>₹{selectedBooking.renewals.reduce((acc, r) => acc + r.extraCharge, 0).toLocaleString()}</span>
                           </div>
                         )}
                         <div className="flex justify-between text-base font-bold text-emerald-700 pt-2 border-t border-dashed border-gray-100">
                           <span>Total Paid</span>
                           <span>₹{selectedBooking.priceDetails?.totalAmount.toLocaleString() || '0'}</span>
                         </div>
                       </div>
                    </div>

                    {selectedBooking.renewals && selectedBooking.renewals.length > 0 && (
                      <div className="pt-4 border-t border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Renewal History</p>
                        <div className="space-y-2">
                          {selectedBooking.renewals.map((r, i) => (
                            <div key={i} className="flex items-center justify-between text-[11px] bg-slate-50 p-2 rounded-lg">
                              <span className="text-gray-600">{new Date(r.renewalDate).toLocaleDateString()}</span>
                              <span className="font-bold text-gray-700">+{r.addedDays} days</span>
                              <span className="text-emerald-700 font-bold">₹{r.extraCharge}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-6 pt-0 flex gap-2">
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 rounded-xl" onClick={() => navigate('/cold-storage')}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Manage/Renew
                  </Button>
                  <Button variant="outline" className="flex-1 rounded-xl" onClick={() => window.print()}>
                    <Receipt className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>
            )}

            {selectedBooking && bookingType === 'mandi' && (
              <div className="flex flex-col">
                <div className="bg-blue-700 p-6 text-white text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">Mandi Slot Receipt</h3>
                  <p className="text-blue-100 text-sm mt-1">Booking ID: {selectedBooking.id?.slice(-8).toUpperCase()}</p>
                </div>
                
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start pb-4 border-b border-dashed border-gray-100">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Market Yard</p>
                        <p className="font-bold text-gray-800">{selectedBooking.marketName}</p>
                        <p className="text-[10px] text-gray-500">{selectedBooking.district}, {selectedBooking.state}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Slot Status</p>
                        <Badge className="bg-blue-50 text-blue-600 border-none px-2 py-0 h-5">Confirmed</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Product</p>
                        <p className="text-sm font-medium text-gray-800">{selectedBooking.cropName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Quantity</p>
                        <p className="text-sm font-medium text-gray-800">{selectedBooking.quantity} Qtl</p>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-2xl flex justify-between items-center border border-blue-100">
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg shadow-sm">
                          <Calendar className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Booking Date</p>
                          <p className="text-xs font-bold text-blue-900">{selectedBooking.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Time Slot</p>
                        <p className="text-xs font-bold text-blue-900">{selectedBooking.timeSlot}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                       <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                         <ShieldCheck className="h-3 w-3" /> Mandatory Instructions
                       </p>
                       <ul className="space-y-2">
                         <li className="flex gap-2 text-[11px] text-slate-600">
                           <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1 shrink-0" />
                           Carry your original Aadhaar card and farmer registration number.
                         </li>
                         <li className="flex gap-2 text-[11px] text-slate-600">
                           <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1 shrink-0" />
                           Arrive at the gate exactly at {selectedBooking.timeSlot.split(' ')[0]} for queue management.
                         </li>
                         <li className="flex gap-2 text-[11px] text-slate-600">
                           <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1 shrink-0" />
                           Vehicle parking is allowed only in designated 'Farmer Zones'.
                         </li>
                       </ul>
                    </div>
                  </div>
                </div>
                <div className="p-6 pt-0 flex gap-2">
                  <Button variant="outline" className="flex-1 rounded-xl" onClick={() => window.print()}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button className="flex-1 bg-blue-700 hover:bg-blue-800 rounded-xl" onClick={() => setShowReceipt(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
