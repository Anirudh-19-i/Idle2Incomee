import React, { useState, useEffect } from 'react';
import { db, collection, query, where, onSnapshot, serverTimestamp, addDoc, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../auth/AuthProvider';
import { Item } from '../../types';
import { Card, Button, Input } from '../ui/Base';
import { Search, Plus, MapPin, Tag, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Dashboard: React.FC<{ onSelectItem: (item: Item) => void }> = ({ onSelectItem }) => {
  const { profile } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    if (!profile?.communityId) return;

    const q = query(
      collection(db, 'items'), 
      where('communityId', '==', profile.communityId),
      where('status', '==', 'available')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));
      setItems(newItems);
      setLoading(false);
      setError(null);
    }, (error) => {
      setError('Unable to load items for your community. Please ensure you are verified.');
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, 'items');
    });

    return unsubscribe;
  }, [profile]);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = category === 'All' || item.category === category;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'Tools', 'Electronics', 'Kitchen', 'Camping', 'Games', 'Others'];

  return (
    <div className="pt-24 pb-32 px-6 max-w-5xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-slate-500 mb-2">
          <MapPin size={16} className="text-orange-600" />
          <span className="text-sm font-medium">{profile?.communityId.replace(/-/g, ' ').toUpperCase()}</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Discover shared assets</h1>
      </header>

      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-500 shrink-0" size={20} />
            <p className="text-sm text-red-700 font-bold">{error}</p>
          </div>
          <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <Input 
            placeholder="Search for a drill, blender, or projector..." 
            className="pl-12"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide md:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${category === cat ? 'bg-orange-600 text-white' : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-80 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredItems.map(item => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => onSelectItem(item)}
              >
                <Card className="cursor-pointer group">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-900 group-hover:text-orange-600 transition-colors uppercase tracking-tight">{item.title}</h3>
                      <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">{item.category}</span>
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">{item.description}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <div>
                        <span className="text-lg font-bold text-slate-900">₹{item.pricePerDay}</span>
                        <span className="text-xs text-slate-400">/day</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Tag size={14} />
                        <span className="text-xs font-medium uppercase">{item.ownerName}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-3xl">
          <div className="bg-slate-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="text-slate-400" size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No items found</h3>
          <p className="text-slate-500 mt-2">Try searching for something else or be the first to list an item.</p>
        </div>
      )}
    </div>
  );
};

export const PostItem: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { profile, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    pricePerDay: '',
    category: 'Tools',
    imageUrl: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!profile || !user) {
      setError('You must be logged in to list an item.');
      return;
    }

    if (!formData.title || !formData.pricePerDay || !formData.description) {
      setError('Please fill in all required fields (Name, Price, and Description).');
      return;
    }

    setIsLoading(true);
    try {
      await addDoc(collection(db, 'items'), {
        ...formData,
        pricePerDay: Number(formData.pricePerDay),
        ownerUid: user.uid,
        ownerName: profile.displayName,
        communityId: profile.communityId,
        status: 'available',
        imageUrl: formData.imageUrl || `https://picsum.photos/seed/${formData.title}/800/600`,
        createdAt: serverTimestamp()
      });
      onSuccess();
    } catch (err: any) {
      if (err.message && err.message.includes('permission')) {
        setError('Verification Required: Your community president must verify your residency before you can list items.');
      } else {
        setError('An unexpected error occurred. Please try again or contact support.');
      }
      handleFirestoreError(err, OperationType.CREATE, 'items');
    } finally {
      setIsLoading(false);
    }
  };

  const categories = ['Tools', 'Electronics', 'Kitchen', 'Camping', 'Games', 'Others'];

  return (
    <div className="pt-24 pb-32 px-6 max-w-xl mx-auto">
      <Card className="p-8 border-orange-100 shadow-xl shadow-orange-50/50">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <Plus className="text-orange-600" size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">List an Item</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{profile?.communityId.replace(/-/g, ' ')}</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl mb-6 flex items-start gap-3">
            <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={16} />
            <p className="text-xs text-red-700 font-bold leading-relaxed">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Identity</label>
            <Input 
              placeholder="What are you sharing? (e.g. Bosch Power Drill)" 
              required 
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Price / Day (₹)</label>
              <Input 
                type="number" 
                placeholder="0 for free" 
                required
                value={formData.pricePerDay}
                onChange={e => setFormData({...formData, pricePerDay: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
              <select 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-bold text-xs uppercase tracking-widest text-slate-700"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description & Conditions</label>
            <textarea 
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-slate-700 min-h-[120px] text-sm font-medium placeholder:text-slate-400"
              placeholder="Tell your neighbors about the condition, accessories included, and any borrowing rules."
              required
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visual (Link)</label>
            <Input 
              placeholder="Paste image URL (or leave empty for a placeholder)" 
              value={formData.imageUrl}
              onChange={e => setFormData({...formData, imageUrl: e.target.value})}
            />
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full h-14 bg-orange-600 shadow-xl shadow-orange-100" isLoading={isLoading}>
              Publish Listing
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
