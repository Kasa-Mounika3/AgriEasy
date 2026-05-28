import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Bot,
  CalendarDays,
  CloudSun,
  Droplets,
  Home,
  Landmark,
  MessagesSquare,
  Mic,
  Satellite,
  ShoppingCart,
  Store,
  TrendingUp,
  User,
  Users,
  Warehouse,
  Wind,
  Wrench,
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { motion } from 'motion/react';
import SafeImage from '@/components/SafeImage';
import { moduleImages } from '@/lib/imageAssets';

const quickServices = [
  { id: 'home', title: 'Home', icon: Home, path: '/dashboard' },
  { id: 'ai-assistant', title: 'AI Assistant', icon: Bot, path: '/ai-assistant' },
  { id: 'shop', title: 'AgriShop', icon: ShoppingCart, path: '/shop' },
  { id: 'direct-market', title: 'Direct Market', icon: Store, path: '/direct-market' },
  { id: 'slot-booking', title: 'Slot Booking', icon: CalendarDays, path: '/slot-booking' },
  { id: 'cold-storage', title: 'Cold Storage', icon: Warehouse, path: '/cold-storage' },
  { id: 'demand', title: 'Demand', icon: TrendingUp, path: '/smart-demand' },
  { id: 'weather', title: 'Weather', icon: CloudSun, path: '/weather' },
  { id: 'fpo', title: 'FPO', icon: Users, path: '/fpo' },
  { id: 'gov-schemes', title: 'Gov Schemes', icon: Landmark, path: '/gov-schemes' },
  { id: 'technologies', title: 'Latest Tech', icon: Satellite, path: '/technologies' },
  { id: 'expert-advice', title: 'Expert Advice', icon: Wrench, path: '/expert-advice' },
  { id: 'community', title: 'Community', icon: MessagesSquare, path: '/community' },
  { id: 'profile', title: 'Profile', icon: User, path: '/profile' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  return (
    <Layout title="Dashboard" showBackButton={false}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[#2D5A27] mb-1">Namaste, {user?.displayName?.split(' ')[0] || 'Farmer'}!</h2>
          <p className="text-[#7F8C8D]">Here's what's happening on your farm today.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <motion.div
              whileHover={{ y: -5 }}
              className="relative overflow-hidden rounded-[24px] p-6 text-white shadow-lg shadow-[#2D5A27]/20 cursor-pointer min-h-[260px]"
              onClick={() => navigate('/weather')}
            >
              <SafeImage src={moduleImages.weather} alt="Healthy crop field under clear weather" className="absolute inset-0 h-full w-full" />
              <div className="absolute inset-0 bg-gradient-to-br from-[#2D5A27]/85 via-[#2D5A27]/70 to-black/30" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-5xl font-light">28 C</div>
                    <div className="text-lg opacity-90">Partly Cloudy</div>
                  </div>
                  <CloudSun className="h-12 w-12 text-yellow-300" />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20 text-sm">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 opacity-70" />
                    <span>65% Humid</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wind className="h-4 w-4 opacity-70" />
                    <span>12 km/h</span>
                  </div>
                </div>
                <div className="mt-4 bg-black/20 p-3 rounded-xl text-xs leading-relaxed backdrop-blur">
                  Recommendation: Good time for urea application before evening.
                </div>
              </div>
            </motion.div>

            <div className="bg-white rounded-[24px] p-6 border border-[#EAECE6] flex flex-col h-[320px] overflow-hidden relative">
              <div className="absolute right-0 top-0 h-28 w-36 opacity-20">
                <SafeImage src={moduleImages.aiAssistant} alt="AI crop assistance" className="h-full w-full" />
              </div>
              <div className="relative flex items-center gap-2 font-bold text-[#2D5A27] mb-4">
                <Bot className="h-5 w-5" />
                AI Farming Assistant
              </div>
              <div className="relative flex-1 space-y-3 overflow-hidden">
                <div className="bg-[#F8F9F3] p-3 rounded-2xl rounded-bl-none border border-[#EAECE6] text-sm text-[#2C3E50]">
                  Namaste! How can I help you today? I see your soil moisture in Block A is slightly low.
                </div>
                <div className="bg-[#EAF2E8] p-3 rounded-2xl rounded-br-none border border-[#D5E2D2] text-sm text-[#2C3E50] self-end ml-8">
                  Suggest best pesticide for onion rot.
                </div>
              </div>
              <div
                className="relative mt-4 bg-[#F0F2F0] p-3 rounded-xl flex justify-between items-center text-sm text-[#7F8C8D] cursor-pointer"
                onClick={() => navigate('/ai-assistant')}
              >
                <span>Ask anything...</span>
                <Mic className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#5D4037]">Quick Services</h3>
              <Button variant="link" className="text-[#2D5A27]">View All</Button>
            </div>

            <div className="grid grid-cols-2 min-[420px]:grid-cols-3 sm:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5">
              {quickServices.map((service, idx) => {
                const Icon = service.icon;

                return (
                  <motion.button
                    key={service.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.96 }}
                    className="group flex min-h-[108px] flex-col items-center justify-center gap-3 rounded-[18px] border border-emerald-100 bg-white p-3 text-center shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600/25"
                    onClick={() => navigate(service.path)}
                    type="button"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F0F4EF] text-[#2D5A27] transition-all group-hover:bg-[#2D5A27] group-hover:text-white group-hover:shadow-lg group-hover:shadow-emerald-200">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="text-[11px] font-black leading-tight text-[#2C3E50] sm:text-sm">{service.title}</span>
                  </motion.button>
                );
              })}

              <div className="col-span-full bg-[#FEF9E7] border border-dashed border-[#E67E22] rounded-[20px] p-5 flex items-center justify-between mt-2">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#E67E22] shadow-sm">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[#2C3E50]">Market Insight: High Demand Expected</div>
                    <div className="text-xs text-[#7F8C8D]">Red onion prices expected to rise by 15% next week.</div>
                  </div>
                </div>
                <Badge className="bg-[#E67E22] hover:bg-[#D35400] text-white px-3 py-1 rounded-full text-[10px] font-bold">
                  Sell Now
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
