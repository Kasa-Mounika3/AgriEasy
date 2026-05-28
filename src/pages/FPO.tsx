import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Users, MapPin, Phone, Info, Search, Filter, Star, ExternalLink, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { FPO as FPOType } from '@/types';
import { indiaData } from '@/lib/indiaData';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { useLocationContext } from '@/contexts/LocationContext';
import { calculateDistance } from '@/lib/locationService';
import { useNavigate } from 'react-router-dom';
import { fpoData } from '@/lib/fpoData';
import SafeImage from '@/components/SafeImage';
import { imageForFpo, moduleImages } from '@/lib/imageAssets';

export default function FPO() {
  const navigate = useNavigate();
  const { location } = useLocationContext();
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joiningFPO, setJoiningFPO] = useState<FPOType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const states = useMemo(() => {
    const s = fpoData.map(f => f.state);
    return Array.from(new Set(s)).sort();
  }, []);

  const districts = useMemo(() => {
    if (selectedState === 'all') return [];
    const d = fpoData.filter(f => f.state === selectedState).map(f => f.district);
    return Array.from(new Set(d)).sort();
  }, [selectedState]);

  // Calculate distances and sort
  const processedFPOs = useMemo(() => {
    return fpoData.map(fpo => {
      const distance = calculateDistance(location.lat, location.lng, fpo.lat, fpo.lng);
      return { ...fpo, distance };
    }).sort((a, b) => a.distance - b.distance);
  }, [location]);

  const filteredFPOs = useMemo(() => {
    return processedFPOs.filter(f => {
      const q = searchQuery.toLowerCase();
      const stateMatch = selectedState === 'all' || f.state === selectedState;
      const districtMatch = selectedDistrict === 'all' || f.district === selectedDistrict;
      const searchMatch = searchQuery === '' || 
        f.name.toLowerCase().includes(q) || 
        f.location.toLowerCase().includes(q) ||
        f.state.toLowerCase().includes(q) ||
        f.district.toLowerCase().includes(q);
      return stateMatch && districtMatch && searchMatch;
    });
  }, [processedFPOs, selectedState, selectedDistrict, searchQuery]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      fpoId: joiningFPO?.id,
      fpoName: joiningFPO?.name,
      userName: formData.get('name'),
      phone: formData.get('phone'),
      location: formData.get('location'),
      userId: auth.currentUser?.uid,
      createdAt: Date.now()
    };

    setIsLoading(true);
    try {
      await addDoc(collection(db, 'fpo_applications'), data);
      toast.success('Application submitted! The FPO representative will contact you soon.');
      setIsJoinModalOpen(false);
    } catch (error) {
      console.error('Error joining FPO:', error);
      toast.error('Failed to submit application');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout title="FPO Connect">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Benefits Section */}
        <Card className="relative bg-gradient-to-br from-emerald-600 to-emerald-800 border-none overflow-hidden rounded-[24px] text-white shadow-lg">
          <SafeImage src={moduleImages.fpo} alt="Farmer producer organization group" className="absolute inset-0 h-full w-full opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-800/80 to-emerald-700/40" />
          <CardContent className="relative p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-md">
                <Users className="h-10 w-10" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold mb-2">Connect with Nearby FPOs</h3>
                <p className="text-emerald-100 text-sm mb-4">Join powerful farming communities to get better prices, modern tools, and shared resources.</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs font-medium">
                  <span className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full">✓ Better Pricing</span>
                  <span className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full">✓ Direct Buyers</span>
                  <span className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full">✓ Expert Training</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 border-none shadow-sm rounded-[24px] bg-white p-2">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input 
                placeholder="Search FPOs by name or location..." 
                className="pl-12 h-14 border-none bg-transparent rounded-2xl focus-visible:ring-0 text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </Card>
          
          <Dialog>
            <DialogTrigger render={
              <Button variant="outline" className="h-14 rounded-[24px] border-emerald-100 bg-white text-emerald-800 gap-2 font-bold shadow-sm">
                <Filter className="h-5 w-5" />
                Filter by Region
              </Button>
            } />
            <DialogContent className="rounded-[24px] sm:max-w-[450px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-emerald-900 mb-4">Location Filters</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500 ml-1">Select State</Label>
                  <Select onValueChange={(val) => { setSelectedState(val); setSelectedDistrict('all'); }} value={selectedState}>
                    <SelectTrigger className="h-12 rounded-xl border-emerald-100">
                      <SelectValue placeholder="All India" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All India</SelectItem>
                      {states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500 ml-1">Select District</Label>
                  <Select onValueChange={setSelectedDistrict} value={selectedDistrict} disabled={selectedState === 'all'}>
                    <SelectTrigger className="h-12 rounded-xl border-emerald-100">
                      <SelectValue placeholder="All Districts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Districts</SelectItem>
                      {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 rounded-xl font-bold mt-4" 
                  onClick={() => {}}
                >
                  Apply Filters
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* FPO List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-lg font-bold text-emerald-900">
              {filteredFPOs.length} FPOs Found
            </h4>
            <div className="text-xs text-gray-500 flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-full">
              <MapPin className="h-3 w-3" />
              Showing nearest first
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredFPOs.length > 0 ? (
              filteredFPOs.map(fpo => (
                <Card key={fpo.id} className="group border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-[32px] overflow-hidden bg-white flex flex-col">
                  <div className="relative h-32 bg-emerald-50 p-6 flex justify-between items-start overflow-hidden">
                    <SafeImage src={imageForFpo(fpo)} alt={`${fpo.name} cooperative farmers`} className="absolute inset-0 h-full w-full opacity-70 transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/25 to-emerald-950/20" />
                    <div className="flex gap-2">
                      {fpo.distance < 50 && (
                        <Badge className="bg-emerald-600 text-white border-none py-1 px-3 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          Nearby
                        </Badge>
                      )}
                      {fpo.rating && fpo.rating >= 4.5 && (
                        <Badge className="bg-amber-500 text-white border-none py-1 px-3 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          Top Rated
                        </Badge>
                      )}
                    </div>
                    {fpo.rating && (
                      <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-full shadow-sm">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        <span className="text-xs font-bold">{fpo.rating}</span>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-8 pt-0 -mt-8 flex-1 flex flex-col">
                    <div className="bg-white p-4 rounded-2xl shadow-sm mb-6 inline-block border border-gray-50">
                      <Users className="h-8 w-8 text-emerald-600" />
                    </div>
                    
                    <div className="space-y-4 mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-emerald-700 transition-colors leading-tight mb-1">{fpo.name}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-emerald-600" />
                          {fpo.location}, {fpo.state}
                        </p>
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                        {fpo.description}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {fpo.services.slice(0, 2).map((service, idx) => (
                          <span key={idx} className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                            {service}
                          </span>
                        ))}
                        {fpo.services.length > 2 && (
                          <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                            +{fpo.services.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Distance</span>
                        <span className="text-lg font-black text-emerald-900">{fpo.distance.toFixed(1)} km</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-xl border border-gray-100 text-emerald-700 h-10 w-10 hover:bg-emerald-50"
                          title="View on Map"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`https://www.google.com/maps/dir/?api=1&destination=${fpo.lat},${fpo.lng}`, '_blank');
                          }}
                        >
                          <MapPin className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline"
                          className="rounded-xl border-emerald-100 text-emerald-700 h-10 px-4 font-bold text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setJoiningFPO(fpo);
                            setIsJoinModalOpen(true);
                          }}
                        >
                          Join
                        </Button>
                        <Button 
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 h-10 font-bold shadow-md shadow-emerald-600/10 gap-1 text-xs"
                          onClick={() => navigate(`/fpo/${fpo.id}`)}
                        >
                          Details
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-24 text-center space-y-6">
                <div className="bg-emerald-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-5xl">🔭</div>
                <div>
                  <h3 className="text-2xl font-bold text-emerald-900">No FPOs Available</h3>
                  <p className="text-gray-500 max-w-sm mx-auto mt-2">Try expanding your search query or check different state/district filters.</p>
                </div>
                <Button 
                  variant="outline" 
                  className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 px-8"
                  onClick={() => {
                    setSelectedState('all');
                    setSelectedDistrict('all');
                    setSearchQuery('');
                  }}
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isJoinModalOpen} onOpenChange={setIsJoinModalOpen}>
        <DialogContent className="rounded-[32px] sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="bg-emerald-900 text-white p-8">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              Join {joiningFPO?.name}
            </DialogTitle>
            <p className="text-emerald-100/70 text-xs mt-1">Submit your details to connect with this FPO.</p>
          </DialogHeader>
          <div className="p-8">
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-400 ml-1">Full Name</Label>
                <Input name="name" placeholder="Enter your name" defaultValue={auth.currentUser?.displayName || ''} required className="rounded-xl h-12 border-gray-100 bg-gray-50 focus-visible:ring-emerald-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-400 ml-1">Phone Number</Label>
                <Input name="phone" placeholder="+91 XXXXX XXXXX" required className="rounded-xl h-12 border-gray-100 bg-gray-50 focus-visible:ring-emerald-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-400 ml-1">Location / Village</Label>
                <Input name="location" placeholder="e.g. Rampur, District" required className="rounded-xl h-12 border-gray-100 bg-gray-50 focus-visible:ring-emerald-500" />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-14 font-bold text-lg shadow-lg shadow-emerald-500/20 mt-2"
                disabled={isLoading}
              >
                {isLoading ? 'Submitting...' : 'Submit Application'}
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
