import React from 'react';
import { Sprout, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface AuthShellProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  showBack?: boolean;
}

export default function AuthShell({ children, title, subtitle, showBack = false }: AuthShellProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8F9F3] text-[#2C3E50]">
      <div className="grid min-h-screen lg:grid-cols-[0.92fr_1.08fr]">
        <section className="relative hidden overflow-hidden bg-[#1F4D2F] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(127,176,105,0.26),rgba(31,77,47,0)_48%),url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&q=80&w=1400')] bg-cover bg-center opacity-95" />
          <div className="absolute inset-0 bg-[#12351F]/45" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-[#2D5A27] shadow-lg">
              <Sprout className="h-6 w-6" />
            </div>
            <span className="text-2xl font-black tracking-tight">AgriEasy</span>
          </div>
          <div className="relative z-10 max-w-xl space-y-5">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-100">Smart agriculture platform</p>
            <h1 className="text-5xl font-black leading-tight tracking-normal">One secure account for crops, weather, market access, and bookings.</h1>
            <p className="max-w-lg text-base leading-7 text-emerald-50">
              Built for Indian farmers with local district data, profile persistence, and fast access to the AgriEasy dashboard.
            </p>
          </div>
          <div className="relative z-10 grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg bg-white/12 p-4 backdrop-blur">
              <strong className="block text-lg">36</strong>
              States and UTs
            </div>
            <div className="rounded-lg bg-white/12 p-4 backdrop-blur">
              <strong className="block text-lg">700+</strong>
              District choices
            </div>
            <div className="rounded-lg bg-white/12 p-4 backdrop-blur">
              <strong className="block text-lg">24/7</strong>
              Session access
            </div>
          </div>
        </section>

        <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
          <div className="w-full max-w-[520px]">
            <div className="mb-6 flex items-center justify-between">
              <button className="flex items-center gap-3" onClick={() => navigate('/dashboard')} type="button">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2D5A27] text-white shadow-md shadow-emerald-100">
                  <Sprout className="h-5 w-5" />
                </div>
                <span className="text-2xl font-black tracking-tight text-[#2D5A27]">AgriEasy</span>
              </button>
              {showBack && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#2D5A27]"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
            </div>

            <div className="rounded-lg border border-emerald-100 bg-white p-5 shadow-xl shadow-emerald-950/5 sm:p-7">
              <div className="mb-6 space-y-2">
                <h2 className="text-3xl font-black tracking-normal text-[#1F3B2D]">{title}</h2>
                <p className="text-sm leading-6 text-[#64748b]">{subtitle}</p>
              </div>
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
