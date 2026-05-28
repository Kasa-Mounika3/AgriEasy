import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Sprout, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info, 
  ArrowLeft, 
  ChevronRight,
  Droplets,
  Waves,
  Users,
  MapPin,
  Calendar,
  Hammer,
  Bug,
  Activity as Maintenance,
  Scissors,
  DollarSign,
  CloudSun,
  Search,
  Scale,
  BrainCircuit,
  PieChart,
  Lightbulb,
  Zap,
  ShieldCheck,
  Package,
  Clock,
  ArrowRight,
  Activity,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useLocationContext } from '@/contexts/LocationContext';
import { ai, MODELS } from '@/lib/gemini';
import ExpertConnect from '@/components/ExpertConnect';
import SafeImage from '@/components/SafeImage';
import { cropImages, moduleImages } from '@/lib/imageAssets';

// --- DATASET & TYPES ---

interface FarmingStage {
  stage: string;
  what: string;
  when: string;
  how: string;
}

interface CropData {
  id: string;
  name: string;
  requirements: {
    soil: string[];
    water: 'Low' | 'Medium' | 'High';
    irrigation: string[];
    labour: 'Low' | 'Medium' | 'High';
    climate: string;
  };
  market: {
    demand: number; // 0-100
    currentPrice: string;
    priceTrend: 'Increasing' | 'Stable' | 'Decreasing';
    profitPotential: 'Low' | 'Medium' | 'High';
    societyConsumption: string;
  };
  guide: FarmingStage[];
  risks: {
    weather: string;
    market: string;
    resource: string;
  };
}

