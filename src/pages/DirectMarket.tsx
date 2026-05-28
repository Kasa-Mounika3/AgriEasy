import React, { useState, useEffect, useMemo, useRef } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { 
  ShoppingBag, 
  Store, 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  Star, 
  ShoppingCart, 
  Trash2, 
  ChevronRight,
  Truck,
  CheckCircle2,
  Package,
  ArrowLeft,
  Calendar,
  Tag,
  Leaf,
  Navigation,
  Edit2,
  X,
  Camera,
  Image as ImageIcon,
  Download,
  Printer,
  RotateCcw,
  AlertCircle,
  CreditCard,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, doc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { MarketProduct, ProductCategory, CartItem, MarketOrder, OrderStatus } from '@/types';
import { handleFirestoreError, OperationType } from '@/lib/firebaseUtils';
import { useLocationContext } from '@/contexts/LocationContext';
import { mockMarketProducts } from '@/lib/indiaData';
import SafeImage from '@/components/SafeImage';
import { imageForMarketProduct, marketCategoryImages } from '@/lib/imageAssets';

const CATEGORIES: ProductCategory[] = [
  'Milk & Dairy', 
  'Cereals', 
  'Millets', 
  'Pulses', 
  'Fruits', 
  'Vegetables', 
  'Organic Products'
];

const CATEGORY_UNITS: Record<ProductCategory, string[]> = {
  'Milk & Dairy': ['litre', 'kg', 'piece'],
  'Cereals': ['kg'],
  'Millets': ['kg'],
  'Pulses': ['kg'],
  'Fruits': ['kg', 'dozen', 'piece'],
  'Vegetables': ['kg', 'bunch', 'piece'],
  'Organic Products': ['kg', 'litre', 'piece']
};

export default function DirectMarket() {
  const [view, setView] = useState<'browse' | 'cart' | 'checkout' | 'confirmation' | 'orders' | 'order-details' | 'sell'>('browse');
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'All'>('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<MarketOrder[]>([]);
  const [myProducts, setMyProducts] = useState<MarketProduct[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<MarketOrder | null>(null);
  const [lastOrder, setLastOrder] = useState<MarketOrder | null>(null);
  const { location: globalLocation } = useLocationContext();
  
  const user = auth.currentUser;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'market_products'), (snapshot) => {
      if (snapshot.empty) {
        setProducts(mockMarketProducts as MarketProduct[]);
        setLoading(false);
        return;
      }
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketProduct));
      setProducts(prods);
      setLoading(false);
    });

    if (user) {
      const qMyProds = query(collection(db, 'market_products'), where('farmerId', '==', user.uid));
      const unsubMy = onSnapshot(qMyProds, (snapshot) => {
        setMyProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketProduct)));
      });
      
      const qOrders = query(collection(db, 'market_orders'), where('customerId', '==', user.uid), orderBy('createdAt', 'desc'));
      const unsubOrders = onSnapshot(qOrders, (snapshot) => {
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketOrder)));
      });

      return () => {
        unsub();
        unsubMy();
        unsubOrders();
      };
    }

    return () => unsub();
  }, [user]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.farmerName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const addToCart = (product: MarketProduct) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item);
      }
      return [...prev, { ...product, cartQuantity: 1 }];
    });
    toast.success(`Added ${product.name} to cart`);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.cartQuantity + delta);
        return { ...item, cartQuantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);
  const deliveryCharges = cartTotal > 500 ? 0 : 40;
  const finalAmount = cartTotal + deliveryCharges;

  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    
    const formData = new FormData(e.currentTarget);
    const address = formData.get('address') as string;
    const phone = formData.get('phone') as string;

    const order: Omit<MarketOrder, 'id'> = {
      customerId: user.uid,
      customerName: user.displayName || 'Customer',
      items: cart,
      totalAmount: cartTotal,
      deliveryCharges,
      finalAmount,
      deliveryAddress: address,
      contactNumber: phone,
      status: 'Ordered',
      trackingSteps: [
        { status: 'Ordered', timestamp: Date.now(), completed: true },
        { status: 'Shipped', timestamp: 0, completed: false },
        { status: 'Out for delivery', timestamp: 0, completed: false },
        { status: 'Delivered', timestamp: 0, completed: false }
      ],
      estimatedDelivery: '2-3 Days',
      createdAt: Date.now()
    };

    try {
      const docRef = await addDoc(collection(db, 'market_orders'), order);
      const newOrder = { id: docRef.id, ...order } as MarketOrder;
      setLastOrder(newOrder);
      setCart([]);
      setView('confirmation');
      toast.success('Order placed successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'market_orders');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    const formData = new FormData(e.currentTarget);
    const product: Omit<MarketProduct, 'id'> = {
      farmerId: user.uid,
      farmerName: user.displayName || 'Farmer',
      name: formData.get('name') as string,
      category: formData.get('category') as ProductCategory,
      price: Number(formData.get('price')),
      unit: formData.get('unit') as string,
      quantity: Number(formData.get('quantity')),
      image: previewImage || imageForMarketProduct(formData.get('name') as string, formData.get('category') as string),
      location: {
        state: globalLocation.state,
        district: globalLocation.district
      },
      isOrganic: formData.get('isOrganic') === 'on',
      harvestDate: formData.get('harvestDate') ? new Date(formData.get('harvestDate') as string).getTime() : Date.now(),
      rating: 5.0,
      reviewsCount: 0,
      createdAt: Date.now()
    };

    try {
      await addDoc(collection(db, 'market_products'), product);
      setPreviewImage(null);
      setView('sell');
      toast.success('Product listed successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'market_products');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      await updateDoc(doc(db, 'market_orders', orderId), { status: 'Cancelled' as any });
      toast.success('Order cancelled');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `market_orders/${orderId}`);
    }
  };

  const printInvoice = (order: MarketOrder) => {
    const printContent = `
      <html>
        <head>
          <title>Invoice - AgriEasy</title>
          <style>
            body { font-family: sans-serif; padding: 40px; line-height: 1.6; color: #333; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2D5A27; padding-bottom: 20px; }
            .title { color: #2D5A27; font-size: 28px; font-weight: 800; }
            .details { margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
            table { width: 100%; border-collapse: collapse; margin-top: 40px; }
            th { text-align: left; border-bottom: 2px solid #eee; padding: 12px; background: #f9f9f9; }
            td { padding: 12px; border-bottom: 1px solid #eee; }
            .total-section { margin-top: 40px; text-align: right; border-top: 2px solid #2D5A27; padding-top: 20px; }
            .footer { margin-top: 60px; font-size: 12px; color: #777; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
            .badge { background: #F0F4EF; color: #2D5A27; padding: 4px 12px; rounded: 20px; font-size: 12px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">AgriEasy</div>
              <div style="color: #666">Direct Farm-to-Home Market</div>
            </div>
            <div style="text-align: right">
              <div style="font-weight: bold">INVOICE</div>
              <div>#${order.id.toUpperCase()}</div>
              <div>Date: ${new Date(order.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
          <div class="details">
            <div>
              <strong style="color: #2D5A27">DELIVER TO:</strong><br/>
              <span style="font-size: 18px; font-weight: bold">${order.customerName}</span><br/>
              ${order.deliveryAddress}<br/>
              Phone: ${order.contactNumber}
            </div>
            <div style="text-align: right">
              <strong style="color: #2D5A27">ORDER STATUS:</strong><br/>
              <span class="badge">${order.status.toUpperCase()}</span><br/><br/>
              <strong>ESTIMATED DELIVERY:</strong><br/>
              ${order.estimatedDelivery}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Product Description</th>
                <th>Farmer</th>
                <th>Unit Price</th>
                <th>Qty</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>
                    <strong>${item.name}</strong><br/>
                    <span style="font-size: 10px; color: #777">${item.category}</span>
                  </td>
                  <td>${item.farmerName}</td>
                  <td>₹${item.price}/${item.unit}</td>
                  <td>${item.cartQuantity}</td>
                  <td>₹${item.price * item.cartQuantity}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total-section">
            <div style="display: flex; justify-content: flex-end; gap: 50px; margin-bottom: 10px">
              <span>Subtotal:</span>
              <span style="width: 100px">₹${order.totalAmount}</span>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 50px; margin-bottom: 10px">
              <span>Delivery Charges:</span>
              <span style="width: 100px">₹${order.deliveryCharges}</span>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 50px; font-size: 24px; font-weight: 900; color: #2D5A27">
              <span>Grand Total:</span>
              <span style="width: 100px">₹${order.finalAmount}</span>
            </div>
          </div>
          <div class="footer">
            Thank you for choosing AgriEasy! By buying directly from farms, you are helping Indian agriculture thrive.<br/>
            For support, contact support@agrieasy.in
          </div>
        </body>
      </html>
    `;
    const win = window.open('', '_blank');
    win?.document.write(printContent);
    win?.document.close();
    win?.print();
  };

  return (
    <Layout title="Direct Market">
      <div className="max-w-7xl mx-auto space-y-6 pb-20 px-4">
        {/* Amazon-style Top Header */}
        <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-[24px] shadow-md border border-[#EAECE6]">
          <div className="flex items-center gap-4 w-full md:w-auto">
            {view !== 'browse' && (
              <Button variant="ghost" size="icon" onClick={() => setView('browse')} className="rounded-full hover:bg-emerald-50">
                <ArrowLeft className="h-5 w-5 text-[#2D5A27]" />
              </Button>
            )}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('browse')}>
              <div className="bg-[#2D5A27] p-2 rounded-xl">
                <ShoppingBag className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-black text-[#2D5A27] tracking-tight">AgriMarket</h2>
            </div>
          </div>

          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#7F8C8D]" />
            <Input 
              placeholder="Search fresh farm products..." 
              className="pl-12 h-12 rounded-xl border-gray-200 bg-[#F8F9F3] focus:ring-2 focus:ring-emerald-500 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <Button 
              variant="ghost" 
              className={`rounded-xl flex-1 md:flex-none ${view === 'orders' ? 'bg-emerald-50 text-[#2D5A27]' : 'text-[#7F8C8D]'}`}
              onClick={() => setView('orders')}
            >
              <Package className="h-5 w-5 mr-2" /> Orders
            </Button>
            <Button 
              variant="ghost" 
              className={`rounded-xl flex-1 md:flex-none ${view === 'sell' ? 'bg-emerald-50 text-[#2D5A27]' : 'text-[#7F8C8D]'}`}
              onClick={() => setView('sell')}
            >
              <Store className="h-5 w-5 mr-2" /> Sell
            </Button>
            <Button 
              className="bg-[#2D5A27] hover:bg-[#1E3D1A] text-white rounded-xl relative flex-1 md:flex-none h-12 px-6 shadow-lg shadow-emerald-100"
              onClick={() => setView('cart')}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              <span className="hidden md:inline">Cart</span>
              {cart.length > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-rose-500 text-white border-2 border-white animate-bounce">
                  {cart.length}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {view === 'browse' && (
            <motion.div 
              key="browse"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Category Scroll */}
              <div className="bg-white p-4 rounded-[24px] shadow-sm">
                <ScrollArea className="w-full whitespace-nowrap">
                  <div className="flex gap-3">
                    <Button 
                      variant={selectedCategory === 'All' ? 'default' : 'outline'}
                      className={`rounded-xl h-10 px-6 ${selectedCategory === 'All' ? 'bg-[#2D5A27]' : 'border-emerald-100 text-emerald-700'}`}
                      onClick={() => setSelectedCategory('All')}
                    >
                      All Deals
                    </Button>
                    {CATEGORIES.map(cat => (
                      <Button 
                        key={cat}
                        variant={selectedCategory === cat ? 'default' : 'outline'}
                        className={`rounded-xl h-10 px-6 ${selectedCategory === cat ? 'bg-[#2D5A27]' : 'border-emerald-100 text-emerald-700'}`}
                        onClick={() => setSelectedCategory(cat)}
                      >
                        <span className="mr-2 h-6 w-6 overflow-hidden rounded-lg bg-white/30">
                          <SafeImage src={marketCategoryImages[cat]} alt={cat} className="h-full w-full" />
                        </span>
                        {cat}
                      </Button>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product, idx) => (
                  <Card key={product.id} className="border-none shadow-sm hover:shadow-xl transition-all rounded-[24px] overflow-hidden bg-white group flex flex-col">
                    <div className="relative h-56 overflow-hidden">
                      <SafeImage 
                        src={imageForMarketProduct(product.name, product.category, product.image)} 
                        alt={product.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {product.isOrganic && (
                          <Badge className="bg-emerald-600 text-white border-none shadow-md">Organic</Badge>
                        )}
                        <Badge className="bg-amber-500 text-white border-none shadow-md">Fresh Today</Badge>
                      </div>
                      <div className="absolute bottom-3 right-3">
                        <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-[#2D5A27] flex items-center gap-1 shadow-sm">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {product.rating}
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-5 flex-1 space-y-3">
                      <div>
                        <h4 className="font-bold text-lg text-[#2C3E50] leading-tight group-hover:text-[#2D5A27] transition-colors">{product.name}</h4>
                        <p className="text-xs text-[#7F8C8D] mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-emerald-600" /> {product.location.district}, {product.location.state}
                        </p>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-[#2D5A27]">₹{product.price}</span>
                        <span className="text-xs text-[#7F8C8D] font-bold uppercase">/ {product.unit}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#7F8C8D] font-medium bg-[#F8F9F3] p-2 rounded-lg">
                        <div className="flex items-center gap-1">
                          <Truck className="h-3 w-3 text-emerald-600" />
                          <span>2-4 hours</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-emerald-600" />
                          <span>Harvested: {new Date(product.harvestDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <Button 
                        className="w-full bg-[#F0F4EF] hover:bg-[#2D5A27] text-[#2D5A27] hover:text-white rounded-xl h-11 font-bold transition-all shadow-sm"
                        onClick={() => addToCart(product)}
                      >
                        Add to Basket
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              {filteredProducts.length === 0 && !loading && (
                <div className="text-center py-24 bg-white rounded-[40px] shadow-sm border-2 border-dashed border-gray-100">
                  <div className="text-7xl mb-6">🚜</div>
                  <h3 className="text-2xl font-bold text-[#2C3E50]">No produce found</h3>
                  <p className="text-[#7F8C8D] max-w-xs mx-auto">Try searching for something else or explore other categories.</p>
                  <Button variant="link" className="mt-4 text-[#2D5A27]" onClick={() => setSelectedCategory('All')}>Clear all filters</Button>
                </div>
              )}
            </motion.div>
          )}

          {view === 'cart' && (
            <motion.div 
              key="cart"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-5xl mx-auto"
            >
              <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" onClick={() => setView('browse')} className="rounded-full">
                  <ArrowLeft className="h-6 w-6" />
                </Button>
                <h3 className="text-3xl font-black text-[#2C3E50]">Your Shopping Basket</h3>
              </div>

              {cart.length === 0 ? (
                <Card className="p-16 text-center rounded-[40px] border-none shadow-lg bg-white">
                  <div className="text-8xl mb-6">🧺</div>
                  <h4 className="text-2xl font-bold text-[#2C3E50]">Your basket is empty</h4>
                  <p className="text-[#7F8C8D] mb-8 max-w-sm mx-auto">Fresh farm produce is just a few clicks away. Start exploring our direct market!</p>
                  <Button onClick={() => setView('browse')} className="bg-[#2D5A27] text-white rounded-2xl h-14 px-12 font-bold text-lg shadow-xl shadow-emerald-100">Browse Market</Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-4">
                    {cart.map(item => (
                      <Card key={item.id} className="p-5 rounded-[24px] border-none shadow-sm flex gap-6 bg-white group">
                        <div className="relative w-28 h-28 shrink-0">
                          <SafeImage src={imageForMarketProduct(item.name, item.category, item.image)} alt={item.name} className="w-full h-full rounded-2xl object-cover" />
                          {item.isOrganic && (
                            <div className="absolute -top-2 -left-2 bg-emerald-600 text-white text-[8px] font-bold px-2 py-1 rounded-full shadow-sm">ORGANIC</div>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-lg text-[#2C3E50]">{item.name}</h4>
                              <p className="text-xs text-[#7F8C8D] flex items-center gap-1">
                                <Store className="h-3 w-3" /> {item.farmerName}
                              </p>
                            </div>
                            <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-rose-500 transition-colors">
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between pt-2">
                            <div className="flex flex-col">
                              <span className="text-xl font-black text-[#2D5A27]">₹{item.price * item.cartQuantity}</span>
                              <span className="text-[10px] text-[#7F8C8D]">₹{item.price}/{item.unit}</span>
                            </div>
                            <div className="flex items-center gap-4 bg-[#F8F9F3] rounded-xl px-4 py-2 border border-emerald-50">
                              <button onClick={() => updateCartQuantity(item.id, -1)} className="text-[#2D5A27] font-black text-xl hover:scale-125 transition-transform">-</button>
                              <span className="font-black text-lg w-6 text-center">{item.cartQuantity}</span>
                              <button onClick={() => updateCartQuantity(item.id, 1)} className="text-[#2D5A27] font-black text-xl hover:scale-125 transition-transform">+</button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                  <div className="space-y-6">
                    <Card className="p-8 rounded-[32px] border-none shadow-xl bg-white sticky top-24">
                      <h4 className="font-bold text-xl mb-6 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-emerald-600" /> Order Summary
                      </h4>
                      <div className="space-y-4 text-sm">
                        <div className="flex justify-between text-[#7F8C8D]">
                          <span>Items Subtotal</span>
                          <span className="font-bold text-[#2C3E50]">₹{cartTotal}</span>
                        </div>
                        <div className="flex justify-between text-[#7F8C8D]">
                          <span>Delivery Fee</span>
                          <span className={deliveryCharges === 0 ? 'text-emerald-600 font-bold' : 'font-bold text-[#2C3E50]'}>
                            {deliveryCharges === 0 ? 'FREE' : `₹${deliveryCharges}`}
                          </span>
                        </div>
                        {deliveryCharges > 0 && (
                          <div className="bg-emerald-50 p-3 rounded-xl text-[10px] text-emerald-700 font-medium flex items-center gap-2">
                            <AlertCircle className="h-3 w-3" />
                            Add ₹{500 - cartTotal} more for FREE delivery!
                          </div>
                        )}
                        <div className="pt-4 border-t border-gray-100 flex justify-between text-2xl font-black text-[#2C3E50]">
                          <span>Total</span>
                          <span className="text-[#2D5A27]">₹{finalAmount}</span>
                        </div>
                      </div>
                      <Button 
                        className="w-full mt-8 bg-[#2D5A27] hover:bg-[#1E3D1A] text-white rounded-2xl h-14 font-bold text-lg shadow-lg shadow-emerald-100"
                        onClick={() => setView('checkout')}
                      >
                        Checkout Now
                      </Button>
                      <p className="text-[10px] text-center text-[#7F8C8D] mt-4">Safe & Secure Payments • Cash on Delivery Available</p>
                    </Card>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {view === 'checkout' && (
            <motion.div 
              key="checkout"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto"
            >
              <Card className="p-10 rounded-[40px] border-none shadow-2xl bg-white">
                <div className="flex items-center gap-4 mb-8">
                  <div className="bg-emerald-100 p-3 rounded-2xl">
                    <Truck className="h-6 w-6 text-emerald-700" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[#2C3E50]">Delivery Address</h3>
                    <p className="text-[#7F8C8D] text-sm">Where should we send your fresh produce?</p>
                  </div>
                </div>
                <form onSubmit={handleCheckout} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="font-bold text-[#2C3E50]">Full Name</Label>
                    <Input defaultValue={user?.displayName || ''} required className="rounded-xl h-12 border-gray-200 focus:border-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-[#2C3E50]">Complete Address</Label>
                    <Input name="address" placeholder="House No, Street, Landmark, City" required className="rounded-xl h-12 border-gray-200 focus:border-emerald-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold text-[#2C3E50]">Contact Number</Label>
                      <Input name="phone" placeholder="+91 00000 00000" required className="rounded-xl h-12 border-gray-200 focus:border-emerald-500" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-[#2C3E50]">Pin Code</Label>
                      <Input placeholder="000000" required className="rounded-xl h-12 border-gray-200 focus:border-emerald-500" />
                    </div>
                  </div>
                  <div className="bg-[#F8F9F3] p-6 rounded-3xl space-y-4 border border-emerald-50">
                    <h4 className="font-bold text-xs text-[#7F8C8D] uppercase tracking-widest">Payment Method</h4>
                    <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border-2 border-emerald-500 shadow-sm">
                      <div className="bg-emerald-500 p-2 rounded-xl">
                        <CreditCard className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-black text-[#2C3E50]">Cash on Delivery</div>
                        <div className="text-[10px] text-[#7F8C8D]">Pay ₹{finalAmount} at your doorstep</div>
                      </div>
                      <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    </div>
                  </div>
                  <div className="flex gap-4 pt-6">
                    <Button type="button" variant="outline" className="flex-1 rounded-2xl h-14 font-bold border-gray-200" onClick={() => setView('cart')}>Back</Button>
                    <Button type="submit" className="flex-1 bg-[#2D5A27] hover:bg-[#1E3D1A] text-white rounded-2xl h-14 font-bold text-lg shadow-xl shadow-emerald-100">Confirm Order</Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}

          {view === 'confirmation' && lastOrder && (
            <motion.div 
              key="confirmation"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto text-center space-y-8"
            >
              <div className="bg-white p-12 rounded-[48px] shadow-2xl space-y-8 border border-emerald-50">
                <div className="relative">
                  <div className="w-32 h-32 bg-emerald-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <CheckCircle2 className="h-16 w-16 text-emerald-600" />
                  </div>
                  <div className="absolute top-0 right-1/4 bg-amber-400 text-white p-2 rounded-full shadow-lg">
                    <Star className="h-4 w-4 fill-white" />
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-4xl font-black text-[#2C3E50] tracking-tight">Order Confirmed!</h3>
                  <p className="text-[#7F8C8D] text-lg">✅ Your order has been placed successfully!</p>
                </div>
                <div className="bg-[#F8F9F3] p-8 rounded-[32px] text-left space-y-6 border border-emerald-50">
                  <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                    <span className="text-xs font-bold text-[#7F8C8D] uppercase tracking-widest">Order Reference</span>
                    <span className="font-mono font-black text-[#2D5A27] text-lg">{lastOrder.id.toUpperCase()}</span>
                  </div>
                  <div className="space-y-3">
                    {lastOrder.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <SafeImage src={imageForMarketProduct(item.name, item.category, item.image)} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                          <span className="text-sm font-bold text-[#2C3E50]">{item.name} <span className="text-[#7F8C8D] font-normal">x {item.cartQuantity}</span></span>
                        </div>
                        <span className="font-black text-[#2D5A27]">₹{item.price * item.cartQuantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-6 border-t border-gray-200 flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#7F8C8D] uppercase">Total Amount Paid</span>
                      <span className="text-3xl font-black text-[#2D5A27]">₹{lastOrder.finalAmount}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-[#7F8C8D] uppercase">Est. Delivery</span>
                      <div className="font-bold text-[#2C3E50]">{lastOrder.estimatedDelivery}</div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    variant="outline" 
                    className="flex-1 rounded-2xl h-14 border-emerald-100 text-emerald-700 font-black shadow-sm"
                    onClick={() => printInvoice(lastOrder)}
                  >
                    <Download className="h-5 w-5 mr-2" /> Download Invoice
                  </Button>
                  <Button 
                    className="flex-1 bg-[#2D5A27] hover:bg-[#1E3D1A] text-white rounded-2xl h-14 font-black text-lg shadow-xl shadow-emerald-100"
                    onClick={() => setView('orders')}
                  >
                    Track Order
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'orders' && (
            <motion.div 
              key="orders"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-5xl mx-auto space-y-8"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-3xl font-black text-[#2C3E50]">Your Orders</h3>
                  <p className="text-[#7F8C8D]">Manage and track your farm-to-home deliveries</p>
                </div>
                <Button variant="outline" className="rounded-xl border-gray-200" onClick={() => setView('browse')}>Continue Shopping</Button>
              </div>
              
              <div className="space-y-8">
                {orders.map(order => (
                  <Card key={order.id} className="border-none shadow-lg rounded-[40px] bg-white overflow-hidden hover:shadow-xl transition-all border border-emerald-50">
                    <div className="p-8 md:p-10 flex flex-col lg:flex-row gap-10">
                      <div className="flex-1 space-y-8">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="text-[10px] font-black text-[#7F8C8D] uppercase tracking-[0.2em]">Order ID: {order.id.slice(-10).toUpperCase()}</div>
                            <div className="text-sm font-bold text-[#2C3E50]">Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                          </div>
                          <Badge className={`
                            ${order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' : 
                              order.status === 'Cancelled' ? 'bg-rose-100 text-rose-700' : 
                              'bg-amber-100 text-amber-700'} 
                            border-none px-6 py-2 rounded-full text-xs font-black uppercase tracking-wider shadow-sm
                          `}>
                            {order.status}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-4">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-4 bg-[#F8F9F3] p-3 rounded-2xl pr-6 border border-emerald-50">
                              <SafeImage src={imageForMarketProduct(item.name, item.category, item.image)} alt={item.name} className="w-14 h-14 rounded-xl object-cover shadow-sm" />
                              <div>
                                <div className="text-sm font-black text-[#2C3E50]">{item.name}</div>
                                <div className="text-xs text-[#7F8C8D] font-bold">{item.cartQuantity} {item.unit} • ₹{item.price * item.cartQuantity}</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Amazon-style Tracking Stepper */}
                        {order.status !== 'Cancelled' && (
                          <div className="space-y-6 pt-6">
                            <div className="flex justify-between items-center relative">
                              <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 z-0 rounded-full" />
                              <div 
                                className="absolute top-1/2 left-0 h-1 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-1000 rounded-full"
                                style={{ 
                                  width: order.status === 'Ordered' ? '0%' : 
                                         order.status === 'Shipped' ? '33%' : 
                                         order.status === 'Out for delivery' ? '66%' : 
                                         order.status === 'Delivered' ? '100%' : '0%' 
                                }}
                              />
                              {['Ordered', 'Shipped', 'Out for delivery', 'Delivered'].map((step, i) => {
                                const isCompleted = ['Ordered', 'Shipped', 'Out for delivery', 'Delivered'].indexOf(order.status) >= i;
                                return (
                                  <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                                    <div className={`w-6 h-6 rounded-full border-4 ${isCompleted ? 'bg-emerald-500 border-emerald-100' : 'bg-white border-gray-100'} transition-colors duration-500`} />
                                    <span className={`text-[10px] font-black uppercase tracking-tighter ${isCompleted ? 'text-emerald-700' : 'text-gray-300'}`}>{step}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="lg:w-80 bg-[#F8F9F3] p-10 rounded-[32px] flex flex-col justify-between gap-8 border border-emerald-50">
                        <div className="space-y-6">
                          <div className="flex justify-between items-end">
                            <span className="text-xs font-bold text-[#7F8C8D] uppercase">Final Amount</span>
                            <span className="text-3xl font-black text-[#2D5A27]">₹{order.finalAmount}</span>
                          </div>
                          <div className="space-y-3">
                            <Button 
                              variant="outline" 
                              className="w-full rounded-2xl h-12 border-emerald-100 text-emerald-700 font-black shadow-sm bg-white hover:bg-emerald-50"
                              onClick={() => printInvoice(order)}
                            >
                              <Printer className="h-5 w-5 mr-2" /> Print Invoice
                            </Button>
                            {order.status === 'Ordered' && (
                              <Button 
                                variant="ghost" 
                                className="w-full rounded-2xl h-12 text-rose-600 hover:bg-rose-50 font-black"
                                onClick={() => handleCancelOrder(order.id)}
                              >
                                <X className="h-5 w-5 mr-2" /> Cancel Order
                              </Button>
                            )}
                            {order.status === 'Delivered' && (
                              <Button 
                                className="w-full rounded-2xl h-12 bg-[#2D5A27] hover:bg-[#1E3D1A] text-white font-black shadow-lg shadow-emerald-100"
                              >
                                <RotateCcw className="h-5 w-5 mr-2" /> Reorder Now
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="pt-6 border-t border-gray-200">
                          <p className="text-[10px] text-[#7F8C8D] font-bold uppercase mb-2">Delivery Address</p>
                          <p className="text-xs text-[#2C3E50] leading-relaxed font-medium">{order.deliveryAddress}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                {orders.length === 0 && (
                  <div className="text-center py-32 bg-white rounded-[48px] shadow-sm border-2 border-dashed border-gray-100">
                    <div className="text-9xl mb-8">📦</div>
                    <h4 className="text-3xl font-black text-[#2C3E50]">No orders found</h4>
                    <p className="text-[#7F8C8D] max-w-sm mx-auto text-lg">Your Amazon-style order history will appear here once you make a purchase.</p>
                    <Button onClick={() => setView('browse')} className="mt-8 bg-[#2D5A27] text-white rounded-2xl h-14 px-12 font-bold text-lg">Start Shopping</Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {view === 'sell' && (
            <motion.div 
              key="sell"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h3 className="text-3xl font-black text-[#2C3E50]">Farmer Dashboard</h3>
                  <p className="text-[#7F8C8D]">Manage your listings and track your farm sales</p>
                </div>
                <div className="bg-white p-1 rounded-2xl shadow-sm border border-[#EAECE6] flex gap-1 w-full md:w-auto">
                  <Button 
                    variant={selectedCategory === 'All' ? 'default' : 'ghost'}
                    className={`rounded-xl flex-1 md:flex-none px-8 ${selectedCategory === 'All' ? 'bg-[#2D5A27] text-white' : 'text-[#7F8C8D]'}`}
                    onClick={() => setView('sell')}
                  >
                    My Listings
                  </Button>
                  <Button 
                    variant="ghost"
                    className="rounded-xl flex-1 md:flex-none px-8 text-[#7F8C8D] hover:bg-emerald-50 hover:text-[#2D5A27]"
                    onClick={() => {
                      // Trigger add product modal or view
                      toast.info('Use the "Add Product" tab below');
                    }}
                  >
                    Sales Report
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="listings" className="w-full">
                <TabsList className="h-14 rounded-2xl bg-white border border-[#EAECE6] p-1 mb-8">
                  <TabsTrigger value="listings" className="rounded-xl h-full px-8 data-[state=active]:bg-[#F0F4EF] data-[state=active]:text-[#2D5A27] font-bold">My Products ({myProducts.length})</TabsTrigger>
                  <TabsTrigger value="add" className="rounded-xl h-full px-8 data-[state=active]:bg-[#F0F4EF] data-[state=active]:text-[#2D5A27] font-bold">Add New Produce</TabsTrigger>
                </TabsList>
                
                <TabsContent value="listings" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myProducts.map(product => (
                      <Card key={product.id} className="border-none shadow-md rounded-[32px] bg-white overflow-hidden group">
                        <div className="p-5 flex gap-5">
                          <div className="relative w-28 h-28 shrink-0">
                            <SafeImage src={imageForMarketProduct(product.name, product.category, product.image)} alt={product.name} className="w-full h-full rounded-2xl object-cover shadow-sm" />
                            {product.isOrganic && (
                              <div className="absolute -top-2 -left-2 bg-emerald-600 text-white text-[8px] font-bold px-2 py-1 rounded-full shadow-sm">ORGANIC</div>
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <h4 className="font-black text-[#2C3E50] leading-tight">{product.name}</h4>
                            <p className="text-[10px] font-bold text-[#7F8C8D] uppercase tracking-widest">{product.category}</p>
                            <div className="flex items-center justify-between pt-2">
                              <span className="text-xl font-black text-[#2D5A27]">₹{product.price}<span className="text-[10px] text-[#7F8C8D] font-normal">/{product.unit}</span></span>
                              <Badge variant="outline" className="text-[10px] font-bold border-emerald-100 text-emerald-700 bg-emerald-50">Qty: {product.quantity}</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="bg-[#F8F9F3] p-4 flex gap-3 border-t border-emerald-50">
                          <Button variant="ghost" size="sm" className="flex-1 text-emerald-700 hover:bg-emerald-100 rounded-xl font-bold h-10">
                            <Edit2 className="h-4 w-4 mr-2" /> Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="flex-1 text-rose-600 hover:bg-rose-100 rounded-xl font-bold h-10"
                            onClick={() => deleteDoc(doc(db, 'market_products', product.id))}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </Button>
                        </div>
                      </Card>
                    ))}
                    {myProducts.length === 0 && (
                      <div className="col-span-full text-center py-32 bg-white rounded-[48px] border-dashed border-2 border-emerald-50">
                        <div className="text-7xl mb-6">🌱</div>
                        <h4 className="text-2xl font-black text-[#2C3E50]">No products listed</h4>
                        <p className="text-[#7F8C8D] max-w-xs mx-auto">Start selling your fresh farm produce directly to customers today!</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="add" className="mt-0 max-w-3xl mx-auto">
                  <Card className="p-10 rounded-[40px] border-none shadow-2xl bg-white">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="bg-emerald-100 p-3 rounded-2xl">
                        <Plus className="h-6 w-6 text-emerald-700" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-[#2C3E50]">List New Produce</h3>
                        <p className="text-[#7F8C8D] text-sm">Fill in the details to reach thousands of customers</p>
                      </div>
                    </div>
                    <form onSubmit={handleAddProduct} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <Label className="font-bold text-[#2C3E50]">Product Name</Label>
                          <Input name="name" placeholder="e.g. Fresh Buffalo Milk" required className="rounded-xl h-12 border-gray-200 focus:border-emerald-500" />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold text-[#2C3E50]">Category</Label>
                          <Select name="category" required onValueChange={(val) => setSelectedCategory(val as ProductCategory)}>
                            <SelectTrigger className="rounded-xl h-12 border-gray-200 focus:border-emerald-500">
                              <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold text-[#2C3E50]">Price (₹)</Label>
                          <Input name="price" type="number" placeholder="Enter price" required className="rounded-xl h-12 border-gray-200 focus:border-emerald-500" />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold text-[#2C3E50]">Unit</Label>
                          <Select name="unit" required>
                            <SelectTrigger className="rounded-xl h-12 border-gray-200 focus:border-emerald-500">
                              <SelectValue placeholder="Select Unit" />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedCategory !== 'All' && CATEGORY_UNITS[selectedCategory as ProductCategory]?.map(unit => (
                                <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                              ))}
                              {selectedCategory === 'All' && ['kg', 'litre', 'dozen', 'piece', 'bunch'].map(unit => (
                                <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold text-[#2C3E50]">Available Quantity</Label>
                          <Input name="quantity" type="number" placeholder="Total stock available" required className="rounded-xl h-12 border-gray-200 focus:border-emerald-500" />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold text-[#2C3E50]">Harvest Date</Label>
                          <Input 
                            name="harvestDate" 
                            type="date" 
                            defaultValue={new Date().toISOString().split('T')[0]} 
                            required 
                            className="rounded-xl h-12 border-gray-200 focus:border-emerald-500" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold text-[#2C3E50]">Product Image</Label>
                          <div className="flex gap-3">
                            <Button 
                              type="button" 
                              variant="outline" 
                              className="flex-1 rounded-xl h-12 border-dashed border-2 border-emerald-200 text-emerald-700 bg-emerald-50/30 hover:bg-emerald-50"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Camera className="h-5 w-5 mr-2" /> Capture / Upload
                            </Button>
                            <input 
                              type="file" 
                              ref={fileInputRef} 
                              className="hidden" 
                              accept="image/*" 
                              capture="environment"
                              onChange={handleImageChange}
                            />
                          </div>
                          {previewImage && (
                            <div className="relative mt-4 group">
                              <img src={previewImage} className="w-full h-40 object-cover rounded-2xl shadow-md border-2 border-emerald-100" />
                              <button 
                                type="button" 
                                className="absolute -top-2 -right-2 bg-rose-500 text-white p-2 rounded-full shadow-lg hover:bg-rose-600 transition-colors"
                                onClick={() => setPreviewImage(null)}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-[#F8F9F3] rounded-2xl border border-emerald-50">
                        <input type="checkbox" name="isOrganic" id="isOrganic" className="w-6 h-6 rounded-lg border-emerald-200 text-[#2D5A27] focus:ring-[#2D5A27]" />
                        <Label htmlFor="isOrganic" className="cursor-pointer font-bold text-[#2C3E50]">This is a Certified Organic Produce</Label>
                        <Leaf className="h-5 w-5 text-emerald-600 ml-auto" />
                      </div>
                      <Button type="submit" className="w-full bg-[#2D5A27] hover:bg-[#1E3D1A] text-white rounded-2xl h-16 font-black text-xl shadow-xl shadow-emerald-200 transition-all hover:scale-[1.02]">
                        Launch Product on Market
                      </Button>
                    </form>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
