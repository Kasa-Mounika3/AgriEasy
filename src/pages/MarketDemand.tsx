import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  MapPin, 
  ShoppingBag, 
  Users, 
  Sprout, 
  Droplets, 
  CloudSun, 
  ChevronRight, 
  ArrowLeft,
  Volume2,
  Bookmark,
  Activity,
  Calendar,
  Hammer,
  Bug,
  Leaf,
  Scissors,
  CheckCircle2,
  AlertTriangle,
  Info,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocationContext } from '@/contexts/LocationContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// Detailed Market Demand Data
const demandData = [
  {
    id: '1',
    name: 'Red Onion (Nasik)',
    category: 'Vegetables',
    demandLevel: 'High',
    priceTrend: '+12%',
    profitPotential: 'High',
    description: 'High export demand and domestic consumption. Prices rising due to seasonal gap.',
    societyDemand: 'Constant Daily Use',
    currentPrice: '₹45/kg',
    priceHistory: ['₹32', '₹38', '₹42', '₹45'],
    isTrending: true,
    isHighProfit: true,
    suitableConditions: {
      soil: 'Deep friable loamy soil',
      water: 'Moderate',
      climate: 'Mild winter, cool growth',
      labour: 'High (Manual weeding & harvest)'
    },
    process: [
      {
        stage: 'Land Preparation',
        details: 'Plough field 3-4 times. Mix 20 tons of FYM per hectare. Form beds of 15cm height.',
        tips: 'Soil should be fine tilth and free from clods.'
      },
      {
        stage: 'Sowing/Transplanting',
        details: 'Nursery sowing in Oct-Nov. Seedling transplanting after 6-8 weeks.',
        tips: 'Space 15cm x 10cm for optimal bulb size.'
      },
      {
        stage: 'Irrigation',
        details: 'Light irrigation immediately after transplanting. Every 10-12 days thereafter.',
        tips: 'Stop irrigation 15 days before harvest for better shelf life.'
      },
      {
        stage: 'Fertilizers',
        details: '100:50:50 kg NPK/ha. 50% Nitrogen as basal, rest in 2 splits.',
        tips: 'Sulphur application improves bulb quality and pungency.'
      },
      {
        stage: 'Pest Control',
        details: 'Watch for Thrips and Purple Blotch. Use Neem oil spray or systemic insecticides.',
        tips: 'Monitor crop weekly during early growth stages.'
      },
      {
        stage: 'Maintenance',
        details: '2-3 manual weedings or chemical weedicides. Earthing up at 45 days.',
        tips: 'Avoid deep hoeing to prevent root damage.'
      },
      {
        stage: 'Harvesting',
        details: 'Harvest when 50% tops fall. Cure in shade for 3-4 days.',
        tips: 'Do not harvest immediately after rain.'
      },
      {
        stage: 'Post-Harvest',
        details: 'Sort bulbs by size. Store in ventilated dark rooms (Chawls).',
        tips: 'Proper curing reduces storage rot by 40%.'
      }
    ]
  },
  {
    id: '2',
    name: 'Organic Turmeric',
    category: 'Organic Products',
    demandLevel: 'High',
    priceTrend: '+8%',
    profitPotential: 'Very High',
    description: 'Surging global demand for high-curcumin turmeric exports and pharmaceutical use.',
    societyDemand: 'Health & Wellness Focus',
    currentPrice: '₹220/kg',
    priceHistory: ['₹180', '₹195', '₹205', '₹220'],
    isTrending: true,
    isHighProfit: true,
    suitableConditions: {
      soil: 'Sandy/Clayey loam',
      water: 'High (Requires moisture)',
      climate: 'Hot & Humid',
      labour: 'Medium'
    },
    process: [
      {
        stage: 'Land Preparation',
        details: 'Deep ploughing and making ridges and furrows. Apply green manure.',
        tips: 'Soil must be well-drained to prevent rhizome rot.'
      },
      {
        stage: 'Sowing',
        details: 'April-May. Use healthy rhizomes weighing 30-40g.',
        tips: 'Treat rhizomes with organic fungicides before planting.'
      },
      {
        stage: 'Irrigation',
        details: 'Frequent irrigation at 7-10 day intervals starting from planting.',
        tips: 'Mulching with green leaves helps retain moisture.'
      },
      {
        stage: 'Fertilizers',
        details: 'Heavy organic manuring (30t FYM/ha). NPK 60:50:120 kg/ha.',
        tips: 'Split potash application for better yield.'
      },
      {
        stage: 'Pest Control',
        details: 'Rhizome scale and Leaf blotch are major concerns. Use bio-control agents.',
        tips: 'Keep field clean; rotate with non-host crops.'
      },
      {
        stage: 'Maintenance',
        details: 'Weeding at 60, 90, and 120 days. Earthing up rhizomes.',
        tips: 'Avoid water stagnation at any stage.'
      },
      {
        stage: 'Harvesting',
        details: 'January-March. Ready when leaves wither and yellow.',
        tips: 'Carefully dig out without bruising rhizomes.'
      },
      {
        stage: 'Post-Harvest',
        details: 'Curing (boiling), drying in sun, and polishing.',
        tips: 'Controlled boiling ensures uniform colour.'
      }
    ]
  },
  {
    id: '3',
    name: 'Tomato (Hybrid)',
    category: 'Vegetables',
    demandLevel: 'Medium-High',
    priceTrend: '+5%',
    profitPotential: 'Medium',
    description: 'High society demand for fresh salads and processing units.',
    societyDemand: 'Essential Daily Item',
    currentPrice: '₹35/kg',
    priceHistory: ['₹25', '₹28', '₹32', '₹35'],
    isTrending: false,
    isHighProfit: false,
    suitableConditions: {
      soil: 'Well-drained sandy loam',
      water: 'Moderate',
      climate: 'Warm & Sunny',
      labour: 'High (Staking & Picking)'
    },
    process: [
      {
        stage: 'Land Preparation',
        details: 'Plough field to fine tilth. Add 15t FYM. Form raised beds.',
        tips: 'Use plastic mulch for better water conservation.'
      },
      {
        stage: 'Sowing',
        details: 'Nursery tray sowing. Transplant after 25-30 days.',
        tips: 'Dip roots in bio-fertilizer solution before planting.'
      },
      {
        stage: 'Irrigation',
        details: 'Drip irrigation preferred. Avoid overhead sprinkling.',
        tips: 'Keep soil consistently moist but not soggy.'
      },
      {
        stage: 'Fertilizers',
        details: '150:100:100 kg NPK/ha. Focus on Calcium and Boron.',
        tips: 'Fertigate every 5-7 days after establishment.'
      },
      {
        stage: 'Pest Control',
        details: 'Fruit Borer and Whitefly are main pests. Use yellow sticky traps.',
        tips: 'Remove infected plants immediately (Viral control).'
      },
      {
        stage: 'Maintenance',
        details: 'Staking at 45 days. Pruning side branches.',
        tips: 'Provide support to keep fruits away from soil.'
      },
      {
        stage: 'Harvesting',
        details: 'Pick at Pink stage for long distance transport.',
        tips: 'Harvest early morning or evening.'
      },
      {
        stage: 'Post-Harvest',
        details: 'Grade by size/colour. Pack in plastic crates.',
        tips: 'Pre-cooling extends life by 5-7 days.'
      }
    ]
  },
  {
    id: '4',
    name: 'Dragon Fruit',
    category: 'Exotic Fruits',
    demandLevel: 'High',
    priceTrend: '+15%',
    profitPotential: 'Very High',
    description: 'Growing health conscious market. Low maintenance, high returns after 3 years.',
    societyDemand: 'Superfood Trend',
    currentPrice: '₹120/fruit',
    priceHistory: ['₹80', '₹100', '₹110', '₹120'],
    isTrending: true,
    isHighProfit: true,
    suitableConditions: {
      soil: 'Sandy soil with good drainage',
      water: 'Low (Cactus family)',
      climate: 'Tropical/Subtropical',
      labour: 'Low'
    },
    process: [
      {
        stage: 'Land Preparation',
        details: 'Clear land. Set up concrete poles for support (T-frame).',
        tips: 'Place poles 3m x 3m apart.'
      },
      {
        stage: 'Sowing',
        details: 'Use 1-year-old cuttings. Plant 4 cuttings per pole.',
        tips: 'Apply fungicide to cut ends before planting.'
      },
      {
        stage: 'Irrigation',
        details: 'Drip irrigation once a week in summer. Minimum in winter.',
        tips: 'Avoid overwatering; it leads to root rot.'
      },
      {
        stage: 'Fertilizers',
        details: '10kg FYM + 250g NPK per pole annually in splits.',
        tips: 'Increase potassium during fruiting stage.'
      },
      {
        stage: 'Pest Control',
        details: 'Snails, Ants, and Bird damage are main issues.',
        tips: 'Use nets during fruiting season.'
      },
      {
        stage: 'Maintenance',
        details: 'Pruning twice a year to maintain canopy shape.',
        tips: 'Focus on growth towards the pole support.'
      },
      {
        stage: 'Harvesting',
        details: 'Harvest 30-35 days after flowering when skin turns red.',
        tips: 'Cut fruit with a small part of the stem attached.'
      },
      {
        stage: 'Post-Harvest',
        details: 'Washing and grading. Store in cool, dry place.',
        tips: 'Avoid direct sunlight after picking.'
      }
    ]
  }
];