const CROP_DATABASE: CropData[] = [
  {
    id: 'onion',
    name: 'Red Onion (Nasik)',
    requirements: {
      soil: ['Loamy', 'Black soil'],
      water: 'Medium',
      irrigation: ['Drip', 'Sprinkler', 'Canal'],
      labour: 'High',
      climate: 'Moderate temperature, low humidity'
    },
    market: {
      demand: 92,
      currentPrice: '₹45/kg',
      priceTrend: 'Increasing',
      profitPotential: 'High',
      societyConsumption: 'High - Staple vegetable'
    },
    guide: [
      { stage: 'Land Preparation', what: 'Deep ploughing & leveling', when: '1 month before sowing', how: 'Plough field 3-4 times, add 20t/ha FYM.' },
      { stage: 'Sowing', what: 'Direct seeding or transplanting', when: 'Oct-Nov (Rabi)', how: 'Transplant 6-8 week old seedlings at 15x10cm spacing.' },
      { stage: 'Irrigation', what: 'Light watering', when: 'Every 10-12 days', how: 'Critical at bulb formation stage. Use drip for efficiency.' },
      { stage: 'Fertilizers', what: 'NPK 100:50:50', when: 'Split doses', how: 'Basal dose + top dressing at 30 & 45 days.' },
      { stage: 'Pest Control', what: 'Thrips management', when: 'Early growth', how: 'Spray Neem oil or Imidacloprid if needed.' },
      { stage: 'Maintenance', what: 'Weeding', when: '30 & 60 days', how: 'Manual weeding to avoid bulb damage.' },
      { stage: 'Harvesting', what: 'Bulb harvesting', when: 'When 50% tops fall', how: 'Cure in shade for 3-4 days after pulling.' },
      { stage: 'Post-harvest', what: 'Sorting & Storage', when: 'After drying', how: 'Grade by size and store in ventilated rooms.' }
    ],
    risks: {
      weather: 'Heavy rain during bulb stage can cause rot.',
      market: 'Price crashes during peak harvest arrival.',
      resource: 'High labour cost during transplanting/harvest.'
    }
  },
  {
    id: 'wheat',
    name: 'Durum Wheat',
    requirements: {
      soil: ['Loamy', 'Black soil', 'Clay'],
      water: 'Medium',
      irrigation: ['Canal', 'Sprinkler'],
      labour: 'Medium',
      climate: 'Cool growing period, warm ripening'
    },
    market: {
      demand: 85,
      currentPrice: '₹2,400/quintal',
      priceTrend: 'Stable',
      profitPotential: 'Medium',
      societyConsumption: 'High - Global demand'
    },
    guide: [
      { stage: 'Land Preparation', what: 'Disc harrowing', when: 'Early Nov', how: 'Prepare fine seedbed with 2-3 ploughings.' },
      { stage: 'Sowing', what: 'Drilling', when: 'Nov 15-Dec 1', how: 'Sow at 5cm depth with seed drill.' },
      { stage: 'Irrigation', what: 'CRI stage watering', when: '21 days after sowing', how: 'First irrigation at Crown Root Initiation is critical.' },
      { stage: 'Fertilizers', what: 'NPK 120:60:40', when: 'Basal + Irrigation', how: 'Full P & K as basal, Nitrogen in two splits.' },
      { stage: 'Pest Control', what: 'Rust monitoring', when: 'Jan-Feb', how: 'Spray Propiconazole if rust appears.' },
      { stage: 'Maintenance', what: 'Weed control', when: '30-35 days', how: 'Use broad-spectrum weedicides.' },
      { stage: 'Harvesting', what: 'Combine harvesting', when: 'Mar-Apr', how: 'Harvest when grains are hard and moisture < 14%.' },
      { stage: 'Post-harvest', what: 'Cleaning & Drying', when: 'Immediate', how: 'Sun dry on threshing floor.' }
    ],
    risks: {
      weather: 'Heat waves in March can reduce grain weight.',
      market: 'Global supply chain impacts local prices.',
      resource: 'Water shortage during CRI stage.'
    }
  },
  {
    id: 'turmeric',
    name: 'High Curcumin Turmeric',
    requirements: {
      soil: ['Red soil', 'Loamy'],
      water: 'High',
      irrigation: ['Drip', 'Canal'],
      labour: 'High',
      climate: 'Hot and humid'
    },
    market: {
      demand: 78,
      currentPrice: '₹8,500/quintal',
      priceTrend: 'Increasing',
      profitPotential: 'High',
      societyConsumption: 'Medium - Medicinal & Spice'
    },
    guide: [
      { stage: 'Land Preparation', what: 'Bed formation', when: 'Apr-May', how: 'Plough 20-25cm deep, make raised beds.' },
      { stage: 'Sowing', what: 'Rhizome planting', when: 'June (On monsoon)', how: 'Plant at 15x30cm spacing at 4cm depth.' },
      { stage: 'Irrigation', what: 'Frequent watering', when: 'Weekly', how: 'Keep soil moist but avoid waterlogging.' },
      { stage: 'Fertilizers', what: 'Organic + NPK', when: 'Multiple stages', how: 'Apply Neem cake basal, NPK in 4 splits.' },
      { stage: 'Pest Control', what: 'Rhizome rot control', when: 'Monsoon', how: 'Soil drenching with copper oxychloride.' },
      { stage: 'Maintenance', what: 'Mulching', when: 'Immediate', how: 'Cover with green leaves to preserve moisture.' },
      { stage: 'Harvesting', what: 'Digging out', when: 'Jan-Feb (9 months)', how: 'When leaves turn dry and yellow.' },
      { stage: 'Post-harvest', what: 'Curing & Polishing', when: 'After harvest', how: 'Boil in water, dry, and polish for market.' }
    ],
    risks: {
      weather: 'Drought can severely impact rhizome size.',
      market: 'Export policy changes affect prices.',
      resource: 'Long crop duration blocks land for 9 months.'
    }
  },
  {
    id: 'tomato',
    name: 'Hybrid Tomato',
    requirements: {
      soil: ['Loamy', 'Silty'],
      water: 'High',
      irrigation: ['Drip', 'Sprinkler'],
      labour: 'High',
      climate: 'Moderate warm days, cool nights'
    },
    market: {
      demand: 90,
      currentPrice: '₹30-80/kg (Volatile)',
      priceTrend: 'Increasing',
      profitPotential: 'High',
      societyConsumption: 'High - Daily consumption'
    },
    guide: [
      { stage: 'Land Preparation', what: 'Fine tilth', when: '1 month before', how: 'Work soil to 30cm depth, add 25t FYM.' },
      { stage: 'Sowing', what: 'Transplanting', when: 'Aug-Sept or Nov-Dec', how: 'Space 60x45cm for hybrids.' },
      { stage: 'Irrigation', what: 'Regular watering', when: '3-4 days interval', how: 'Drip irrigation ensures uniform moisture.' },
      { stage: 'Fertilizers', what: 'NPK 150:100:100', when: 'Split doses', how: 'Liquid fertigation for better uptake.' },
      { stage: 'Pest Control', what: 'Fruit borer control', when: 'Flowering stage', how: 'Use pheromone traps and bio-pesticides.' },
      { stage: 'Maintenance', what: 'Staking & Pruning', when: '30 days onwards', how: 'Support plants with stakes for better yield.' },
      { stage: 'Harvesting', what: 'Picking', when: '100 days onwards', how: 'Harvest at breaker stage for long distance.' },
      { stage: 'Post-harvest', what: 'Grading', when: 'Daily picking', how: 'Sort by ripeness and size.' }
    ],
    risks: {
      weather: 'Frost or extreme heat causes flower drop.',
      market: 'Extreme price volatility within weeks.',
      resource: 'Highly perishable - needs quick transport.'
    }
  },
  {
    id: 'millets',
    name: 'Pearl Millet (Bajra)',
    requirements: {
      soil: ['Sandy', 'Red soil'],
      water: 'Low',
      irrigation: ['Rain-fed', 'Drip'],
      labour: 'Low',
      climate: 'Dry and hot'
    },
    market: {
      demand: 70,
      currentPrice: '₹2,500/quintal',
      priceTrend: 'Increasing',
      profitPotential: 'Medium',
      societyConsumption: 'Growing - Health focus'
    },
    guide: [
      { stage: 'Land Preparation', what: 'Minimum tillage', when: 'May-June', how: 'One deep ploughing followed by harrowing.' },
      { stage: 'Sowing', what: 'Broadcasting/Drilling', when: 'June-July', how: 'Sow at 2-3cm depth after first rain.' },
      { stage: 'Irrigation', what: 'Supplemental', when: 'During drought', how: 'Usually rain-fed; water at grain filling if possible.' },
      { stage: 'Fertilizers', what: 'NPK 40:20:20', when: 'Basal dose', how: 'Apply full dose at sowing time.' },
      { stage: 'Pest Control', what: 'Stem borer', when: 'Early stage', how: 'Intercrop with pulses for natural control.' },
      { stage: 'Maintenance', what: 'Thinning', when: '15-20 days', how: 'Maintain plant population density.' },
      { stage: 'Harvesting', what: 'Cobs cutting', when: 'Oct-Nov', how: 'When grain moisture is below 20%.' },
      { stage: 'Post-harvest', what: 'Threshing', when: 'After drying', how: 'Dry cobs for 2 days before threshing.' }
    ],
    risks: {
      weather: 'Heavy rains during flowering can wash pollen.',
      market: 'Consumer awareness is high but market access low.',
      resource: 'Bird damage during maturity.'
    }
  }
];

