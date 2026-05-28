import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  Home, 
  LogOut, 
  MapPin, 
  ShoppingBag, 
  Bot, 
  Store, 
  Users,
  User,
  RefreshCw
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useLocationContext } from '@/contexts/LocationContext';
import { useCart } from '@/contexts/CartContext';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export default function Layout({ children, title, showBackButton = true, onBack }: LayoutProps) {
  const navigate = useNavigate();
  const locationPath = useLocation();
  const isDashboard = locationPath.pathname === '/dashboard';
  const { location, refreshLocation, isLoading } = useLocationContext();
  const { cartCount } = useCart();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9F3] flex flex-col font-sans">
      {/* Header */}
      <header className="h-20 px-6 md:px-10 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-[#E0E0E0] sticky top-0 z-50">
        <div className="flex items-center gap-3">
          {showBackButton && !isDashboard && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-[#2D5A27] hover:bg-[#F0F4EF] rounded-full h-10 w-10"
              onClick={handleBack}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/dashboard')}>
            <div className="w-10 h-10 bg-[#2D5A27] rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-200 transition-transform group-hover:scale-110">
              A
            </div>
            <span className="text-2xl font-black text-[#2D5A27] tracking-tighter hidden sm:block">AgriEasy</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div 
            className="hidden lg:flex items-center gap-2 bg-[#F0F4EF] px-5 py-2.5 rounded-full text-xs font-bold text-[#2D5A27] cursor-pointer hover:bg-emerald-100 transition-all border border-emerald-50"
            onClick={() => refreshLocation()}
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>
              {isLoading 
                ? 'Locating...' 
                : `${location.locality || location.city}, ${location.district}`}
            </span>
            {isLoading && <RefreshCw className="h-3 w-3 animate-spin ml-1" />}
          </div>

          <div className="flex items-center bg-slate-50 p-1 rounded-full border border-slate-100">
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 text-[#7F8C8D] hover:bg-white hover:text-[#2D5A27] rounded-full transition-all relative group"
                onClick={() => navigate('/cart')}
              >
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                   <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {cartCount}
                  </span>
                )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 text-[#7F8C8D] hover:bg-white hover:text-[#2D5A27] rounded-full transition-all"
              onClick={() => navigate('/profile')}
            >
              <User className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 text-[#7F8C8D] hover:bg-white hover:text-rose-500 rounded-full transition-all"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 md:px-10 overflow-auto">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="h-[72px] bg-white border-t border-[#E0E0E0] flex justify-center gap-10 md:gap-20 items-center sticky bottom-0 z-50">
        <div 
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${locationPath.pathname === '/dashboard' ? 'text-[#2D5A27]' : 'text-[#7F8C8D]'}`}
          onClick={() => navigate('/dashboard')}
        >
          <Home className="h-6 w-6" />
          <span className="text-[10px] font-medium">Home</span>
          {locationPath.pathname === '/dashboard' && <div className="w-1.5 h-1.5 rounded-full bg-[#2D5A27] mt-0.5" />}
        </div>
        <div 
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${locationPath.pathname === '/shop' ? 'text-[#2D5A27]' : 'text-[#7F8C8D]'}`}
          onClick={() => navigate('/shop')}
        >
          <ShoppingBag className="h-6 w-6" />
          <span className="text-[10px] font-medium">Shop</span>
          {locationPath.pathname === '/shop' && <div className="w-1.5 h-1.5 rounded-full bg-[#2D5A27] mt-0.5" />}
        </div>
        <div 
          className="flex flex-col items-center gap-1 cursor-pointer -mt-8"
          onClick={() => navigate('/ai-assistant')}
        >
          <div className="w-14 h-14 bg-[#2D5A27] rounded-full flex items-center justify-center text-white shadow-lg shadow-[#2D5A27]/30 transition-transform hover:scale-110">
            <Bot className="h-7 w-7" />
          </div>
          <span className="text-[10px] font-medium text-[#2D5A27] mt-1">Assistant</span>
        </div>
        <div 
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${locationPath.pathname === '/direct-market' ? 'text-[#2D5A27]' : 'text-[#7F8C8D]'}`}
          onClick={() => navigate('/direct-market')}
        >
          <Store className="h-6 w-6" />
          <span className="text-[10px] font-medium">Market</span>
          {locationPath.pathname === '/direct-market' && <div className="w-1.5 h-1.5 rounded-full bg-[#2D5A27] mt-0.5" />}
        </div>
        <div 
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${locationPath.pathname === '/community' ? 'text-[#2D5A27]' : 'text-[#7F8C8D]'}`}
          onClick={() => navigate('/community')}
        >
          <Users className="h-6 w-6" />
          <span className="text-[10px] font-medium">Community</span>
          {locationPath.pathname === '/community' && <div className="w-1.5 h-1.5 rounded-full bg-[#2D5A27] mt-0.5" />}
        </div>
      </nav>
    </div>
  );
}
