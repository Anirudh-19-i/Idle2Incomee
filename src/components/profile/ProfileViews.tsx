import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { db, collection, query, where, onSnapshot, handleFirestoreError, OperationType, deleteDoc, doc } from '../../lib/firebase';
import { Item, Booking } from '../../types';
import { Card, Button } from '../ui/Base';
import { Settings, Trash2, Clock, CheckCircle, Package, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export const Profile: React.FC = () => {
  const { profile, signOut } = useAuth();

  return (
    <div className="pt-24 pb-32 px-6 max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <div className="relative inline-block">
          <img src={profile?.photoURL || ''} alt="" className="w-24 h-24 rounded-full border-4 border-white shadow-xl mb-4" />
          <div className="absolute bottom-4 right-0 w-8 h-8 bg-green-500 border-4 border-white rounded-full" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">{profile?.displayName}</h2>
        <p className="text-slate-500 font-medium">Flat {profile?.flatNumber} • {profile?.communityId.replace(/-/g, ' ').toUpperCase()}</p>
        <div className="mt-4 flex justify-center gap-2">
           <span className="bg-orange-100 text-orange-700 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">Verified Resident</span>
           <span className="bg-slate-100 text-slate-700 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">Rating: 5.0 ⭐</span>
        </div>
      </div>

      <div className="space-y-4">
        <Button variant="outline" className="w-full justify-start gap-3" onClick={() => {}}>
          <Settings size={20} /> Account Settings
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 text-red-600 hover:bg-red-50" onClick={signOut}>
          Log Out
        </Button>
      </div>

      <div className="mt-12 p-6 bg-slate-100 rounded-[2rem]">
         <h4 className="font-bold text-slate-900 mb-2">Sustainable Community Goal</h4>
         <p className="text-sm text-slate-600">You've saved roughly <span className="font-bold text-orange-600">₹4,500</span> by borrowing instead of buying this month. Keep it up!</p>
      </div>
    </div>
  );
};

export const MyItems: React.FC<{ onSelectItem: (item: Item) => void }> = ({ onSelectItem }) => {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const itemsQuery = query(collection(db, 'items'), where('ownerUid', '==', user.uid));
    const unsubscribeItems = onSnapshot(itemsQuery, 
      snapshot => {
        setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item)));
      },
      error => handleFirestoreError(error, OperationType.LIST, 'items?owner')
    );

    const bookingsQuery = query(collection(db, 'bookings'), where('ownerUid', '==', user.uid));
    const unsubscribeBookings = onSnapshot(bookingsQuery, 
      snapshot => {
        setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)));
      },
      error => handleFirestoreError(error, OperationType.LIST, 'bookings?owner')
    );

    return () => {
      unsubscribeItems();
      unsubscribeBookings();
    };
  }, [user]);

  const handleDeleteItem = async () => {
    if (!deleteId) return;
    try {
      await deleteDoc(doc(db, 'items', deleteId));
      setDeleteId(null);
    } catch (err: any) {
      setError('Failed to remove listing. Permission denied.');
      handleFirestoreError(err, OperationType.DELETE, `items/${deleteId}`);
    }
  };

  return (
    <div className="pt-24 pb-32 px-6 max-w-5xl mx-auto">
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight uppercase">My Community Library</h2>
        <p className="text-slate-500 font-medium">Manage items you are lending and view booking requests.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl mb-8 flex items-start gap-3">
          <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={16} />
          <p className="text-xs text-red-700 font-bold leading-relaxed">{error}</p>
        </div>
      )}

      {deleteId && (
        <Card className="p-6 mb-8 border-orange-100 bg-orange-50/30 animate-pulse">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">Confirm Removal</p>
              <p className="text-xs text-slate-500">This item will be permanently unlisted.</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" className="text-slate-500" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={handleDeleteItem}>Remove</Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-12">
        <section>
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Package size={24} className="text-orange-600" /> My Listings
          </h3>
          <div className="space-y-4">
            {items.length > 0 ? items.map(item => (
              <Card key={item.id} className="p-4">
                <div className="flex gap-4">
                  <img src={item.imageUrl} className="w-20 h-20 object-cover rounded-xl" alt="" referrerPolicy="no-referrer" />
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900">{item.title}</h4>
                    <p className="text-sm text-slate-500">₹{item.pricePerDay}/day • {item.status}</p>
                    <div className="flex gap-2 mt-3">
                       <Button variant="outline" size="sm" onClick={() => onSelectItem(item)}>View</Button>
                       <Button variant="ghost" size="sm" onClick={() => setDeleteId(item.id)} className="text-red-600">
                          <Trash2 size={16} />
                       </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <p className="text-slate-400">You haven't listed anything yet.</p>
              </div>
            )}
          </div>
        </section>

        <section>
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Clock size={24} className="text-blue-600" /> Pending Requests
          </h3>
          <div className="space-y-4">
            {bookings.filter(b => b.status === 'pending').length > 0 ? bookings.map(booking => (
              <Card key={booking.id} className="p-6 border-2 border-blue-50 bg-blue-50/20">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-600">Booking Request</span>
                  <span className="text-xs font-bold text-slate-400">₹{booking.totalPrice} • Pending</span>
                </div>
                <h4 className="font-bold text-slate-900 text-lg mb-1">{booking.itemTitle}</h4>
                <p className="text-sm text-slate-600 mb-6">Requested by <span className="font-bold underline">{booking.borrowerName}</span></p>
                <div className="flex gap-2">
                   <Button size="sm" className="flex-1">Approve</Button>
                   <Button size="sm" variant="outline" className="flex-1">Decline</Button>
                </div>
              </Card>
            )) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <p className="text-slate-400">No active requests.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
