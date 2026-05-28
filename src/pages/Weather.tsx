import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, CloudSun, CloudRain, Wind, Droplets, Thermometer, MapPin, Sun, Cloud } from 'lucide-react';
import { motion } from 'motion/react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useLocationContext } from '@/contexts/LocationContext';

export default function Weather() {
  const { location } = useLocationContext();
  const [weather, setWeather] = useState({
    temp: 32,
    humidity: 45,
    description: 'Partly Cloudy',
    windSpeed: 12,
    forecast: [
      { day: 'Mon', temp: 32, icon: Sun },
      { day: 'Tue', temp: 30, icon: Cloud },
      { day: 'Wed', temp: 28, icon: CloudRain },
      { day: 'Thu', temp: 31, icon: Sun },
      { day: 'Fri', temp: 33, icon: Sun },
    ]
  });

  return (
    <Layout title="Weather Forecast">
      <div className="space-y-6">
        {/* Current Weather */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-20">
              <Sun className="h-64 w-64" />
            </div>
            <CardContent className="p-8 relative z-10">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 text-blue-100 mb-1">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">
                      {(location.locality && location.locality !== location.state) ? `${location.locality}, ` : ''}
                      {location.city || location.state}
                    </span>
                  </div>
                  <h2 className="text-6xl font-bold">{weather.temp}°C</h2>
                  <p className="text-xl text-blue-100 mt-2">{weather.description}</p>
                </div>
                <Sun className="h-20 w-20 text-yellow-300" />
              </div>

              <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-blue-400/30">
                <div className="flex flex-col items-center">
                  <Droplets className="h-5 w-5 text-blue-200 mb-1" />
                  <span className="text-sm font-medium">{weather.humidity}%</span>
                  <span className="text-[10px] text-blue-200 uppercase">Humidity</span>
                </div>
                <div className="flex flex-col items-center">
                  <Wind className="h-5 w-5 text-blue-200 mb-1" />
                  <span className="text-sm font-medium">{weather.windSpeed} km/h</span>
                  <span className="text-[10px] text-blue-200 uppercase">Wind</span>
                </div>
                <div className="flex flex-col items-center">
                  <Thermometer className="h-5 w-5 text-blue-200 mb-1" />
                  <span className="text-sm font-medium">34° / 28°</span>
                  <span className="text-[10px] text-blue-200 uppercase">H / L</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Forecast */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800 px-1">5-Day Forecast</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {weather.forecast.map((item, idx) => (
              <Card key={idx} className="min-w-[100px] flex-shrink-0 border-none shadow-sm bg-white">
                <CardContent className="p-4 flex flex-col items-center space-y-2">
                  <span className="text-sm font-semibold text-gray-500">{item.day}</span>
                  <item.icon className={`h-8 w-8 ${idx === 2 ? 'text-blue-500' : 'text-amber-500'}`} />
                  <span className="text-lg font-bold text-gray-800">{item.temp}°</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Farming Advice */}
        <Card className="bg-emerald-50 border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-emerald-800 text-sm flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Agri-Advice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-emerald-700 leading-relaxed">
              Expect light showers on Wednesday. It's a good time to check your drainage systems. Avoid spraying pesticides if rain is expected within 24 hours.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
