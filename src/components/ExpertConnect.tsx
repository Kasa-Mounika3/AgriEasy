import React, { useState, useEffect, useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Phone, 
  MessageCircle, 
  Mic, 
  Send, 
  Star, 
  MapPin, 
  Clock, 
  ChevronRight, 
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Camera,
  Layers,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Expert, ExpertQuery } from '@/types';
import { toast } from 'sonner';
import { useLocationContext } from '@/contexts/LocationContext';

const EXPERT_DATA: Expert[] = [
  {
    id: 'exp1',
    name: 'Dr. Aarav Mehta',
    specialization: 'Soil Health & Rabi Crops',
    image: 'https://i.pravatar.cc/150?u=aarav',
    experience: '15+ Years',
    location: 'Nashik, Maharashtra',
    rating: 4.9,
    availableNow: true,
    isTopExpert: true,
    contactOptions: ['call', 'chat', 'query', 'voice']
  },
  {
    id: 'exp2',
    name: 'Dr. Priya Sharma',
    specialization: 'Organic Pest Control',
    image: 'https://i.pravatar.cc/150?u=priya',
    experience: '10 Years',
    location: 'Pune, Maharashtra',
    rating: 4.8,
    availableNow: true,
    isTopExpert: false,
    contactOptions: ['chat', 'query', 'voice']
  },
  {
    id: 'exp3',
    name: 'Prof. Rajesh G.',
    specialization: 'Water Management & Irrigation',
    image: 'https://i.pravatar.cc/150?u=rajesh',
    experience: '20+ Years',
    location: 'Sangli, Maharashtra',
    rating: 5.0,
    availableNow: false,
    isTopExpert: true,
    contactOptions: ['query', 'call']
  },
  {
    id: 'exp4',
    name: 'Ms. Anjali Patil',
    specialization: 'Horticulture & Greenhouse',
    image: 'https://i.pravatar.cc/150?u=anjali',
    experience: '8 Years',
    location: 'Solapur, Maharashtra',
    rating: 4.7,
    availableNow: true,
    isTopExpert: false,
    contactOptions: ['chat', 'query']
  }
];

interface ExpertConnectProps {
  cropContext?: string;
  farmContext?: any;
  trigger?: React.ReactNode;
}

