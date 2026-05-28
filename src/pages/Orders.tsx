import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  MapPin, 
  Clock, 
  ChevronRight, 
  Box, 
  CheckCircle2, 
  Truck, 
  AlertCircle,
  ShoppingBag,
  Download,
  Info,
  Calendar
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { generateOrderReceipt } from '@/lib/orderUtils';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  brand: string;
}

interface Order {
  id: string;
  orderId: string;
  totalAmount: number;
  status: string;
  orderDate: any;
  items: OrderItem[];
  shippingAddress: any;
  paymentMethod: string;
}

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!auth.currentUser) return;
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', auth.currentUser.uid),
          orderBy('orderDate', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Order[];
        setOrders(data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ordered': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'packed': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'shipped': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'delivered': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ordered': return <Box className="h-4 w-4" />;
      case 'packed': return <Package className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle2 className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Layout title="My Orders">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
              <Package className="h-10 w-10 text-emerald-200" />
            </motion.div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Tracking Shipments...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="My Orders">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Your Orders</h1>
            <p className="text-slate-500 font-medium tracking-tight">Manage your agricultural supply history</p>
          </div>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-12 px-6 font-black gap-2 transition-all shadow-lg shadow-emerald-100"
            onClick={() => navigate('/shop')}
          >
            <ShoppingBag className="h-4 w-4" />
            Shop More
          </Button>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-[32px] p-12 text-center border border-slate-100 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="h-10 w-10 text-slate-200" />
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-2">No orders found</h2>
            <p className="text-slate-400 mb-8 max-w-xs mx-auto text-sm">Start your farm shopping journey and track your items here.</p>
            <Button onClick={() => navigate('/shop')} className="bg-emerald-600 rounded-xl">Visit AgriShop</Button>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {orders.map((order, idx) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all group"
                >
                  {/* Order Header */}
                  <div className="bg-slate-50/50 p-4 px-6 border-bottom border-slate-100 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Order Date</p>
                        <p className="text-sm font-black text-slate-700 flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {order.orderDate?.toDate ? new Date(order.orderDate.toDate()).toLocaleDateString() : 'Processing'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Order ID</p>
                        <p className="text-sm font-black text-slate-700">#{order.orderId}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total</p>
                        <p className="text-sm font-black text-emerald-700">₹{order.totalAmount}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`rounded-xl px-3 py-1 font-black text-[10px] uppercase gap-1.5 border-2 ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </Badge>
                      <button 
                        className="p-2 hover:bg-white rounded-full text-slate-400 transition-colors"
                        onClick={() => generateOrderReceipt(order)}
                        title="Download Receipt"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Order Content */}
                  <div className="p-6">
                    <div className="space-y-4">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex gap-4 items-center">
                          <div className="w-16 h-16 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 shrink-0">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-black text-slate-800 line-clamp-1">{item.name}</h4>
                            <p className="text-[10px] text-emerald-600 font-bold uppercase">{item.brand}</p>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-[11px] font-bold text-slate-400">Qty: {item.quantity}</span>
                              <span className="text-[11px] font-black text-slate-800">₹{item.price}</span>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="hidden md:flex rounded-xl font-bold text-xs gap-1 text-slate-500">
                             Buy Again
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-50 flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0">
                          <MapPin className="h-5 w-5 text-slate-300" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Shipping to</p>
                          <p className="text-xs font-black text-slate-700">{order.shippingAddress.name}</p>
                          <p className="text-[11px] text-slate-400 leading-tight">
                            {order.shippingAddress.address}, {order.shippingAddress.district}, {order.shippingAddress.pincode}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1 md:flex-none rounded-2xl font-black text-xs h-10 border-slate-100 text-slate-500 hover:bg-slate-50"
                          onClick={() => generateOrderReceipt(order)}
                        >
                          View Receipt
                        </Button>
                        <Button className="flex-1 md:flex-none rounded-2xl font-black text-xs h-10 bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                          Track Package
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Layout>
  );
}
