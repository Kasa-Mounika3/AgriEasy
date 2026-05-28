import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Trash2, 
  Minus, 
  Plus, 
  ArrowRight, 
  ShoppingBag,
  ChevronLeft,
  ShieldCheck,
  Gift,
  Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Cart() {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, cartTotal, cartCount } = useCart();

  if (cart.length === 0) {
    return (
      <Layout title="Shopping Cart">
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="w-12 h-12 text-slate-200" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Your cart is empty</h2>
          <p className="text-slate-500 mb-8 max-w-sm">Looks like you haven't added any agricultural supplies to your cart yet.</p>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-12 px-8 font-black gap-2"
            onClick={() => navigate('/shop')}
          >
            Start Shopping
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Shopping Cart">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Your Cart</h1>
            <p className="text-slate-500 font-medium">{cartCount} items ready for checkout</p>
          </div>
          <Button 
            variant="ghost" 
            className="text-emerald-600 font-bold gap-2 rounded-full"
            onClick={() => navigate('/shop')}
          >
            <ChevronLeft className="w-4 h-4" />
            Continue Shopping
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="popLayout">
              {cart.map((item) => (
                <motion.div
                  key={item.product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="bg-white rounded-[28px] p-4 border border-slate-100 flex gap-4 items-center group shadow-sm hover:shadow-md transition-all"
                >
                  <Link to={`/product/${item.product.id}`} className="w-24 h-24 bg-slate-50 rounded-2xl overflow-hidden shrink-0 border border-slate-100">
                    <img 
                      src={item.product.image} 
                      alt={item.product.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <Link to={`/product/${item.product.id}`}>
                          <h3 className="font-black text-slate-800 text-sm md:text-base leading-tight hover:text-emerald-600 transition-colors truncate">
                            {item.product.name}
                          </h3>
                        </Link>
                        <p className="text-[10px] text-emerald-600 font-black uppercase tracking-wider mt-1">{item.product.brand}</p>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-slate-300 hover:text-rose-500 p-2 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-xl border border-slate-100/50">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 rounded-lg bg-white shadow-sm"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center font-black text-xs text-slate-800">{item.quantity}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 rounded-lg bg-white shadow-sm"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400 font-bold">₹{item.product.price} / {item.product.unit}</p>
                        <p className="font-black text-slate-900">₹{item.product.price * item.quantity}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Summary Section */}
          <div className="space-y-6">
            <div className="bg-slate-900 text-white rounded-[32px] p-6 shadow-xl shadow-emerald-900/10 border border-slate-800">
              <h3 className="text-xl font-black mb-6">Order Summary</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-slate-400 text-sm font-medium">
                  <span>Subtotal ({cartCount} items)</span>
                  <span className="text-white">₹{cartTotal}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-sm font-medium">
                  <span>Shipping</span>
                  <span className="text-emerald-400 font-black">FREE</span>
                </div>
                <div className="flex justify-between text-slate-400 text-sm font-medium">
                  <span>GST (Tax)</span>
                  <span className="text-white">Included</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-between items-end mb-8">
                <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Total Amount</span>
                <span className="text-3xl font-black text-emerald-400">₹{cartTotal}</span>
              </div>

              <Button 
                className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-slate-900 rounded-[20px] font-black gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                onClick={() => navigate('/checkout')}
              >
                Proceed to Checkout
                <ArrowRight className="w-5 h-5" />
              </Button>

              <div className="mt-8 pt-6 border-t border-slate-800 space-y-4">
                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  SECURED WITH 256-BIT ENCRYPTION
                </div>
              </div>
            </div>

            {/* Extra Info Cards */}
            <div className="bg-emerald-50 rounded-3xl p-4 border border-emerald-100 flex items-start gap-4">
              <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                <Gift className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-black text-emerald-800 text-sm">Agriculture Rewards</h4>
                <p className="text-[11px] text-emerald-600 font-medium leading-tight">Earn 50 AgriPoints with this order. Redeem for discounts later!</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-3xl p-4 border border-slate-100 flex items-start gap-4">
              <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                <Truck className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <h4 className="font-black text-slate-700 text-sm">Standard Delivery</h4>
                <p className="text-[11px] text-slate-500 font-medium leading-tight">Expected delivery by next 2-3 working days for your region.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