export default function ExpertConnect({ cropContext, farmContext, trigger }: ExpertConnectProps) {
  const { location } = useLocationContext();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [view, setView] = useState<'list' | 'chat' | 'query' | 'call'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Chat state
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'expert', text: string, time: string}[]>([]);
  
  // Query state
  const [queryText, setQueryText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sorting experts by proximity (simulated)
  const sortedExperts = [...EXPERT_DATA].sort((a, b) => {
    const aInLocation = a.location?.toLowerCase().includes(location.district.toLowerCase()) ? 0 : 1;
    const bInLocation = b.location?.toLowerCase().includes(location.district.toLowerCase()) ? 0 : 1;
    return aInLocation - bInLocation;
  });

  const filteredExperts = sortedExperts.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.specialization.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetFlow = () => {
    setSelectedExpert(null);
    setView('list');
    setMessage('');
    setQueryText('');
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    const newMsg = { role: 'user' as const, text: message, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setChatHistory([...chatHistory, newMsg]);
    setMessage('');
    
    // Simulate auto-reply
    setTimeout(() => {
      setChatHistory(prev => [...prev, { 
        role: 'expert', 
        text: `Namaste! I have received your context regarding ${cropContext || 'farming'}. How can I assist you with this specifically?`, 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);
    }, 1500);
  };

  const handleSendQuery = () => {
    if (!queryText.trim()) return;
    setIsSubmitting(true);
    
    setTimeout(() => {
      toast.success("Query sent successfully! You will be notified when the expert responds.");
      setIsSubmitting(false);
      setIsOpen(false);
      resetFlow();
    }, 2000);
  };

  const handleCall = () => {
    window.location.href = `tel:+919876543210`; // Mock number
    toast.info(`Connecting you to ${selectedExpert?.name}...`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => { setIsOpen(val); if (!val) resetFlow(); }}>
      <DialogTrigger
        render={trigger || (
          <Button className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2">
            <Layers className="h-4 w-4" /> Connect with Expert
          </Button>
        )}
      />
      
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-[32px] sm:rounded-[32px] border-none bg-slate-50 h-[80vh] flex flex-col">
        <DialogHeader className="p-6 bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {view !== 'list' && (
                <Button variant="ghost" size="icon" onClick={() => setView('list')} className="rounded-full">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div>
                <DialogTitle className="text-xl font-black text-slate-800">
                  {view === 'list' ? 'Agriculture Experts' : selectedExpert?.name}
                </DialogTitle>
                <DialogDescription className="text-xs font-medium text-slate-500">
                  {view === 'list' ? 'Verified scientists and local advisors' : selectedExpert?.specialization}
                </DialogDescription>
              </div>
            </div>
            {view === 'list' && (
              <Badge variant="outline" className="text-emerald-600 border-emerald-100 bg-emerald-50">
                {location.district}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {view === 'list' && (
            <div className="p-6 space-y-4 h-full flex flex-col">
              <div className="relative shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search by specialization or name..." 
                  className="pl-10 rounded-xl border-slate-200 bg-white"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              <ScrollArea className="flex-1">
                <div className="grid grid-cols-1 gap-4 pr-4">
                  {filteredExperts.map((expert) => (
                    <motion.div 
                      key={expert.id} 
                      whileHover={{ scale: 1.01 }}
                      className="group"
                    >
                      <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white hover:shadow-md transition-all">
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="relative">
                            <Avatar className="h-16 w-16 border-2 border-slate-50">
                              <AvatarImage src={expert.image} />
                              <AvatarFallback>{expert.name[0]}</AvatarFallback>
                            </Avatar>
                            {expert.availableNow && (
                              <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className="font-black text-slate-800 truncate">{expert.name}</h4>
                              {expert.isTopExpert && (
                                <Badge className="bg-amber-100 text-amber-700 border-none text-[8px] px-1.5 h-4">TOP EXPERT</Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 font-medium truncate mb-2">{expert.specialization}</p>
                            
                            <div className="flex flex-wrap gap-2">
                              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {expert.rating}
                              </div>
                              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                <Clock className="h-3 w-3" /> {expert.experience}
                              </div>
                              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                <MapPin className="h-3 w-3" /> {expert.location?.split(',')[0]}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <Button 
                              size="sm" 
                              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 h-8 text-[10px] font-black"
                              onClick={() => { setSelectedExpert(expert); setView('chat'); }}
                            >
                              Message
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="rounded-xl h-8 text-[10px] font-black text-slate-500 hover:bg-slate-100"
                              onClick={() => { setSelectedExpert(expert); setView('query'); }}
                            >
                              Send Query
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {view === 'chat' && selectedExpert && (
            <div className="flex-1 flex flex-col bg-white">
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                  {/* Context Banner */}
                  <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex items-start gap-4">
                    <div className="bg-emerald-100 p-2 rounded-xl">
                      <Layers className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h5 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Crop Context Attached</h5>
                      <p className="text-sm font-medium text-emerald-800">
                        {cropContext ? `Discussion: ${cropContext}` : "General farm inquiry"}
                      </p>
                      <p className="text-[10px] text-emerald-600/70 mt-1">Includes soil: {farmContext?.soilType}, water: {farmContext?.waterAvailability}</p>
                    </div>
                  </div>

                  {chatHistory.length === 0 ? (
                    <div className="text-center py-10 space-y-4">
                      <Avatar className="h-20 w-20 mx-auto border-4 border-slate-50 shadow-sm">
                        <AvatarImage src={selectedExpert.image} />
                        <AvatarFallback>{selectedExpert.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-black text-slate-800">Chat with {selectedExpert.name}</h4>
                        <p className="text-xs text-slate-500 max-w-[200px] mx-auto">Ask about pest control, fertilizers, or growth tips.</p>
                      </div>
                    </div>
                  ) : (
                    chatHistory.map((chat, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] rounded-[24px] p-4 text-sm font-medium ${
                          chat.role === 'user' 
                          ? 'bg-emerald-600 text-white rounded-br-none' 
                          : 'bg-slate-100 text-slate-800 rounded-bl-none'
                        }`}>
                          {chat.text}
                          <div className={`text-[9px] mt-1 opacity-60 text-right`}>
                            {chat.time}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </ScrollArea>
              
              <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0">
                <div className="flex gap-2 items-center">
                  <Button variant="ghost" size="icon" className="rounded-full shrink-0 text-slate-400">
                    <Mic className="h-5 w-5" />
                  </Button>
                  <Input 
                    placeholder="Type your message..." 
                    className="flex-1 bg-white rounded-2xl border-slate-200 h-12"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button 
                    className="rounded-full bg-emerald-600 hover:bg-emerald-700 h-12 w-12 p-0 shrink-0"
                    onClick={handleSendMessage}
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {view === 'query' && selectedExpert && (
            <div className="flex-1 p-8 bg-white overflow-auto">
              <div className="max-w-md mx-auto space-y-8">
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black text-slate-800">Official Query</h3>
                  <p className="text-sm text-slate-500 font-medium">Get a formal response with verified research within 24 hours.</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Crop</Label>
                    <Input disabled value={cropContext || 'General Inquiry'} className="bg-slate-50 border-none rounded-xl" />
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</Label>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-slate-50 p-3 rounded-xl">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                      {location.locality}, {location.district}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detailed Question</Label>
                    <Textarea 
                      placeholder="e.g., My onion leaves are turning yellow from the tips. What could be the reason?" 
                      className="min-h-[120px] rounded-2xl border-slate-200 focus:border-emerald-500"
                      value={queryText}
                      onChange={e => setQueryText(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button variant="outline" className="flex-1 rounded-2xl border-slate-200 h-12 font-bold text-slate-600 hover:bg-slate-100">
                      <Camera className="h-4 w-4 mr-2" /> Attach Photo
                    </Button>
                    <Button variant="outline" className="flex-1 rounded-2xl border-slate-200 h-12 font-bold text-slate-600 hover:bg-slate-100">
                      <Mic className="h-4 w-4 mr-2" /> Voice Note
                    </Button>
                  </div>

                  <Button 
                    className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black text-lg shadow-lg shadow-emerald-100"
                    onClick={handleSendQuery}
                    disabled={isSubmitting || !queryText.trim()}
                  >
                    {isSubmitting ? 'Sending Query...' : 'Submit Official Query'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {selectedExpert && view !== 'list' && (
          <DialogFooter className="p-4 bg-white border-t border-slate-100 flex-row justify-between items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedExpert.image} />
                <AvatarFallback>{selectedExpert.name[0]}</AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-xs font-black text-slate-800">{selectedExpert.name}</p>
                <p className="text-[10px] font-bold text-slate-400">{selectedExpert.experience} exp.</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              {selectedExpert.contactOptions?.includes('call') && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full border-slate-200 text-emerald-600 hover:bg-emerald-50"
                  onClick={handleCall}
                >
                  <Phone className="h-4 w-4" />
                </Button>
              )}
              <Button 
                variant={view === 'query' ? 'default' : 'outline'}
                className="rounded-full font-bold px-6 border-slate-200"
                onClick={() => setView(view === 'query' ? 'chat' : 'query')}
              >
                {view === 'query' ? 'Go to Chat' : 'Official Query'}
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