// --- UTILS ---

const calculateSuitability = (crop: CropData, inputs: any) => {
  let score = 0;
  
  // Soil Match (40 pts)
  if (crop.requirements.soil.map(s => s.toLowerCase()).includes(inputs.soilType.toLowerCase())) {
    score += 40;
  } else if (inputs.soilType === 'Loamy') {
    score += 20; // Loamy is generally good
  }

  // Water Match (30 pts)
  const waterMap: Record<string, number> = { 'Low': 0, 'Medium': 1, 'High': 2 };
  const inputWater = waterMap[inputs.waterAvailability];
  const requiredWater = waterMap[crop.requirements.water];
  
  if (inputWater >= requiredWater) {
    score += 30;
  } else if (inputWater + 1 === requiredWater) {
    score += 15; // Manageable
  }

  // Labour Match (15 pts)
  const labourMap: Record<string, number> = { 'Low': 0, 'Medium': 1, 'High': 2 };
  if (labourMap[inputs.labourAvailability] >= labourMap[crop.requirements.labour]) {
    score += 15;
  } else {
    score += 5;
  }

  // Irrigation Match (15 pts)
  if (crop.requirements.irrigation.map(i => i.toLowerCase()).includes(inputs.irrigationType.toLowerCase())) {
    score += 15;
  } else {
    score += 5;
  }

  return score;
};

