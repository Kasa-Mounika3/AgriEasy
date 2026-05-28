import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { products, Product } from '@/data/products';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  ShoppingCart, 
  Zap, 
  ChevronLeft, 
  Truck, 
  ShieldCheck, 
  RefreshCw,
  Heart,
  Share2
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import SafeImage from '@/components/SafeImage';
import { moduleImages } from '@/lib/imageAssets';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, buyNow } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const found = products.find(p => p.id === id);
    if (found) {
      setProduct(found);
      setSelectedImage(found.image);
    } else {
      navigate('/shop');
    }
  }, [id, navigate]);

  if (!product) return null;

  const handleBuyNow = () => {
    buyNow(product);
    navigate('/checkout');
  };

  return (
    <Layout title={product.name}>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4 gap-2 text-slate-500 rounded-full"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Shop
        </Button>

        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="aspect-square bg-slate-50 rounded-[24px] overflow-hidden border border-slate-100 flex items-center justify-center p-8 relative">
              <motion.img 
                key={selectedImage}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                src={selectedImage} 
                alt={product.name} 
                className="max-h-full max-w-full object-contain"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={(event) => { event.currentTarget.src = moduleImages.shop; }}
              />
              <button className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-sm text-slate-400 hover:text-rose-500 transition-colors">
                <Heart className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {[product.image, ...product.images].map((img, i) => (
                <button
                  key={i}
                  className={`w-20 h-20 rounded-2xl border-2 shrink-0 overflow-hidden bg-slate-50 transition-all ${
                    selectedImage === img ? 'border-emerald-500 scale-95' : 'border-transparent'
                  }`}
                  onClick={() => setSelectedImage(img)}
                >
                  <SafeImage src={img} alt={`${product.name} thumbnail`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Info Section */}
          <div className="flex flex-col h-full">
            <div className="space-y-4 flex-grow">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-bold text-emerald-600 uppercase tracking-wider">{product.brand}</span>
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-full">
                  {product.category}
                </Badge>
              </div>
              
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
                {product.name}
              </h1>

              <div className="flex items-center gap-4">
                <div className="flex items-center bg-amber-50 px-2 py-1 rounded-lg">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="ml-1 font-bold text-amber-600">{product.rating}</span>
                </div>
                <span className="text-slate-400 text-sm font-medium">{product.reviews} global ratings</span>
              </div>

              <div className="pt-4 border-t border-slate-50">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 leading-none">₹{product.price}</span>
                  <span className="text-slate-400 font-medium">/ {product.unit}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-bold">Inclusive of all taxes</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Product Description</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {product.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                {Object.entries(product.specifications).map(([key, val]) => (
                  <div key={key} className="bg-slate-50 p-3 rounded-2xl border border-slate-100/50">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">{key}</p>
                    <p className="text-sm text-slate-700 font-black">{val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-8 space-y-4">
              <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl w-fit">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-xl bg-white shadow-sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </Button>
                <span className="w-8 text-center font-black text-slate-800">{quantity}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-xl bg-white shadow-sm"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </Button>
              </div>

              <div className="flex gap-3">
                <Button 
                  className="flex-1 h-14 bg-emerald-50 text-emerald-700 border-2 border-emerald-100 hover:bg-emerald-100 rounded-[20px] font-black gap-2 transition-all"
                  onClick={() => addToCart(product, quantity)}
                >
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart
                </Button>
                <Button 
                  className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[20px] font-black gap-2 shadow-lg shadow-emerald-200 transition-all active:scale-95"
                  onClick={handleBuyNow}
                >
                  <Zap className="w-5 h-5 fill-white" />
                  Buy Now
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-4">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center">
                    <Truck className="h-5 w-5 text-slate-400" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 text-center uppercase">Fast Delivery</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-slate-400" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 text-center uppercase">Secure Pay</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center">
                    <RefreshCw className="h-5 w-5 text-slate-400" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 text-center uppercase">Easy Returns</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
