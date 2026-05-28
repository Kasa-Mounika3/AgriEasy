import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'motion/react';
import { Technology } from '@/types';
import { Zap, Droplets, Cpu, Microscope, Leaf, ShieldCheck } from 'lucide-react';
import SafeImage from '@/components/SafeImage';
import { technologyImages } from '@/lib/imageAssets';

const technologies: Technology[] = [
  {
    id: '1',
    name: 'Drip Irrigation',
    description: 'A type of micro-irrigation system that has the potential to save water and nutrients by allowing water to drip slowly to the roots of plants.',
    benefits: ['Saves up to 60% water', 'Reduces weed growth', 'Direct nutrient delivery'],
    useCases: ['Orchards', 'Vegetables', 'Cash crops like Sugarcane'],
    image: technologyImages['1']
  },
  {
    id: '2',
    name: 'Hydroponics',
    description: 'A method of growing plants without soil, using mineral nutrient solutions in a water solvent.',
    benefits: ['90% less water usage', 'Faster growth rates', 'No soil-borne diseases'],
    useCases: ['Leafy greens', 'Strawberries', 'Urban farming'],
    image: technologyImages['2']
  },
  {
    id: '3',
    name: 'Smart Soil Sensors',
    description: 'IoT devices that monitor soil moisture, temperature, and nutrient levels in real-time.',
    benefits: ['Precision farming', 'Prevents over-irrigation', 'Real-time data alerts'],
    useCases: ['Large scale farms', 'Greenhouses', 'Precision agriculture'],
    image: technologyImages['3']
  },
  {
    id: '4',
    name: 'AI Crop Monitoring',
    description: 'Using drones and AI algorithms to detect pests, diseases, and nutrient deficiencies from aerial imagery.',
    benefits: ['Early disease detection', 'Yield prediction', 'Reduced chemical usage'],
    useCases: ['Pest management', 'Crop health assessment', 'Large farm monitoring'],
    image: technologyImages['4']
  },
  {
    id: '5',
    name: 'Smart Tractors',
    description: 'GPS-enabled tractors and precision implements that improve tillage, seeding accuracy, and field productivity.',
    benefits: ['Precise field operations', 'Lower fuel waste', 'Better yield mapping'],
    useCases: ['Large fields', 'Seed drilling', 'Precision tillage'],
    image: technologyImages['5']
  }
];

export default function Technologies() {
  return (
    <Layout title="Latest Technologies">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-[#2D5A27] mb-3">Modernize Your Farm</h2>
          <p className="text-[#7F8C8D]">Explore the latest innovations in agriculture to increase your yield and reduce costs.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12">
          {technologies.map((tech, idx) => (
            <motion.div
              key={tech.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="border-none shadow-sm hover:shadow-xl transition-all rounded-[32px] overflow-hidden bg-white group">
                <div className="relative h-56 overflow-hidden">
                  <SafeImage 
                    src={tech.image} 
                    alt={tech.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-6 left-6">
                    <CardTitle className="text-2xl text-white mb-1">{tech.name}</CardTitle>
                    <div className="flex gap-2">
                      <Badge className="bg-emerald-500/80 text-white border-none backdrop-blur-sm">Innovation</Badge>
                      <Badge className="bg-blue-500/80 text-white border-none backdrop-blur-sm">Eco-Friendly</Badge>
                    </div>
                  </div>
                </div>
                <CardContent className="p-8 space-y-6">
                  <p className="text-[#7F8C8D] text-sm leading-relaxed">{tech.description}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-bold text-sm text-[#2D5A27] flex items-center gap-2">
                        <Zap className="h-4 w-4" /> Key Benefits
                      </h4>
                      <ul className="space-y-2">
                        {tech.benefits.map(benefit => (
                          <li key={benefit} className="text-xs text-[#2C3E50] flex items-center gap-2">
                            <ShieldCheck className="h-3 w-3 text-emerald-600" /> {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-bold text-sm text-[#2D5A27] flex items-center gap-2">
                        <Leaf className="h-4 w-4" /> Best For
                      </h4>
                      <ul className="space-y-2">
                        {tech.useCases.map(useCase => (
                          <li key={useCase} className="text-xs text-[#2C3E50] flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-emerald-600" /> {useCase}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
