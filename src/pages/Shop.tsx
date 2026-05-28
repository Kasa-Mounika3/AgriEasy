import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  Star, 
  Zap, 
  ChevronRight, 
  ShoppingBag,
  SlidersHorizontal,
  ChevronDown,
  ArrowUpRight,
  Plus
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CATEGORIES, products, Product } from '@/data/products';
import { useCart } from '@/contexts/CartContext';
import { motion, AnimatePresence } from 'motion/react';
import SafeImage from '@/components/SafeImage';
import { moduleImages, shopProductImages } from '@/lib/imageAssets';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Shop() {
  const navigate = useNavigate();
  const { addToCart, cartCount, buyNow } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Recommended');

  const filteredProducts = useMemo(() => {
    let result = products.filter(p => 
      (selectedCategory === 'All' || p.category === selectedCategory) &&
      (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
       p.brand.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    switch (sortBy) {
      case 'Price: Low to High':
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case 'Price: High to Low':
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case 'Customer Rating':
        result = [...result].sort((a, b) => b.rating - a.rating);
        break;
      default:
        break;
    }

    return result;
  }, [selectedCategory, searchQuery, sortBy]);

  return (
    <Layout title="Agri Shop">
      <div className="max-w-7xl mx-auto px-4 pb-20">
        
        {/* Amazon-Style Search Header */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-xl py-4 -mx-4 px-4 border-b border-emerald-50 mb-6 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full flex items-center gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <Input 
                placeholder="Search Seeds, Fertilizers, Tools..." 
                className="pl-12 h-12 rounded-[20px] border-slate-100 bg-slate-50 focus-visible:ring-emerald-500 focus-visible:bg-white transition-all text-sm font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Button 
              variant="ghost" 
              className="relative h-12 w-12 rounded-[20px] bg-slate-50 border border-slate-100 hover:bg-emerald-50 transition-all group"
              onClick={() => navigate('/cart')}
            >
              <ShoppingCart className="h-6 w-6 text-slate-600 group-hover:text-emerald-600" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm scale-110">
                  {cartCount}
                </span>
              )}
            </Button>

            <Button 
              variant="ghost" 
              className="h-12 w-12 rounded-[20px] bg-slate-50 border border-slate-100 hover:bg-emerald-50 lg:hidden"
              onClick={() => navigate('/orders')}
            >
              <ShoppingBag className="h-6 w-6 text-slate-600" />
            </Button>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <Button 
              variant="ghost" 
              className="font-black text-slate-600 hover:text-emerald-600 gap-2"
              onClick={() => navigate('/orders')}
            >
              <ShoppingBag className="h-4 w-4" />
              My Orders
            </Button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="mb-8 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              Explore Categories
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </h3>
            <div className="flex items-center gap-4">
               <DropdownMenu>
                <DropdownMenuTrigger className="group/button inline-flex shrink-0 items-center justify-center rounded-full border border-slate-100 bg-white hover:bg-slate-50 text-slate-500 text-[0.8rem] h-8 px-2.5 font-bold gap-2 transition-all outline-none focus-visible:ring-3">
                  <SlidersHorizontal className="h-3 w-3" />
                  Sort by: {sortBy}
                  <ChevronDown className="h-3 w-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl border-slate-100 p-1">
                  {['Recommended', 'Price: Low to High', 'Price: High to Low', 'Customer Rating'].map((opt) => (
                    <DropdownMenuItem 
                      key={opt} 
                      onClick={() => setSortBy(opt)}
                      className={`rounded-xl text-xs font-bold transition-all px-4 py-2 mb-0.5 last:mb-0 ${
                        sortBy === opt ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500'
                      }`}
                    >
                      {opt}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 mask-fade-right">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-[20px] px-6 h-11 text-xs font-black transition-all flex-shrink-0 border-2 shadow-sm ${
                  selectedCategory === cat 
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-200' 
                    : 'bg-white border-white text-slate-500 hover:border-emerald-100 hover:text-emerald-600'
                }`}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          <AnimatePresence>
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group"
              >
                <Card className="rounded-[32px] overflow-hidden border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(16,185,129,0.1)] transition-all duration-500 relative flex flex-col bg-white h-full group">
                  {/* Top Badges */}
                  <div className="absolute top-4 left-4 z-10 flex gap-2">
                    {product.tags.map(tag => (
                      <span key={tag} className="text-[8px] font-black uppercase tracking-widest bg-emerald-500 text-white px-2 py-1 rounded-full shadow-lg">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Image Container */}
                  <Link to={`/product/${product.id}`} className="relative aspect-[4/5] bg-slate-50 overflow-hidden shrink-0">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      onError={(event) => { event.currentTarget.src = moduleImages.shop; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="absolute bottom-4 left-4 right-4 translate-y-12 group-hover:translate-y-0 transition-transform duration-500">
                      <Button 
                        size="sm" 
                        className="w-full bg-white/95 backdrop-blur-md text-emerald-700 font-black h-10 rounded-2xl gap-2 hover:bg-emerald-50 shadow-xl"
                        onClick={(e) => {
                          e.preventDefault();
                          buyNow(product);
                          navigate('/checkout');
                        }}
                      >
                        <Zap className="h-3.5 w-3.5 fill-emerald-600 text-emerald-600" />
                        Buy Now
                      </Button>
                    </div>
                  </Link>

                  <CardContent className="p-5 flex-grow space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-emerald-600 font-black uppercase tracking-wider">{product.brand}</p>
                      <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded-lg">
                        <Star className="h-2.5 w-2.5 text-amber-500 fill-amber-500" />
                        <span className="text-[10px] font-bold text-amber-600">{product.rating}</span>
                      </div>
                    </div>

                    <Link to={`/product/${product.id}`}>
                      <h4 className="font-black text-slate-800 text-sm leading-tight hover:text-emerald-600 transition-colors line-clamp-2 min-h-[2.5rem]">
                        {product.name}
                      </h4>
                    </Link>

                    <div className="space-y-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-slate-900 leading-none">₹{product.price}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">/ {product.unit}</span>
                      </div>
                      <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                        <ArrowUpRight className="h-3 w-3" />
                        FREE DELIVERY
                      </p>
                    </div>

                    <div className="pt-2">
                       <Button 
                        className="w-full bg-slate-900 group-hover:bg-emerald-600 text-white text-[11px] h-11 rounded-[1.2rem] gap-2 transition-all font-black"
                        onClick={() => addToCart(product)}
                      >
                        <Plus className="h-4 w-4" />
                        Add To Cart
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-32 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Search className="h-10 w-10 text-slate-200" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">No matching products</h2>
            <p className="text-slate-400 max-w-xs mx-auto">We couldn't find anything matching your search. Try adjusting your filters.</p>
          </div>
        )}

        {/* Related/Explore section (Placeholder for Amazon-feel) */}
        <div className="mt-20 space-y-8">
           <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-900">Recommended for You</h3>
              <Button variant="link" className="text-emerald-600 font-bold">View all</Button>
           </div>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { title: 'Drip Irrigation Kits', image: shopProductImages.ir1 },
                { title: 'High Yield Seeds', image: shopProductImages.s2 },
                { title: 'Sprayers & Tools', image: shopProductImages.te3 },
                { title: 'Organic Soil Care', image: shopProductImages.og1 },
              ].map(item => (
                <div key={item.title} className="relative aspect-[16/9] bg-slate-100 rounded-[24px] overflow-hidden transition-all cursor-pointer border-2 border-white shadow-sm group">
                   <SafeImage src={item.image} alt={item.title} className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-105" />
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
                   <div className="relative z-10 flex h-full flex-col justify-end p-5">
                   <div className="w-10 h-10 bg-white/90 rounded-2xl flex items-center justify-center mb-2">
                      <ShoppingBag className="h-5 w-5 text-emerald-500" />
                   </div>
                   <p className="text-white font-black text-sm">{item.title}</p>
                   <p className="text-[10px] text-emerald-100 font-bold uppercase tracking-wider">Recommended</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </Layout>
  );
}
