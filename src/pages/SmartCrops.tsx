import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { 
  Sprout, 
  Droplets, 
  Waves, 
  Users, 
  MapPin, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Info, 
  ArrowRight, 
  Calendar, 
  Hammer, 
  Bug, 
  Activity, 
  Scissors, 
  AlertTriangle,
  Download,
  Save,
  Volume2,
  ChevronRight,
  Loader2,
  LineChart as ChartIcon,
  Bot
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { ai, MODELS } from '@/lib/gemini';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { CropRecommendation, CropPlan } from '@/types';
import { Type } from "@google/genai";

const soilTypes = ['Sandy', 'Clay', 'Loamy', 'Black soil', 'Red soil'];
const waterAvailability = ['Low', 'Medium', 'High'];
const irrigationTypes = ['Drip', 'Sprinkler', 'Canal', 'Rain-fed'];
const labourAvailability = ['Low', 'Medium', 'High'];

export default function SmartCrops() {
  const [step, setStep] = useState<'form' | 'results' | 'guide'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    soilType: '',
    waterAvailability: '',
    irrigationType: '',
    landArea: '',
    labourAvailability: '',
    preferredCrops: ''
  });
  const [recommendations, setRecommendations] = useState<{
    recommended: CropRecommendation[];
    nonRecommended: CropRecommendation[];
    preferredAnalysis?: { name: string; suitable: boolean; reason: string }[];
  } | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<CropRecommendation | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        if (docSnap.exists()) {
          setUserProfile(docSnap.data());
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, []);

  const handleGenerate = async () => {
    if (!formData.soilType || !formData.waterAvailability || !formData.irrigationType || !formData.landArea || !formData.labourAvailability) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: MODELS.flash,
        contents: `
          Analyze the following farmer inputs and provide structured recommendations:
          
          INPUT DATA:
          - Soil Type: ${formData.soilType}
          - Water Availability: ${formData.waterAvailability}
          - Irrigation Type: ${formData.irrigationType}
          - Land Area: ${formData.landArea} acres
          - Labour Availability: ${formData.labourAvailability}
          - Location: ${userProfile?.location?.locality || 'Local Area'}, ${userProfile?.location?.district || 'Unknown'}, ${userProfile?.location?.state || 'India'}
          - Preferred Crops: ${formData.preferredCrops || 'None'}

          Rules:
          - ALWAYS give output.
          - If data is incomplete, give best possible general recommendations for this region.
          - Keep response clear and structured.
          - Avoid long explanations.
        `,
        config: {
          systemInstruction: `
              You are AgriEasy, an intelligent agricultural assistant. 
              Analyze farmer inputs and ALWAYS return a JSON response.
              
              OUTPUT FORMAT RULES:
              1. RECOMMENDED CROPS (3-5 crops): List name and a short reason (soil, water, climate, demand).
              2. NON-RECOMMENDED CROPS (2-3 crops): List name and reason why not suitable.
              3. PREFERRED CROPS CHECK: 
                 - If user provided crops: Return "Suitable ✅" or "Not Suitable ❌" with a short explanation for each.
                 - If none provided: Return "No preferred crops given".
              4. BASIC FARMING STEPS (SHORT): For the top 2 recommended crops, provide 1-2 line instructions for: Land preparation, Sowing time, Irrigation, Fertilizers, Pest control, and Harvest time.
              5. MARKET INSIGHT: High demand crops and Profit potential (Low/Medium/High).

              TONE: Simple English, clear, practical, and farmer-friendly.
          `,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommended: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    suitabilityScore: { type: Type.NUMBER },
                    reason: { type: Type.STRING },
                    marketIntel: {
                      type: Type.OBJECT,
                      properties: {
                        demand: { type: Type.STRING },
                        priceTrends: { type: Type.STRING },
                        futurePrediction: { type: Type.STRING },
                        profitPotential: { type: Type.STRING, enum: ["Low", "Medium", "High"] }
                      }
                    },
                    guide: {
                      type: Type.OBJECT,
                      properties: {
                        landPreparation: { type: Type.STRING },
                        sowing: { type: Type.STRING },
                        irrigation: { type: Type.STRING },
                        fertilizers: { type: Type.STRING },
                        pestControl: { type: Type.STRING },
                        maintenance: { type: Type.STRING },
                        harvesting: { type: Type.STRING },
                        precautions: { type: Type.ARRAY, items: { type: Type.STRING } },
                        dosAndDonts: {
                          type: Type.OBJECT,
                          properties: {
                            do: { type: Type.ARRAY, items: { type: Type.STRING } },
                            dont: { type: Type.ARRAY, items: { type: Type.STRING } }
                          }
                        },
                        riskAlerts: { type: Type.ARRAY, items: { type: Type.STRING } }
                      }
                    }
                  }
                }
              },
              nonRecommended: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    reason: { type: Type.STRING }
                  }
                }
              },
              preferredAnalysis: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    suitable: { type: Type.BOOLEAN },
                    reason: { type: Type.STRING }
                  }
                }
              }
            }
          },
          maxOutputTokens: 16000,
        }
      });

      let text = response.text;
      if (typeof text !== 'string') {
        throw new Error('AI response is not a valid string');
      }

      // Clean up text if AI mistakenly includes markdown backticks or extra noise
      let jsonStr = text.trim();
      
      // Try to extract JSON between first [ or { and last ] or }
      const startChar = jsonStr.indexOf('{');
      const endChar = jsonStr.lastIndexOf('}');
      if (startChar !== -1 && endChar !== -1 && endChar > startChar) {
        jsonStr = jsonStr.substring(startChar, endChar + 1);
      } else {
        // Fallback for arrays if needed (though schema is object)
        const startArr = jsonStr.indexOf('[');
        const endArr = jsonStr.lastIndexOf(']');
        if (startArr !== -1 && endArr !== -1 && endArr > startArr) {
          jsonStr = jsonStr.substring(startArr, endArr + 1);
        }
      }

      const data = JSON.parse(jsonStr);
      setRecommendations(data);
      setStep('results');
    } catch (error) {
      console.error('AI Error:', error);
      toast.error('Failed to generate recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePlan = async (crop: CropRecommendation) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const plan: CropPlan = {
        userId: user.uid,
        cropName: crop.name,
        soilType: formData.soilType,
        waterAvailability: formData.waterAvailability,
        irrigationType: formData.irrigationType,
        landArea: formData.landArea,
        labourAvailability: formData.labourAvailability,
        guide: crop.guide,
        createdAt: Date.now()
      };

      await addDoc(collection(db, 'crop_plans'), plan);
      toast.success('Crop plan saved successfully!');
    } catch (error) {
      console.error('Save Error:', error);
      toast.error('Failed to save crop plan');
    }
  };

  const handleSpeak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <Layout title="Smart Crops" showBackButton={step !== 'form'} onBack={() => {
      if (step === 'results') setStep('form');
      if (step === 'guide') setStep('results');
    }}>
      <div className="max-w-4xl mx-auto pb-20">
        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-[#2D5A27]">Intelligent Crop Planning</h2>
                <p className="text-gray-500">Enter your farm details for AI-powered recommendations</p>
              </div>

              <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <Sprout className="h-4 w-4 text-emerald-600" />
                        Soil Type
                      </Label>
                      <Select 
                        value={formData.soilType}
                        onValueChange={(v) => setFormData({ ...formData, soilType: v })}
                      >
                        <SelectTrigger className="rounded-xl border-gray-100 h-12">
                          <SelectValue placeholder="Select soil type" />
                        </SelectTrigger>
                        <SelectContent>
                          {soilTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <Droplets className="h-4 w-4 text-blue-600" />
                        Water Availability
                      </Label>
                      <Select 
                        value={formData.waterAvailability}
                        onValueChange={(v) => setFormData({ ...formData, waterAvailability: v })}
                      >
                        <SelectTrigger className="rounded-xl border-gray-100 h-12">
                          <SelectValue placeholder="Select availability" />
                        </SelectTrigger>
                        <SelectContent>
                          {waterAvailability.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <Waves className="h-4 w-4 text-cyan-600" />
                        Irrigation Type
                      </Label>
                      <Select 
                        value={formData.irrigationType}
                        onValueChange={(v) => setFormData({ ...formData, irrigationType: v })}
                      >
                        <SelectTrigger className="rounded-xl border-gray-100 h-12">
                          <SelectValue placeholder="Select irrigation" />
                        </SelectTrigger>
                        <SelectContent>
                          {irrigationTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-rose-600" />
                        Land Area (Acres)
                      </Label>
                      <Input 
                        type="number" 
                        placeholder="e.g. 5" 
                        className="rounded-xl border-gray-100 h-12"
                        onChange={(e) => setFormData({ ...formData, landArea: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <Users className="h-4 w-4 text-amber-600" />
                        Labour Availability
                      </Label>
                      <Select 
                        value={formData.labourAvailability}
                        onValueChange={(v) => setFormData({ ...formData, labourAvailability: v })}
                      >
                        <SelectTrigger className="rounded-xl border-gray-100 h-12">
                          <SelectValue placeholder="Select availability" />
                        </SelectTrigger>
                        <SelectContent>
                          {labourAvailability.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <Sprout className="h-4 w-4 text-purple-600" />
                        Preferred Crops (Optional)
                      </Label>
                      <Input 
                        placeholder="e.g. Wheat, Cotton" 
                        className="rounded-xl border-gray-100 h-12"
                        onChange={(e) => setFormData({ ...formData, preferredCrops: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button 
                    className="w-full h-14 rounded-2xl bg-[#2D5A27] hover:bg-[#1E3D1A] text-lg font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95"
                    onClick={handleGenerate}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Analyzing Farm Data...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Bot className="h-6 w-6" />
                        Generate Smart Recommendations
                      </div>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 'results' && recommendations && (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#2D5A27]">AI Recommendations</h2>
                  <p className="text-gray-500">Based on your farm profile and current market</p>
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1">
                  {userProfile?.location?.district || 'Local'} Market Active
                </Badge>
              </div>

              {/* Recommended Crops */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendations.recommended.map((crop, i) => (
                  <motion.div
                    key={crop.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card 
                      className="border-none shadow-lg hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
                      onClick={() => {
                        setSelectedCrop(crop);
                        setStep('guide');
                      }}
                    >
                      <div className="absolute top-0 right-0 p-3">
                        <div className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                          {crop.suitabilityScore}% Match
                        </div>
                      </div>
                      <CardContent className="p-6 space-y-4">
                        <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                          <Sprout className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">{crop.name}</h3>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1">{crop.reason}</p>
                        </div>
                        <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                          <div className="flex items-center gap-1 text-emerald-600 font-bold text-sm">
                            <TrendingUp className="h-4 w-4" />
                            <span>High Demand</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-300 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Preferred Analysis */}
              {recommendations.preferredAnalysis && recommendations.preferredAnalysis.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-500" />
                    Preferred Crops Analysis
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendations.preferredAnalysis.map((item) => (
                      <Card key={item.name} className="border-none shadow-sm bg-white">
                        <CardContent className="p-4 flex items-start gap-4">
                          {item.suitable ? (
                            <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />
                          ) : (
                            <XCircle className="h-6 w-6 text-rose-500 shrink-0" />
                          )}
                          <div>
                            <h4 className="font-bold text-gray-800">{item.name}</h4>
                            <p className="text-sm text-gray-500 mt-1">{item.reason}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-2xl text-center text-gray-500 text-sm border border-dashed border-gray-200">
                  No preferred crops given
                </div>
              )}

              {/* Non-Recommended */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-rose-500" />
                  Crops to Avoid
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendations.nonRecommended.map((crop) => (
                    <Card key={crop.name} className="border-none shadow-sm bg-rose-50/50">
                      <CardContent className="p-4 flex items-start gap-4">
                        <XCircle className="h-6 w-6 text-rose-400 shrink-0" />
                        <div>
                          <h4 className="font-bold text-rose-900">{crop.name}</h4>
                          <p className="text-sm text-rose-700 mt-1">{crop.reason}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Market Intelligence */}
              <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-600 to-emerald-800 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChartIcon className="h-5 w-5" />
                    Market Intelligence
                  </CardTitle>
                  <CardDescription className="text-emerald-100">Current trends and future predictions</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {recommendations.recommended.slice(0, 3).map(crop => (
                    <div key={crop.name} className="space-y-2">
                      <h4 className="font-bold border-b border-white/20 pb-2">{crop.name}</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="opacity-70">Demand</span>
                          <span className="font-medium">{crop.marketIntel.demand}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="opacity-70">Price Trend</span>
                          <span className="font-medium">{crop.marketIntel.priceTrends}</span>
                        </div>
                        <p className="text-[10px] opacity-80 italic mt-2">"{crop.marketIntel.futurePrediction}"</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 'guide' && selectedCrop && (
            <motion.div
              key="guide"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-emerald-100 rounded-3xl flex items-center justify-center text-emerald-600">
                    <Sprout className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-[#2D5A27]">{selectedCrop.name}</h2>
                    <p className="text-gray-500">Complete Farming Guide & Timeline</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="rounded-xl gap-2" onClick={() => handleSpeak(selectedCrop.guide.landPreparation)}>
                    <Volume2 className="h-4 w-4" />
                    Listen
                  </Button>
                  <Button variant="outline" className="rounded-xl gap-2">
                    <Download className="h-4 w-4" />
                    PDF
                  </Button>
                  <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={() => handleSavePlan(selectedCrop)}>
                    <Save className="h-4 w-4" />
                    Save Plan
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="timeline" className="w-full">
                <TabsList className="w-full grid grid-cols-2 rounded-2xl p-1 bg-gray-100 h-14">
                  <TabsTrigger value="timeline" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">Farming Timeline</TabsTrigger>
                  <TabsTrigger value="details" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">Precautions & Risks</TabsTrigger>
                </TabsList>

                <TabsContent value="timeline" className="mt-6">
                  <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-emerald-200 before:via-emerald-400 before:to-emerald-200">
                    
                    {/* Stage 1: Land Preparation */}
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-emerald-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        <Hammer className="h-5 w-5" />
                      </div>
                      <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 border-none shadow-lg bg-white">
                        <h4 className="font-bold text-emerald-800 flex items-center gap-2">
                          Stage 1: Land Preparation
                        </h4>
                        <p className="text-sm text-gray-600 mt-2">{selectedCrop.guide.landPreparation}</p>
                      </Card>
                    </div>

                    {/* Stage 2: Sowing */}
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-emerald-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 border-none shadow-lg bg-white">
                        <h4 className="font-bold text-emerald-800">Stage 2: Sowing</h4>
                        <p className="text-sm text-gray-600 mt-2">{selectedCrop.guide.sowing}</p>
                      </Card>
                    </div>

                    {/* Stage 3: Irrigation */}
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-emerald-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        <Waves className="h-5 w-5" />
                      </div>
                      <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 border-none shadow-lg bg-white">
                        <h4 className="font-bold text-emerald-800">Stage 3: Irrigation</h4>
                        <p className="text-sm text-gray-600 mt-2">{selectedCrop.guide.irrigation}</p>
                      </Card>
                    </div>

                    {/* Stage 4: Fertilizers */}
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-emerald-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        <Droplets className="h-5 w-5" />
                      </div>
                      <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 border-none shadow-lg bg-white">
                        <h4 className="font-bold text-emerald-800">Stage 4: Fertilizers</h4>
                        <p className="text-sm text-gray-600 mt-2">{selectedCrop.guide.fertilizers}</p>
                      </Card>
                    </div>

                    {/* Stage 5: Pest Control */}
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-emerald-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        <Bug className="h-5 w-5" />
                      </div>
                      <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 border-none shadow-lg bg-white">
                        <h4 className="font-bold text-emerald-800">Stage 5: Pest Control</h4>
                        <p className="text-sm text-gray-600 mt-2">{selectedCrop.guide.pestControl}</p>
                      </Card>
                    </div>

                    {/* Stage 6: Maintenance */}
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-emerald-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        <Activity className="h-5 w-5" />
                      </div>
                      <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 border-none shadow-lg bg-white">
                        <h4 className="font-bold text-emerald-800">Stage 6: Maintenance</h4>
                        <p className="text-sm text-gray-600 mt-2">{selectedCrop.guide.maintenance}</p>
                      </Card>
                    </div>

                    {/* Stage 7: Harvesting */}
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-emerald-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        <Scissors className="h-5 w-5" />
                      </div>
                      <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 border-none shadow-lg bg-white">
                        <h4 className="font-bold text-emerald-800">Stage 7: Harvesting</h4>
                        <p className="text-sm text-gray-600 mt-2">{selectedCrop.guide.harvesting}</p>
                      </Card>
                    </div>

                  </div>
                </TabsContent>

                <TabsContent value="details" className="mt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-none shadow-md bg-amber-50">
                      <CardHeader>
                        <CardTitle className="text-amber-800 flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          Risk Alerts
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {selectedCrop.guide.riskAlerts.map((risk, i) => (
                            <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                              {risk}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-md bg-blue-50">
                      <CardHeader>
                        <CardTitle className="text-blue-800 flex items-center gap-2">
                          <Info className="h-5 w-5" />
                          Weather Precautions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {selectedCrop.guide.precautions.map((p, i) => (
                            <li key={i} className="text-sm text-blue-700 flex items-start gap-2">
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                              {p}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="border-none shadow-md">
                    <CardHeader>
                      <CardTitle className="text-emerald-800">Do's and Don'ts</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h5 className="font-bold text-emerald-700 flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5" />
                          Recommended (Do's)
                        </h5>
                        <ul className="space-y-2">
                          {selectedCrop.guide.dosAndDonts.do.map((item, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                              <ArrowRight className="h-4 w-4 text-emerald-400 mt-0.5" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-4">
                        <h5 className="font-bold text-rose-700 flex items-center gap-2">
                          <XCircle className="h-5 w-5" />
                          Avoid (Don'ts)
                        </h5>
                        <ul className="space-y-2">
                          {selectedCrop.guide.dosAndDonts.dont.map((item, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                              <ArrowRight className="h-4 w-4 text-rose-400 mt-0.5" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
