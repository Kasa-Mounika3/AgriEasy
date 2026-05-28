import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  CreditCard, 
  Truck, 
  MapPin, 
  CheckCircle2, 
  ChevronLeft,
  Lock,
  Wallet,
  Phone,
  User,
  MoreVertical,
  Edit2,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';

import { generateOrderReceipt } from '@/lib/orderUtils';
import { Download } from 'lucide-react';

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, cartTotal, cartCount, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<any>(null);
  
  const [shippingAddress, setShippingAddress] = useState({
    name: auth.currentUser?.displayName || '',
    phone: '',
    pincode: '',
    address: '',
    district: '',
    state: ''
  });

  const handlePlaceOrder = async () => {
    if (!auth.currentUser) {
      toast.error('Please login to place an order');
      return;
    }

    // Validations
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    if (!shippingAddress.name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    if (!shippingAddress.phone.trim() || shippingAddress.phone.length < 10) {
      toast.error('Please enter a valid 10-digit contact number');
      return;
    }

    if (!shippingAddress.address.trim()) {
      toast.error('Please enter detailed address');
      return;
    }

    if (!shippingAddress.district.trim()) {
      toast.error('Please enter district/city');
      return;
    }

    if (!shippingAddress.state.trim()) {
      toast.error('Please enter state');
      return;
    }

    if (!shippingAddress.pincode.trim() || shippingAddress.pincode.length < 6) {
      toast.error('Please enter a valid 6-digit pincode');
      return;
    }

    setIsProcessing(true);
    try {
      const orderId = `AGRI-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const orderData = {
        userId: auth.currentUser.uid,
        items: cart.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          image: item.product.image,
          brand: item.product.brand
        })),
        totalAmount: cartTotal,
        status: 'Ordered',
        shippingAddress,
        paymentMethod: 'cod',
        orderDate: serverTimestamp(),
        orderId: orderId
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      
      const completeOrder = { ...orderData, id: docRef.id };
      setPlacedOrder(completeOrder);
      setOrderSuccess(true);
      
      toast.success('✅ Order placed successfully!');
      clearCart();
    } catch (error) {
      console.error('Order Error:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (orderSuccess && placedOrder) {
    return (
      <Layout title="Order Confirmed">
        <div className="max-w-3xl mx-auto px-4 py-12">
          {/* Main Confirmation Header */}
          <div className="text-center mb-12">
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-100"
            >
              <CheckCircle2 className="h-10 w-10" />
            </motion.div>
            <h1 className="text-4xl font-black text-slate-900 mb-2">Order Confirmed!</h1>
            <p className="text-slate-500 font-medium">Your request for agricultural supplies is now active.</p>
          </div>

          {/* Paper-style Receipt */}
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-[24px] shadow-2xl overflow-hidden relative"
          >
            {/* Scalloped top edge visually represented by a border/shadow */}
            <div className="h-6 w-full bg-[radial-gradient(circle,transparent_8px,#f8fafc_8px)] bg-[length:24px_24px] absolute -top-3 left-0" />
            
            <div className="bg-slate-50/50 p-8 pt-12 border-b border-dashed border-slate-200">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                  <h2 className="text-2xl font-black text-emerald-800">AgriEasy Official Receipt</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Order #{placedOrder.orderId}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-700">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  <p className="text-xs text-slate-400 font-medium">{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-10">
              {/* Delivery & Payment Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-slate-100 pb-8">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Bill To / Deliver To</p>
                    <p className="font-black text-slate-800">{placedOrder.shippingAddress.name}</p>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                      {placedOrder.shippingAddress.address}<br />
                      {placedOrder.shippingAddress.district}, {placedOrder.shippingAddress.state}<br />
                      {placedOrder.shippingAddress.pincode}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm bg-emerald-50 w-fit px-3 py-1.5 rounded-xl border border-emerald-100">
                    <Phone className="h-4 w-4" />
                    {placedOrder.shippingAddress.phone}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Payment Information</p>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center uppercase font-black text-[10px]">COD</div>
                      <p className="font-black text-slate-800">Cash on Delivery</p>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
                      Please keep exactly ₹{placedOrder.totalAmount} ready at the time of package delivery to your farm.
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Purchased Items</p>
                <div className="space-y-4">
                  {placedOrder.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center group">
                      <div className="flex gap-4 items-center">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 line-clamp-1">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{item.brand}</p>
                          <p className="text-[11px] font-medium text-slate-500 mt-0.5">{item.quantity} units @ ₹{item.price}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900 text-sm">₹{item.price * item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="bg-slate-50 rounded-3xl p-6 space-y-3">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Cart Subtotal</span>
                  <span className="font-bold text-slate-800 tracking-tight">₹{placedOrder.totalAmount}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Agricultural Subsidy Applied</span>
                  <span className="font-black text-emerald-600">- FREE DELIVERY</span>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-200 flex justify-between items-center text-lg">
                  <span className="font-black text-slate-800">Final Total</span>
                  <span className="text-2xl font-black text-emerald-700 tracking-tighter">₹{placedOrder.totalAmount}</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="bg-emerald-900 p-8 flex flex-wrap gap-4">
              <Button 
                className="flex-[2] min-w-[200px] h-14 bg-white hover:bg-white text-emerald-900 rounded-2xl font-black text-lg gap-2 shadow-xl shadow-emerald-950/20 active:scale-95 transition-all"
                onClick={() => generateOrderReceipt(placedOrder)}
              >
                <Download className="h-6 w-6" />
                Download Original Receipt
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 min-w-[150px] h-14 rounded-2xl font-black text-white border-white/20 hover:bg-white/10"
                onClick={() => navigate('/orders')}
              >
                Track My Order
              </Button>
            </div>
            
            {/* Scalloped bottom edge */}
            <div className="h-6 w-full bg-[radial-gradient(circle,#101a0f_8px,transparent_8px)] bg-[length:24px_24px] absolute -bottom-3 left-0" />
          </motion.div>
          
          <div className="mt-12 text-center">
            <Button 
              variant="ghost" 
              className="text-slate-400 font-bold hover:text-emerald-600 transition-colors"
              onClick={() => navigate('/shop')}
            >
              ← Return and browse more farm supplies
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (cart.length === 0 && !orderSuccess) {
    return (
      <Layout title="Checkout">
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[50vh]">
          <h2 className="text-xl font-bold text-slate-800">Your cart is empty</h2>
          <Button onClick={() => navigate('/shop')} className="mt-4 bg-emerald-600">Back to Shop</Button>
        </div>
      </Layout>
    );
  }

  const steps = [
    { id: 1, title: 'Shipping', icon: MapPin },
    { id: 2, title: 'Payment', icon: Wallet },
    { id: 3, title: 'Confirm', icon: CheckCircle2 }
  ];

  return (
    <Layout title="Secure Checkout">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Truck className="h-5 w-5" />
                </div>
                Delivery Details
              </h2>
              <p className="text-slate-500 font-medium">Please provide your farm address for faster delivery.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    value={shippingAddress.name}
                    onChange={(e) => setShippingAddress({...shippingAddress, name: e.target.value})}
                    className="pl-10 h-12 rounded-2xl border-slate-100 focus:border-emerald-300 transition-all font-medium" 
                    placeholder="Farmer Name" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    value={shippingAddress.phone}
                    onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})}
                    className="pl-10 h-12 rounded-2xl border-slate-100 focus:border-emerald-300 transition-all font-medium" 
                    placeholder="10-digit mobile" 
                  />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Detailed Address (House No, Village)</Label>
                <Input 
                  value={shippingAddress.address}
                  onChange={(e) => setShippingAddress({...shippingAddress, address: e.target.value})}
                  className="h-12 rounded-2xl border-slate-100 focus:border-emerald-300 transition-all font-medium" 
                  placeholder="e.g. House 42, Hitech Lane" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">District / City</Label>
                <Input 
                  value={shippingAddress.district}
                  onChange={(e) => setShippingAddress({...shippingAddress, district: e.target.value})}
                  className="h-12 rounded-2xl border-slate-100 focus:border-emerald-300 transition-all font-medium" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">State</Label>
                <Input 
                  value={shippingAddress.state}
                  onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                  className="h-12 rounded-2xl border-slate-100 focus:border-emerald-300 transition-all font-medium" 
                  placeholder="e.g. Telangana"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Pincode</Label>
                <Input 
                  value={shippingAddress.pincode}
                  onChange={(e) => setShippingAddress({...shippingAddress, pincode: e.target.value})}
                  className="h-12 rounded-2xl border-slate-100 focus:border-emerald-300 transition-all font-medium" 
                  placeholder="6-digit PIN"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Wallet className="h-4 w-4 text-emerald-600" />
                Payment Method
              </h3>
              <div className="p-4 rounded-3xl border-2 border-emerald-500 bg-emerald-50/30 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-black text-slate-800">Cash on Delivery (COD)</p>
                  <p className="text-[11px] text-slate-500 font-medium">Pay in cash when you receive your items at your farm.</p>
                </div>
              </div>
            </div>

            <Button 
              className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[24px] font-black text-xl shadow-xl shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50 mt-8"
              onClick={handlePlaceOrder}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <div className="flex items-center gap-3">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <Lock className="w-6 h-6" />
                  </motion.div>
                  Placing your order...
                </div>
              ) : (
                `Place Order (₹${cartTotal})`
              )}
            </Button>
          </div>

          {/* Right Sidebar: Order Summary */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-slate-50 rounded-[32px] p-6 border border-slate-100">
              <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center justify-between">
                Order Content
                <span className="text-xs bg-slate-200 px-2 py-1 rounded-full text-slate-600">{cartCount} items</span>
              </h3>
              
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex gap-4 items-center">
                    <div className="w-16 h-16 bg-white rounded-xl border border-slate-200 overflow-hidden shrink-0">
                      <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black text-slate-800 truncate">{item.product.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{item.product.brand}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-bold text-slate-600">Qty: {item.quantity}</span>
                        <span className="text-sm font-black text-emerald-700">₹{item.product.price * item.quantity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200 space-y-3">
                <div className="flex justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <span>Subtotal</span>
                  <span className="text-slate-800">₹{cartTotal}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <span>Shipping Fee</span>
                  <span className="text-emerald-600">FREE</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm font-black text-slate-800 uppercase tracking-widest text-xs">Final Payable</span>
                  <span className="text-2xl font-black text-slate-900 leading-none">₹{cartTotal}</span>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2 p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <p className="text-[10px] font-bold text-emerald-700 uppercase">100% Secure Transaction</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
