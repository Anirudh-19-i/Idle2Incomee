import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { Button, Input, Card } from '../ui/Base';
import { motion } from 'motion/react';
import { ShieldCheck, MapPin, Package } from 'lucide-react';
import { db, collection, query, where, onSnapshot, handleFirestoreError, OperationType, auth } from '../../lib/firebase';

export const Onboarding: React.FC<{ onApply: () => void }> = ({ onApply }) => {
  const { updateProfile, profile } = useAuth();
  const [flatNumber, setFlatNumber] = useState('');
  const [communitySearch, setCommunitySearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableCommunities, setAvailableCommunities] = useState<any[]>([]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const q = query(collection(db, 'communities'), where('status', '==', 'active'));
    const unsubscribe = onSnapshot(q, 
      (snap) => {
        setAvailableCommunities(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'communities?status=active')
    );
    return unsubscribe;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flatNumber || !communitySearch) return;
    
    setIsLoading(true);
    try {
      await updateProfile({
        flatNumber,
        communityId: communitySearch,
        role: 'member',
        isVerified: false, // Must be verified by President
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <Card className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="text-orange-600 w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Join Your Community</h1>
            <p className="text-slate-500 mt-2">Find your residence and start sharing.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Community</label>
              <select 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium text-slate-700"
                value={communitySearch}
                onChange={(e) => setCommunitySearch(e.target.value)}
                required
              >
                <option value="">Choose your apartment/colony...</option>
                {availableCommunities.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Flat / House Number</label>
              <Input 
                placeholder="e.g. B-402" 
                value={flatNumber}
                onChange={(e) => setFlatNumber(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Request to Join
            </Button>
          </form>

          <p className="mt-6 text-xs text-center text-slate-400">
            Wait for your community President or Treasurer to verify your membership.
          </p>
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 mb-2 uppercase font-bold tracking-tight">Society Founder?</p>
            <Button variant="ghost" size="sm" onClick={onApply} className="text-orange-600 font-bold text-xs">
              Register Your Community Profile
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export const Landing: React.FC<{ onApply: () => void }> = ({ onApply }) => {
  const { signIn } = useAuth();

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-orange-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[600px] h-[600px] bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-32">
        <header className="flex justify-between items-center mb-24">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center">
              <Package className="text-white w-6 h-6" />
            </div>
            <span className="font-bold text-slate-900 text-2xl tracking-tight">SamaajShare</span>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" size="sm" onClick={onApply}>Register Community</Button>
            <Button variant="outline" size="sm" onClick={signIn}>Sign In</Button>
          </div>
        </header>

        <main className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 leading-[1.1] tracking-tight">
              Unlock the <span className="text-orange-600">Power</span> of Your Neighborhood.
            </h1>
            <p className="mt-6 text-xl text-slate-600 leading-relaxed max-w-lg">
              Borrow drills, rent blenders, and lease projectors from verified neighbors in your apartment complex. Save money, reduce waste.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={signIn}>Get Started</Button>
              <Button size="lg" variant="outline">How it Works</Button>
            </div>
            
            <div className="mt-12 flex items-center gap-8">
              <div>
                <p className="text-2xl font-bold text-slate-900">78k Cr+</p>
                <p className="text-sm text-slate-500 uppercase tracking-widest font-semibold">Idle Capital</p>
              </div>
              <div className="w-px h-10 bg-slate-200" />
              <div>
                <p className="text-2xl font-bold text-slate-900">200M+</p>
                <p className="text-sm text-slate-500 uppercase tracking-widest font-semibold">Shared Devices</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="bg-slate-100 aspect-square rounded-[3rem] overflow-hidden rotate-3 shadow-2xl">
              <img 
                src="https://picsum.photos/seed/apartment/800/800" 
                alt="Community" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            {/* Floating UI Elements */}
            <Card className="absolute -top-10 -right-10 p-4 rotate-0 shadow-xl hidden md:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Package size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Bosch Drill</p>
                  <p className="text-[10px] text-slate-500">Available • B-402</p>
                </div>
              </div>
            </Card>
            <Card className="absolute -bottom-10 -left-10 p-4 -rotate-2 shadow-xl hidden md:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <ShieldCheck size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Trust Score 4.9</p>
                  <p className="text-[10px] text-slate-500">Verified Resident</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  );
};
