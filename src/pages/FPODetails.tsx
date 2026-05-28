import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  MapPin, 
  Phone, 
  Info, 
  Star, 
  ChevronLeft, 
  Globe, 
  ShieldCheck, 
  Package, 
  Truck, 
  UserPlus
} from 'lucide-react';
import { toast } from 'sonner';
import { FPO as FPOType } from '@/types';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useLocationContext } from '@/contexts/LocationContext';
import { calculateDistance } from '@/lib/locationService';
import { fpoData } from '@/lib/fpoData';
import SafeImage from '@/components/SafeImage';
import { imageForFpo } from '@/lib/imageAssets';

export default function FPODetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { location } = useLocationContext();
  const [fpo, setFpo] = useState<FPOType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [distance, setDistance] = useState<number>(0);

  useEffect(() => {
    const found = fpoData.find(f => f.id === id);
    if (found) {
      setFpo(found);
      const d = calculateDistance(location.lat, location.lng, found.lat, found.lng);
      setDistance(d);
    } else {
      toast.error('FPO not found');
      navigate('/fpo');
    }
  }, [id, location, navigate]);

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      fpoId: fpo?.id,
      fpoName: fpo?.name,
      userName: formData.get('name'),
      phone: formData.get('phone'),
      location: formData.get('location'),
      userId: auth.currentUser?.uid,
      createdAt: Date.now()
    };

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'fpo_applications'), data);
      toast.success('Application submitted successfully!');
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      toast.error('Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!fpo) return null;

  return (
    <Layout title={fpo.name} showBackButton={true}>
      <div className="max-w-6xl mx-auto pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Details */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
              <div className="h-48 bg-emerald-600 relative">
                <SafeImage src={imageForFpo(fpo)} alt={`${fpo.name} produce and farmer organization`} className="absolute inset-0 h-full w-full" />
                <div className="absolute inset-0 bg-emerald-950/60 backdrop-blur-[1px]" />
                <div className="absolute bottom-6 left-8 right-8 flex justify-between items-end">
                  <div className="space-y-1">
                    <Badge className="bg-white/20 text-white border-none backdrop-blur-md mb-2">
                      FPO Member Community
                    </Badge>
                    <h2 className="text-3xl font-bold text-white leading-tight">{fpo.name}</h2>
                  </div>
                  <div className="bg-white p-3 rounded-2xl shadow-lg flex items-center gap-1.5">
                    <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                    <span className="text-lg font-bold text-gray-900">{fpo.rating}</span>
                  </div>
                </div>
              </div>

              <CardContent className="p-8">
                <div className="flex flex-wrap gap-6 mb-8 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                    <span>{fpo.location}, {fpo.state}</span>
                  </div>
                  {fpo.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Globe className="h-5 w-5 text-emerald-600" />
                      <span>{fpo.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-5 w-5 text-emerald-600" />
                    <span>{fpo.contact}</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 font-bold">
                    <MapPin className="h-5 w-5" />
                    <span>{distance.toFixed(1)} km from you</span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">About the FPO</h3>
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {fpo.description}
                    </p>
                  </div>

                  <Separator className="bg-gray-100" />

                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Services Offered</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {fpo.services.map((service, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                          <ShieldCheck className="h-5 w-5 text-emerald-600" />
                          <span className="font-bold text-emerald-900 text-sm">{service}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 py-8">
                    <div className="text-center space-y-2">
                       <div className="bg-gray-50 h-12 w-12 rounded-2xl flex items-center justify-center mx-auto">
                        <Users className="h-6 w-6 text-emerald-600" />
                       </div>
                       <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Members</div>
                       <div className="text-xl font-bold text-gray-900">5,000+</div>
                    </div>
                    <div className="text-center space-y-2">
                       <div className="bg-gray-50 h-12 w-12 rounded-2xl flex items-center justify-center mx-auto">
                        <Package className="h-6 w-6 text-emerald-600" />
                       </div>
                       <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Produce</div>
                       <div className="text-xl font-bold text-gray-900">12 Crops</div>
                    </div>
                    <div className="text-center space-y-2">
                       <div className="bg-gray-50 h-12 w-12 rounded-2xl flex items-center justify-center mx-auto">
                        <Truck className="h-6 w-6 text-emerald-600" />
                       </div>
                       <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Reach</div>
                       <div className="text-xl font-bold text-gray-900">Global</div>
                    </div>
                    {fpo.yearEstablished && (
                      <div className="text-center space-y-2">
                         <div className="bg-gray-50 h-12 w-12 rounded-2xl flex items-center justify-center mx-auto">
                          <Info className="h-6 w-6 text-emerald-600" />
                         </div>
                         <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Est. Since</div>
                         <div className="text-xl font-bold text-gray-900">{fpo.yearEstablished}</div>
                      </div>
                    )}
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full h-14 rounded-2xl border-emerald-100 text-emerald-700 font-bold text-lg hover:bg-emerald-50 gap-2"
                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${fpo.lat},${fpo.lng}`, '_blank')}
                  >
                    <MapPin className="h-5 w-5" />
                    View Route on Google Maps
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Join Form */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white">
                <CardHeader className="bg-emerald-900 text-white p-6">
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-6 w-6" />
                    Join This FPO
                  </CardTitle>
                  <p className="text-emerald-100 text-xs mt-1">Start growing together with fellow farmers</p>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleJoinSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-500 ml-1">Full Name</Label>
                      <Input 
                        name="name" 
                        placeholder="Farmer Name" 
                        defaultValue={auth.currentUser?.displayName || ''} 
                        required 
                        className="rounded-xl h-12 border-gray-100 bg-gray-50 focus-visible:ring-emerald-500" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-500 ml-1">Phone Number</Label>
                      <Input 
                        name="phone" 
                        placeholder="+91 XXXXX XXXXX" 
                        required 
                        className="rounded-xl h-12 border-gray-100 bg-gray-50 focus-visible:ring-emerald-500" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-500 ml-1">Your Village/Town</Label>
                      <Input 
                        name="location" 
                        placeholder="e.g. Rampur, Ludhiana" 
                        required 
                        className="rounded-xl h-12 border-gray-100 bg-gray-50 focus-visible:ring-emerald-500" 
                      />
                    </div>
                    
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs text-emerald-800 leading-relaxed mb-2">
                      <strong>Note:</strong> By joining, you'll receive updates on seed distribution, market prices, and collective selling opportunities.
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-14 font-bold text-lg shadow-lg shadow-emerald-500/20"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Submitting...' : 'Apply to Join'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="p-6 bg-amber-50 rounded-[32px] border border-amber-100">
                <h4 className="text-amber-900 font-bold mb-2 flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Did You Know?
                </h4>
                <p className="text-amber-800 text-xs leading-relaxed">
                  FPO members statistically earn 15-20% more for their produce than independent farmers due to volume-based negotiations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
