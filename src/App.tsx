/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import ProtectedRoute from '@/components/ProtectedRoute';
import ScrollToTop from '@/components/ScrollToTop';

// Pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ResetPassword from '@/pages/ResetPassword';
import Dashboard from '@/pages/Dashboard';
import AIAssistant from '@/pages/AIAssistant';
import Weather from '@/pages/Weather';
import Shop from '@/pages/Shop';
import ColdStorage from '@/pages/ColdStorage';
import DirectMarket from '@/pages/DirectMarket';
import SlotBooking from '@/pages/SlotBooking';
import Community from '@/pages/Community';
import SmartCrops from '@/pages/SmartCrops';
import FPO from '@/pages/FPO';
import FPODetails from '@/pages/FPODetails';
import MarketDemand from '@/pages/MarketDemand';
import GovSchemes from '@/pages/GovSchemes';
import Profile from '@/pages/Profile';
import Technologies from '@/pages/Technologies';
import ExpertAdvice from '@/pages/ExpertAdvice';
import ProductDetails from '@/pages/ProductDetails';
import Cart from '@/pages/Cart';
import Checkout from '@/pages/Checkout';
import Orders from '@/pages/Orders';
import CropAdvisor from '@/pages/CropAdvisor';

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/ai-assistant" element={
          <ProtectedRoute>
            <AIAssistant />
          </ProtectedRoute>
        } />

        <Route path="/weather" element={
          <ProtectedRoute>
            <Weather />
          </ProtectedRoute>
        } />

        <Route path="/shop" element={
          <ProtectedRoute>
            <Shop />
          </ProtectedRoute>
        } />

        <Route path="/product/:id" element={
          <ProtectedRoute>
            <ProductDetails />
          </ProtectedRoute>
        } />

        <Route path="/cart" element={
          <ProtectedRoute>
            <Cart />
          </ProtectedRoute>
        } />

        <Route path="/checkout" element={
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        } />

        <Route path="/orders" element={
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        } />

        <Route path="/cold-storage" element={
          <ProtectedRoute>
            <ColdStorage />
          </ProtectedRoute>
        } />

        <Route path="/direct-market" element={
          <ProtectedRoute>
            <DirectMarket />
          </ProtectedRoute>
        } />

        <Route path="/slot-booking" element={
          <ProtectedRoute>
            <SlotBooking />
          </ProtectedRoute>
        } />

        <Route path="/community" element={
          <ProtectedRoute>
            <Community />
          </ProtectedRoute>
        } />

        <Route path="/high-demand" element={<Navigate to="/smart-demand" replace />} />

        <Route path="/fpo" element={
          <ProtectedRoute>
            <FPO />
          </ProtectedRoute>
        } />

        <Route path="/fpo/:id" element={
          <ProtectedRoute>
            <FPODetails />
          </ProtectedRoute>
        } />

        <Route path="/demand" element={<Navigate to="/smart-demand" replace />} />

        <Route path="/smart-demand" element={
          <ProtectedRoute>
            <CropAdvisor />
          </ProtectedRoute>
        } />

        <Route path="/crop-advisory" element={<Navigate to="/smart-demand" replace />} />

        <Route path="/gov-schemes" element={
          <ProtectedRoute>
            <GovSchemes />
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />

        <Route path="/technologies" element={
          <ProtectedRoute>
            <Technologies />
          </ProtectedRoute>
        } />

        <Route path="/expert-advice" element={
          <ProtectedRoute>
            <ExpertAdvice />
          </ProtectedRoute>
        } />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toaster position="top-center" />
    </Router>
  );
}