export default function MarketDemand() {
  const navigate = useNavigate();
  const { location } = useLocationContext();
  const [selectedCrop, setSelectedCrop] = useState<typeof demandData[0] | null>(null);
  const [view, setView] = useState<'dashboard' | 'detail'>('dashboard');

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const currentLocText = location.isCustom 
    ? `${location.locality || location.city}, ${location.state}` 
    : "General Demand (India)";

  const handleBack = () => {
    if (view === 'detail') {
      setView('dashboard');
      setSelectedCrop(null);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <Layout 
      title={view === 'dashboard' ? "Market Demand" : selectedCrop?.name} 
      showBackButton={true}
      onBack={handleBack}
    >
      <div className="max-w-5xl mx-auto space-y-6 pb-20">
        
        <AnimatePresence mode="wait">
          {view === 'dashboard' ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Header Stats */}
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-emerald-600" />
                    Demand Intelligence
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <MapPin className="h-3 w-3" />
                    <span>Analyzing trends for {currentLocText}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-3 py-1">
                    Market Open
                  </Badge>
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-3 py-1">
                    Early Kharif Season
                  </Badge>
                </div>
              </div>

              {/* Smart Recommendations Bar */}
              <Card className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white border-none shadow-xl rounded-[24px]">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-emerald-100">
                        <Activity className="h-5 w-5" />
                        <span className="text-sm font-medium uppercase tracking-wider">Smart Harvest Recommendation</span>
                      </div>
                      <h3 className="text-2xl font-bold">Grow {demandData[0].name} for Max Profit</h3>
                      <p className="text-emerald-100/80 text-sm max-w-md">
                        Based on your current soil context and trending prices in {location.district || "your region"}, 
                        starting {demandData[0].name} now could yield 30% higher returns.
                      </p>
                    </div>
                    <Button 
                      className="bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl h-12 px-6 font-bold"
                      onClick={() => {
                        setSelectedCrop(demandData[0]);
                        setView('detail');
                      }}
                    >
                      View Smart Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Demand Trends Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white shadow-sm border-none rounded-2xl overflow-hidden p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <h4 className="font-bold text-gray-800">Local Market Demand</h4>
                  </div>
                  <div className="space-y-4">
                    {demandData.slice(0, 3).map(crop => (
                      <div key={crop.id} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{crop.name}</span>
                        <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-100">
                          {crop.demandLevel}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="bg-white shadow-sm border-none rounded-2xl overflow-hidden p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                      <Users className="h-5 w-5" />
                    </div>
                    <h4 className="font-bold text-gray-800">Society Demand</h4>
                  </div>
                  <div className="space-y-4">
                    {demandData.map(crop => (
                      <div key={crop.id} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{crop.name}</span>
                        <span className="text-[10px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                          {crop.societyDemand}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="bg-white shadow-sm border-none rounded-2xl overflow-hidden p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <h4 className="font-bold text-gray-800">Price Trends (7D)</h4>
                  </div>
                  <div className="space-y-4">
                    {demandData.map(crop => (
                      <div key={crop.id} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{crop.name}</span>
                        <span className="text-xs font-bold text-emerald-600">{crop.priceTrend}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Main Crop List */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800">Recommend Products for You</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {demandData.map((crop) => (
                    <Card 
                      key={crop.id} 
                      className="group border-none shadow-sm hover:shadow-lg transition-all rounded-[24px] overflow-hidden bg-white cursor-pointer"
                      onClick={() => {
                        setSelectedCrop(crop);
                        setView('detail');
                      }}
                    >
                      <CardContent className="p-0">
                        <div className="flex gap-4">
                          <div className="w-1/3 bg-gray-100 flex items-center justify-center p-6 group-hover:bg-emerald-50 transition-colors">
                            <Sprout className="h-12 w-12 text-emerald-600 group-hover:scale-110 transition-transform" />
                          </div>
                          <div className="w-2/3 p-4 flex flex-col justify-between">
                            <div className="space-y-1">
                              <div className="flex justify-between items-start">
                                <h4 className="font-bold text-gray-900 group-hover:text-emerald-700">{crop.name}</h4>
                                <div className="flex gap-1">
                                  {crop.isTrending && <Badge className="bg-blue-500 text-white text-[8px] h-4 px-1">Trending</Badge>}
                                  {crop.isHighProfit && <Badge className="bg-amber-500 text-white text-[8px] h-4 px-1">High Profit</Badge>}
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 line-clamp-2">{crop.description}</p>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
                                  {crop.demandLevel} Demand
                                </span>
                                <span className="text-xs font-bold text-gray-900">{crop.currentPrice}</span>
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-300 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Detail Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-50 text-emerald-700 border-none">{selectedCrop?.category}</Badge>
                    <Badge variant="outline" className="text-blue-600 border-blue-200">Price Trend: {selectedCrop?.priceTrend}</Badge>
                  </div>
                  <h2 className="text-4xl font-bold text-gray-900">{selectedCrop?.name}</h2>
                  <p className="text-gray-600 max-w-xl text-lg leading-relaxed">{selectedCrop?.description}</p>
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="rounded-xl border-emerald-100 gap-2"
                    onClick={() => speak(selectedCrop?.description || "")}
                  >
                    <Volume2 className="h-4 w-4" />
                    Explain
                  </Button>
                  <Button 
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 gap-2 shadow-lg shadow-emerald-200"
                    onClick={() => toast.success("Farming Plan Saved to your Profile!")}
                  >
                    <Bookmark className="h-4 w-4" />
                    Save Plan
                  </Button>
                </div>
              </div>

              {/* Quick Specs Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-emerald-50/50 border-none p-4 rounded-3xl">
                  <div className="flex items-center gap-2 text-emerald-800 mb-2">
                    <Sprout className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase">Soil Type</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800">{selectedCrop?.suitableConditions.soil}</p>
                </Card>
                <Card className="bg-blue-50/50 border-none p-4 rounded-3xl">
                  <div className="flex items-center gap-2 text-blue-800 mb-2">
                    <Droplets className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase">Water Needs</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800">{selectedCrop?.suitableConditions.water}</p>
                </Card>
                <Card className="bg-amber-50/50 border-none p-4 rounded-3xl">
                  <div className="flex items-center gap-2 text-amber-800 mb-2">
                    <CloudSun className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase">Climate</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800">{selectedCrop?.suitableConditions.climate}</p>
                </Card>
                <Card className="bg-purple-50/50 border-none p-4 rounded-3xl">
                  <div className="flex items-center gap-2 text-purple-800 mb-2">
                    <Hammer className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase">Labour</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800">{selectedCrop?.suitableConditions.labour}</p>
                </Card>
              </div>

              {/* Price Insight Card */}
              <Card className="bg-white shadow-sm border border-emerald-50 rounded-[28px] overflow-hidden">
                <CardHeader className="border-b border-emerald-50 bg-emerald-50/20">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                    Regional Market Insight
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
                        <span className="text-gray-500 font-medium">Retail Price</span>
                        <span className="text-2xl font-bold text-[#2D5A27]">{selectedCrop?.currentPrice}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Future Prediction</span>
                          <span className="text-emerald-600 font-bold">Stable Growth</span>
                        </div>
                        <p className="text-xs text-gray-400">
                          Based on seasonal patterns, demand for {selectedCrop?.name} in {location.state} is expected to grow by 10% in the next quarter.
                        </p>
                      </div>
                    </div>
                    {/* Visual Timeline for prices */}
                    <div className="flex items-end gap-3 h-24 px-4 overflow-hidden pt-4">
                      {selectedCrop?.priceHistory.map((price, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                          <div 
                            className="w-full bg-emerald-500/20 rounded-t-lg group relative cursor-pointer" 
                            style={{ height: `${20 + i * 20}%` }}
                          >
                            <div className="absolute inset-0 bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-lg" />
                          </div>
                          <span className="text-[10px] font-bold text-gray-500">{price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Process (Stage-wise) */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900 border-l-4 border-emerald-600 pl-4">Cultivation Roadmap</h3>
                <div className="space-y-4">
                   {selectedCrop?.process.map((p, idx) => (
                     <Card key={idx} className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                       <CardHeader className="p-4 pb-0">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold">
                              {idx + 1}
                            </div>
                            <CardTitle className="text-lg text-emerald-900">{p.stage}</CardTitle>
                         </div>
                       </CardHeader>
                       <CardContent className="p-4 pt-4 ml-14 flex flex-col md:flex-row gap-6">
                         <div className="flex-1">
                           <p className="text-sm text-gray-600 leading-relaxed">{p.details}</p>
                         </div>
                         <div className="md:w-1/3 bg-emerald-50 p-4 rounded-2xl">
                            <div className="flex items-center gap-2 font-bold text-emerald-800 text-xs mb-2 uppercase">
                              <CheckCircle2 className="h-3 w-3" />
                              Expert Tips
                            </div>
                            <p className="text-[11px] text-emerald-700 italic">"{p.tips}"</p>
                         </div>
                       </CardContent>
                     </Card>
                   ))}
                </div>
              </div>

              {/* Footer CTA */}
              <div className="pt-6">
                 <Card className="bg-gray-900 text-white rounded-[32px] p-8 overflow-hidden relative border-none">
                    <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl" />
                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
                       <div className="space-y-2">
                          <h4 className="text-2xl font-bold">Ready to Start?</h4>
                          <p className="text-gray-400 max-w-sm">Connect with local FPOs or purchase seeds from our verified market vendors today.</p>
                       </div>
                       <div className="flex gap-4">
                          <Button 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-14 px-8 rounded-2xl font-bold text-lg transition-transform active:scale-95"
                            onClick={() => navigate('/shop')}
                          >
                            Shop Seeds
                          </Button>
                          <Button 
                            variant="outline" 
                            className="bg-transparent border-white/20 hover:bg-white/10 text-white h-14 px-8 rounded-2xl font-bold text-lg"
                            onClick={() => navigate('/fpo')}
                          >
                            Find FPO
                          </Button>
                       </div>
                    </div>
                 </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </Layout>
  );
}
