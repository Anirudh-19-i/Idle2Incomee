import React, { useState } from 'react';
import { Item } from '../../types';
import { useAuth } from '../auth/AuthProvider';
import { Card, Button } from '../ui/Base';
import { db, collection, addDoc, serverTimestamp, handleFirestoreError, OperationType } from '../../lib/firebase';
import { ChevronLeft, Info, Calendar, ShieldCheck, User as UserIcon, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export const ItemDetails: React.FC<{ item: Item, onBack: () => void, onBook: (ownerUid: string, ownerName: string) => void }> = ({ item, onBack, onBook }) => {
  const { profile, user } = useAuth();
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBooking = async () => {
    if (!profile || !user) return;
    setIsBooking(true);
    setError(null);
    try {
      await addDoc(collection(db, 'bookings'), {
        itemId: item.id,
        itemTitle: item.title,
        ownerUid: item.ownerUid,
        ownerName: item.ownerName,
        borrowerUid: user.uid,
        borrowerName: profile.displayName,
        status: 'pending',
        startDate: serverTimestamp(),
        endDate: serverTimestamp(), // Placeholder for MVP
        totalPrice: item.pricePerDay,
        depositPaid: false,
        communityId: item.communityId,
        createdAt: serverTimestamp()
      });
      
      onBook(item.ownerUid, item.ownerName);
    } catch (err: any) {
      setError('Unable to send request. Ensure you are verified in this community.');
      handleFirestoreError(err, OperationType.CREATE, 'bookings');
    } finally {
      setIsBooking(false);
    }
  };

  const isOwner = user?.uid === item.ownerUid;

  return (
    <div className="pt-24 pb-32 px-6 max-w-5xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors font-medium">
        <ChevronLeft size={20} /> Back to dashboard
      </button>

      <div className="grid md:grid-cols-2 gap-10">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="rounded-[2.5rem] overflow-hidden bg-slate-100 shadow-xl border border-slate-200">
            <img 
              src={item.imageUrl} 
              alt={item.title} 
              className="w-full h-auto object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col">
          <div className="mb-6">
            <span className="bg-orange-100 text-orange-700 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider mb-4 inline-block">{item.category}</span>
            <h1 className="text-4xl font-bold text-slate-900 uppercase tracking-tight leading-none mb-4">{item.title}</h1>
            <div className="flex items-center gap-2 text-slate-500">
              <UserIcon size={16} />
              <span className="text-sm font-medium">Lent by <b>{item.ownerName}</b></span>
            </div>
          </div>

          <Card className="p-6 mb-8 border-slate-200 shadow-sm border-2">
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-bold text-slate-900">₹{item.pricePerDay}</span>
              <span className="text-slate-500">/day</span>
            </div>
            
            <p className="text-slate-600 leading-relaxed mb-6">
              {item.description}
            </p>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl mb-6 flex items-start gap-3">
                <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={16} />
                <p className="text-xs text-red-700 font-bold leading-relaxed">{error}</p>
              </div>
            )}

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 text-sm text-slate-500 bg-slate-50 p-3 rounded-xl">
                <ShieldCheck size={18} className="text-green-600" />
                <span>Verified Neighbor in <b>{item.communityId.replace(/-/g, ' ')}</b></span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500 bg-slate-50 p-3 rounded-xl">
                <Info size={18} className="text-blue-600" />
                <span>Optional security deposit may apply</span>
              </div>
            </div>

            {isOwner ? (
              <Button variant="outline" className="w-full" disabled>This is your listing</Button>
            ) : (
              <Button className="w-full" size="lg" onClick={handleBooking} isLoading={isBooking}>
                Request to Borrow
              </Button>
            )}
          </Card>

          <div className="flex items-start gap-4 p-4 rounded-2xl border border-orange-100 bg-orange-50/50">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Calendar className="text-orange-600" size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Community Library Concept</p>
              <p className="text-xs text-slate-600 leading-relaxed">By borrowing locally, you're helping build a more sustainable and connected community. Remember to treat items with care.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