const getCropImage = (crop: CropData) => cropImages[crop.id] || moduleImages.cropAdvisor;

// --- COMPONENT ---

export default function SmartDemandCropAdvisor() {
  const { location } = useLocationContext();
  const [step, setStep] = useState<'form' | 'results' | 'guide'>('form');
  const [loading, setLoading] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<CropData | null>(null);
  const [formData, setFormData] = useState({
    soilType: '',
    waterAvailability: '',
    irrigationType: '',
    landArea: '',
    labourAvailability: '',
    preferredCrops: ''
  });

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const [recommendations, setRecommendations] = useState<{
    best: (CropData & { suitability: number; finalScore: number })[];
    conditional: (CropData & { suitability: number; finalScore: number; reason: string })[];
    notRecommended: (CropData & { reason: string })[];
    preferredCheck: { name: string; status: '✅' | '❌'; demand: string; advice: string }[];
  } | null>(null);

  const handleGenerate = async () => {
    if (!formData.soilType || !formData.waterAvailability || !formData.irrigationType || !formData.landArea || !formData.labourAvailability) {
      toast.error('Please fill in all basic requirements');
      return;
    }

    setLoading(true);
    
    // Simulate complex calculation
    setTimeout(async () => {
      const results = CROP_DATABASE.map(crop => {
        const suitability = calculateSuitability(crop, formData);
        const finalScore = (suitability * 0.6) + (crop.market.demand * 0.4);
        return { ...crop, suitability, finalScore };
      });

      const best = results
        .filter(c => c.finalScore >= 75)
        .sort((a, b) => b.finalScore - a.finalScore);

      const conditional = results
        .filter(c => c.finalScore >= 50 && c.finalScore < 75)
        .map(c => ({
          ...c,
          reason: c.suitability < 60 ? "High demand but requires resource optimization." : "Suitable but market demand is currently average."
        }));

      const notRecommended = results
        .filter(c => c.finalScore < 50)
        .map(c => ({
          ...c,
          reason: c.suitability < 40 ? "Soil or water mismatch." : "Low market demand and poor resource fit."
        }));

      // Preferred check
      const preferredList = formData.preferredCrops.split(',').map(s => s.trim()).filter(s => s.length > 0);
      const preferredCheck = preferredList.map(p => {
        const match = CROP_DATABASE.find(c => c.name.toLowerCase().includes(p.toLowerCase()));
        if (match) {
          const suitability = calculateSuitability(match, formData);
          return {
            name: p,
            status: suitability > 60 ? '✅' as const : '❌' as const,
            demand: match.market.demand >= 80 ? 'High' : 'Medium',
            advice: suitability > 60 ? 'Strong potential for success.' : 'Risky due to soil or water constraints.'
          };
        }
        return {
          name: p,
          status: '❌' as const,
          demand: 'Unknown',
          advice: 'Consult expert for this specific crop.'
        };
      });

      setRecommendations({ best, conditional, notRecommended, preferredCheck });
      setLoading(false);
      setStep('results');
      toast.success('Recommendations generated!');

      // Run AI in background for extra insights
      try {
        const prompt = `Based on Soil: ${formData.soilType}, Water: ${formData.waterAvailability}, and Location: ${location?.district || 'India'}, 
        provide 3 quick-hit strategic farming tips for the current season. Keep it brief.`;
        const res = await ai.models.generateContent({
          model: MODELS.flash,
          contents: prompt
        });
        setAiAnalysis(res.text);
      } catch (e) {
        setAiAnalysis("No seasonal AI tips available at the moment. Focus on soil preparation and irrigation efficiency.");
      }

    }, 2000);
  };

  const renderForm = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Crop Advisor</h1>
          <p className="text-slate-500 font-medium">Smart Demand & Suitability Analysis</p>
        </div>
      </div>

      <Card className="border-none shadow-2xl bg-white rounded-[40px] overflow-hidden">
        <div className="bg-[#2D5A27] p-8 text-white relative overflow-hidden">
          <SafeImage src={moduleImages.cropAdvisor} alt="Crop suitability analysis field" className="absolute inset-0 h-full w-full opacity-30" />
          <div className="absolute inset-0 bg-emerald-950/65" />
          <div className="relative">
            <BrainCircuit className="h-12 w-12 mb-4 opacity-70" />
            <h2 className="text-2xl font-black">Tell us about your farm</h2>
            <p className="text-emerald-100 text-sm opacity-90">Our engine uses localized weather, demand data, and your resources for precise matching.</p>
          </div>
        </div>
        
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                <Maintenance className="h-3 w-3" /> Soil Type
              </Label>
              <Select value={formData.soilType} onValueChange={(v) => setFormData({...formData, soilType: v})}>
                <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50">
                  <SelectValue placeholder="Select soil type" />
                </SelectTrigger>
                <SelectContent>
                  {['Sandy', 'Clay', 'Loamy', 'Black soil', 'Red soil', 'Silty'].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                <Droplets className="h-3 w-3" /> Water Availability
              </Label>
              <Select value={formData.waterAvailability} onValueChange={(v) => setFormData({...formData, waterAvailability: v})}>
                <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {['Low', 'Medium', 'High'].map(s => (
                    <SelectItem key={s} value={s}>{s} Availability</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                <Waves className="h-3 w-3" /> Irrigation Method
              </Label>
              <Select value={formData.irrigationType} onValueChange={(v) => setFormData({...formData, irrigationType: v})}>
                <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {['Drip', 'Sprinkler', 'Canal', 'Rain-fed'].map(s => (
                    <SelectItem key={s} value={s}>{s} System</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                <MapPin className="h-3 w-3" /> Land Area (Acres)
              </Label>
              <Input 
                type="number" 
                placeholder="e.g. 5" 
                className="h-14 rounded-2xl border-slate-100 bg-slate-50"
                value={formData.landArea}
                onChange={e => setFormData({...formData, landArea: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                <Users className="h-3 w-3" /> Labour Availability
              </Label>
              <Select value={formData.labourAvailability} onValueChange={(v) => setFormData({...formData, labourAvailability: v})}>
                <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50">
                  <SelectValue placeholder="Select labour level" />
                </SelectTrigger>
                <SelectContent>
                  {['Low', 'Medium', 'High'].map(s => (
                    <SelectItem key={s} value={s}>{s} Labour</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                <Sprout className="h-3 w-3" /> Preferred Crops (Optional)
              </Label>
              <Input 
                placeholder="e.g. Tomato, Garlic" 
                className="h-14 rounded-2xl border-slate-100 bg-slate-50"
                value={formData.preferredCrops}
                onChange={e => setFormData({...formData, preferredCrops: e.target.value})}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-8 bg-slate-50">
          <Button 
            className="w-full h-16 rounded-[24px] bg-[#2D5A27] hover:bg-[#1e3d1a] text-lg font-black shadow-lg shadow-emerald-200 transition-all hover:scale-[1.02] active:scale-98"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-3">
                <Maintenance className="h-5 w-5 animate-spin" />
                Analyzing Demand & Resources...
              </span>
            ) : (
              <span className="flex items-center gap-3">
                Analyze My Farm Potential <Zap className="h-5 w-5 fill-amber-400 text-amber-400" />
              </span>
            )}
          </Button>
        </CardFooter>
      </Card>

      <div className="flex gap-4 p-4 bg-emerald-50 rounded-3xl border border-emerald-100">
        <Info className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
        <p className="text-xs text-emerald-700 leading-relaxed font-bold">
          Our algorithm balances <span className="text-emerald-900 underline">Suitability (60%)</span> and <span className="text-emerald-900 underline">Market Trends (40%)</span> to suggest crops that not only grow well but also sell high.
        </p>
      </div>
    </motion.div>
  );

  const renderResults = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 pb-20">
      <div className="flex items-center justify-between sticky top-0 z-20 bg-[#F8F9F3]/90 backdrop-blur-md py-4 -mx-4 px-4 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setStep('form')} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Farm Strategy</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold">
            {location?.district || 'Local Market'}
          </Badge>
          <Badge className="bg-blue-100 text-blue-700 border-none font-bold">
            {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </Badge>
        </div>
      </div>

      {/* AI STRATEGIC ADVICE */}
      <Card className="border-none bg-[#2D5A27] text-white rounded-[32px] overflow-hidden shadow-xl">
        <CardContent className="p-8 flex items-center gap-6">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/20">
            < BrainCircuit className="h-8 w-8 text-emerald-300" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase tracking-widest text-emerald-300">AI Seasonal Insight</h4>
            <p className="text-sm font-medium leading-relaxed italic opacity-90">"{aiAnalysis || "Calculating seasonal dynamics..."}"</p>
          </div>
        </CardContent>
      </Card>

      {/* 1. BEST CROPS */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-black text-slate-800">Best Recommendations (High Potential)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recommendations?.best.map((crop, idx) => (
            <motion.div 
              key={crop.id} 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card 
                className="border-none shadow-sm rounded-[32px] bg-white group hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
                onClick={() => { setSelectedCrop(crop); setStep('guide'); }}
              >
                <div className="h-36 overflow-hidden">
                  <SafeImage src={getCropImage(crop)} alt={crop.name} className="h-full w-full transition-transform duration-500 group-hover:scale-105" />
                </div>
                {idx === 0 && <Badge className="absolute top-4 right-4 bg-amber-500 text-white border-none font-black text-[10px]">BEST CHOICE</Badge>}
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="text-3xl font-black text-slate-800 tracking-tighter">{crop.name}</h4>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-emerald-600 border-emerald-100 font-bold bg-emerald-50/50">
                          Score: {Math.round(crop.finalScore)}%
                        </Badge>
                        {crop.market.profitPotential === 'High' && <Badge className="bg-emerald-600 text-white border-none font-black text-[9px] px-2 py-0.5">HIGH PROFIT</Badge>}
                        <Badge className="bg-blue-600 text-white border-none font-black text-[9px] px-2 py-0.5">SAFE CROP</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Sprout className="h-3 w-3" /> Suitability
                      </p>
                      <Progress value={crop.suitability} className="h-2 bg-slate-200" />
                      <p className="text-[10px] text-slate-500 leading-tight">Soil & resource match is very strong.</p>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-100 space-y-2">
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Market Demand
                      </p>
                      <Progress value={crop.market.demand} className="h-2 bg-emerald-200" />
                      <p className="text-[10px] text-emerald-600 leading-tight">Price trending {crop.market.priceTrend.toLowerCase()}.</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-50 group-hover:translate-x-1 transition-transform">
                    <span className="text-xs font-black text-emerald-700 flex items-center gap-1">
                       View Complete Farming Guide <ArrowRight className="h-3 w-3" />
                    </span>
                    <Badge variant="ghost" className="text-slate-300 font-black">
                      ₹ {crop.market.currentPrice}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 2. CONDITIONAL CROPS */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
            <Activity className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-black text-slate-800">Conditional Crops (Grow with Caution)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendations?.conditional.map((crop) => (
            <Card key={crop.id} className="border-none shadow-sm rounded-3xl bg-white/60 backdrop-blur-sm border border-slate-100">
              <div className="h-28 overflow-hidden rounded-t-3xl">
                <SafeImage src={getCropImage(crop)} alt={crop.name} className="h-full w-full" />
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="font-black text-slate-800">{crop.name}</h4>
                  <Badge variant="outline" className="text-blue-600 border-blue-100 text-[10px]">{Math.round(crop.finalScore)}%</Badge>
                </div>
                <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <p className="text-[10px] text-amber-700 font-medium leading-tight">Can grow with caution. {crop.reason}</p>
                </div>
                <Button variant="ghost" className="w-full text-xs font-black text-slate-400 hover:text-slate-600" onClick={() => { setSelectedCrop(crop); setStep('guide'); }}>
                  Guide & Insights <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 3. PREFERRED CHECK */}
      {recommendations?.preferredCheck && recommendations.preferredCheck.length > 0 && (
         <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black text-slate-800">Status of Your Preferred Crops</h3>
          </div>
          <Card className="border-none shadow-sm rounded-[32px] bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 divide-y divide-slate-100">
                {recommendations.preferredCheck.map((p, i) => (
                  <div key={i} className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${p.status === '✅' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {p.status}
                      </div>
                      <div>
                        <h5 className="font-black text-slate-800">{p.name}</h5>
                        <p className="text-xs text-slate-500 font-medium">{p.advice}</p>
                      </div>
                    </div>
                    <Badge className={p.demand === 'High' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                      {p.demand} Demand
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
         </div>
      )}

      {/* 4. NOT RECOMMENDED */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600">
            <XCircle className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-black text-slate-800">Not Recommended (High Risk)</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations?.notRecommended.map((crop) => (
            <Card key={crop.id} className="border-none shadow-sm rounded-2xl bg-rose-50/30 border border-rose-100/50 grayscale opacity-70">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-600">{crop.name}</h4>
                  <p className="text-[10px] text-rose-600 font-bold uppercase tracking-widest">{crop.reason}</p>
                </div>
                <Badge variant="outline" className="text-slate-400 border-slate-200">Avoid</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CONNECT WITH EXPERT CALL TO ACTION */}
      <div className="pt-10">
        <Card className="border-none bg-white rounded-[40px] shadow-xl overflow-hidden border border-slate-100">
          <CardContent className="p-10 flex flex-col md:flex-row items-center gap-8">
            <div className="flex -space-x-4">
              {[1, 2, 3].map(i => (
                <Avatar key={i} className="h-16 w-16 border-4 border-white shadow-lg">
                  <AvatarImage src={`https://i.pravatar.cc/150?u=exp${i}`} />
                  <AvatarFallback>E</AvatarFallback>
                </Avatar>
              ))}
              <div className="h-16 w-16 rounded-full bg-emerald-100 border-4 border-white flex items-center justify-center text-emerald-600 font-black text-sm shadow-lg z-10">
                +12
              </div>
            </div>
            <div className="flex-1 text-center md:text-left space-y-2">
              <h3 className="text-2xl font-black text-slate-800">Need a second opinion?</h3>
              <p className="text-slate-500 font-medium">Connect with certified agricultural scientists from {location.district} who specialize in these crops.</p>
            </div>
            <ExpertConnect 
              farmContext={formData}
              trigger={
                <Button className="h-16 px-10 rounded-3xl bg-[#2D5A27] hover:bg-[#1e3d1a] text-lg font-black shadow-lg shadow-emerald-100 transition-all hover:scale-105">
                   Talk to an Expert Now
                </Button>
              }
            />
          </CardContent>
        </Card>
      </div>

    </motion.div>
  );

  const renderGuide = () => {
    if (!selectedCrop) return null;
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 pb-32">
        <div className="relative h-56 overflow-hidden rounded-[32px] bg-emerald-900 shadow-xl">
          <SafeImage src={getCropImage(selectedCrop)} alt={`${selectedCrop.name} crop banner`} className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/85 via-emerald-900/45 to-transparent" />
          <div className="relative z-10 flex h-full flex-col justify-end p-8 text-white">
            <Badge className="mb-3 w-fit bg-white/15 text-white backdrop-blur border-none">Crop guide</Badge>
            <h1 className="text-4xl font-black">{selectedCrop.name}</h1>
            <p className="max-w-xl text-sm text-emerald-50">{selectedCrop.requirements.climate}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setStep('results')} className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">{selectedCrop.name}</h2>
              <p className="text-slate-500 font-medium">{selectedCrop.requirements.climate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button className="rounded-full bg-emerald-600 font-black"><CheckCircle2 className="h-4 w-4 mr-2" /> Start Farm Routine</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* FARMING GUIDE */}
            <div className="space-y-6">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <PieChart className="h-6 w-6 text-[#2D5A27]" /> Complete Farming Cycle
              </h3>
              
              <div className="space-y-4">
                {selectedCrop.guide.map((stage, idx) => (
                  <Card key={idx} className="border-none shadow-sm rounded-3xl bg-white overflow-hidden group">
                    <CardHeader className="p-6 cursor-pointer hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors">
                            {idx + 1}
                          </div>
                          <div>
                            <CardTitle className="text-lg font-black text-slate-800">{stage.stage}</CardTitle>
                            <CardDescription className="text-xs font-bold text-emerald-600 uppercase tracking-widest">{stage.when}</CardDescription>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-300" />
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-0 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Action Required</p>
                          <p className="text-sm font-medium text-slate-700 leading-relaxed">{stage.what}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Execution Steps</p>
                          <p className="text-sm text-slate-500 leading-relaxed italic">{stage.how}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* MARKET INSIGHTS */}
            <Card className="border-none shadow-xl bg-white rounded-[40px] overflow-hidden sticky top-24">
              <div className="bg-emerald-900 p-8 text-white">
                <TrendingUp className="h-10 w-10 mb-4 text-emerald-400" />
                <h4 className="text-2xl font-black">Market Intelligence</h4>
                <p className="opacity-60 text-xs mt-1">Real-time demand projection</p>
              </div>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-500">Current Market Price</span>
                    <span className="text-2xl font-black text-[#2D5A27]">{selectedCrop.market.currentPrice}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-500">Demand Velocity</span>
                    <Badge className="bg-emerald-100 text-emerald-700 border-none font-black px-4 h-8 rounded-full">
                       {selectedCrop.market.demand}% - HIGH
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-500">Society Demand</span>
                    <span className="text-xs font-black text-slate-700">{selectedCrop.market.societyConsumption}</span>
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Profit Trend</p>
                    <div className="flex items-center gap-2 text-emerald-600 font-black">
                      <TrendingUp className="h-5 w-5" /> Positive Seasonal Growth Expected
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" /> Risk Assessment
                  </h5>
                  <div className="space-y-3">
                    <div className="bg-rose-50 p-3 rounded-2xl border border-rose-100">
                      <p className="text-[10px] font-black text-rose-400 uppercase flex items-center gap-1">Weather Risk</p>
                      <p className="text-[11px] text-rose-700 font-medium italic mt-1">{selectedCrop.risks.weather}</p>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100">
                      <p className="text-[10px] font-black text-amber-400 uppercase flex items-center gap-1">Market Risk</p>
                      <p className="text-[11px] text-amber-700 font-medium italic mt-1">{selectedCrop.risks.market}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100">
                      <p className="text-[10px] font-black text-blue-400 uppercase flex items-center gap-1">Resource Risk</p>
                      <p className="text-[11px] text-blue-700 font-medium italic mt-1">{selectedCrop.risks.resource}</p>
                    </div>
                  </div>
                </div>

                <ExpertConnect 
                  cropContext={selectedCrop.name}
                  farmContext={formData}
                  trigger={
                    <Button className="w-full bg-[#2D5A27] h-14 rounded-[24px] font-black shadow-lg shadow-emerald-100 text-lg gap-2">
                      <MessageCircle className="h-5 w-5" /> Connect with Expert
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <Layout title="Smart Demand Crop Advisor">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {step === 'form' && renderForm()}
          {step === 'results' && renderResults()}
          {step === 'guide' && renderGuide()}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
