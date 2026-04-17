import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import { Onboarding, Landing } from './components/auth/Landing';
import { CommunityApplication } from './components/auth/CommunityApplication';
import { Dashboard, PostItem } from './components/items/Dashboard';
import { ItemDetails } from './components/items/ItemDetails';
import { Navbar } from './components/layout/Navbar';
import { ChatList, ChatWindow } from './components/chat/Chat';
import { Profile, MyItems } from './components/profile/ProfileViews';
import { CommunityAdmin } from './components/admin/CommunityAdmin';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Item, Community } from './types';
import { Plus, CheckSquare, ShieldCheck, MapPin } from 'lucide-react';
import { Button, Card } from './components/ui/Base';
import { db, collection, query, where, onSnapshot, doc, updateDoc, setDoc, handleFirestoreError, OperationType } from './lib/firebase';

const SuperAdminBoard: React.FC<{ onManageCommunity: (id: string) => void }> = ({ onManageCommunity }) => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [stats, setStats] = useState({ users: 0, revenue: 0, items: 0 });

  useEffect(() => {
    const q = query(collection(db, 'communities'));
    const unsub = onSnapshot(q, 
      (snap) => {
        setCommunities(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Community)));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'communities')
    );

    // Simple platform stats collection
    const unsubUsers = onSnapshot(collection(db, 'users'), 
      s => setStats(prev => ({ ...prev, users: s.size })),
      (error) => handleFirestoreError(error, OperationType.LIST, 'users')
    );
    const unsubItems = onSnapshot(collection(db, 'items'), 
      s => setStats(prev => ({ ...prev, items: s.size })),
      (error) => handleFirestoreError(error, OperationType.LIST, 'items')
    );
    const unsubBookings = onSnapshot(query(collection(db, 'bookings'), where('status', '==', 'completed')), 
      s => {
        const rev = s.docs.reduce((acc, curr) => acc + (curr.data().totalPrice || 0), 0);
        setStats(prev => ({ ...prev, revenue: rev }));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'bookings')
    );

    return () => {
      unsub();
      unsubUsers();
      unsubItems();
      unsubBookings();
    };
  }, []);

  const updateStatus = async (id: string, status: 'active' | 'rejected') => {
    try {
      await setDoc(doc(db, 'communities', id), { status }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `communities/${id}`);
    }
  };

  return (
    <div className="pt-24 pb-32 px-6 max-w-5xl mx-auto font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Platform Master</h2>
          <p className="text-slate-500 font-medium">Global oversight of SamaajShare network.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-center">
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Users</p>
            <p className="text-lg font-bold">{stats.users}</p>
          </div>
          <div className="bg-orange-600 text-white px-4 py-2 rounded-xl text-center">
            <p className="text-[10px] uppercase font-bold text-orange-200">Revenue</p>
            <p className="text-lg font-bold">₹{stats.revenue}</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Network Communities</h3>
        {communities.map(c => (
          <Card key={c.id} className="p-6 transition-all hover:shadow-xl hover:ring-2 hover:ring-orange-500/20 group">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="font-bold text-slate-900 text-xl tracking-tight">{c.name}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    c.status === 'active' ? 'bg-green-100 text-green-700' : 
                    c.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {c.status}
                  </span>
                </div>
                <p className="text-sm text-slate-500 flex items-center gap-1 font-medium">
                  <MapPin size={14} /> {c.location}
                </p>
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                {c.status === 'active' && (
                  <Button 
                    onClick={() => onManageCommunity(c.id)} 
                    variant="outline" 
                    className="flex-1 md:flex-none gap-2"
                  >
                    Manage Activity
                  </Button>
                )}
                {c.status !== 'active' && (
                  <Button 
                    onClick={() => updateStatus(c.id, 'active')} 
                    className="flex-1 md:flex-none bg-green-600 hover:bg-green-700"
                  >
                    Approve
                  </Button>
                )}
                {c.status === 'pending' && (
                  <Button 
                    onClick={() => updateStatus(c.id, 'rejected')} 
                    variant="ghost" 
                    className="text-red-600"
                  >
                    Reject
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

function AppContent() {
  const { user, profile, community, loading } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [activeChat, setActiveChat] = useState<{ id: string, otherName: string } | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [managedCommunityId, setManagedCommunityId] = useState<string | null>(null);

  const isSuperAdmin = user?.email === 'anirudhreddymogulla@gmail.com';
  const isPresident = profile?.role === 'president' || isSuperAdmin;
  const isTreasurer = profile?.role === 'treasurer' || isSuperAdmin;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (isApplying) {
    return <CommunityApplication onBack={() => setIsApplying(false)} />;
  }

  if (!user) {
    return <Landing onApply={() => setIsApplying(true)} />;
  }

  if (!profile && !isSuperAdmin) {
    return <Onboarding onApply={() => setIsApplying(true)} />;
  }

  // Super Admin bypasses community checks
  if (isSuperAdmin || isPresident || isTreasurer) {
    // Continue below
  } else if (community && community.status !== 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
        <Card className="max-w-md p-8">
          <CheckSquare className="mx-auto text-orange-600 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-slate-900">Society Approval Pending</h2>
          <p className="text-slate-500 mt-4 leading-relaxed">
            Society <b>{community.name}</b> is currently under review. 
            Listing items and borrowing will be enabled once our team verifies the community assets.
          </p>
          <Button variant="outline" className="mt-8 w-full" onClick={() => window.location.reload()}>Check Status</Button>
        </Card>
      </div>
    );
  } else if (profile && !profile.isVerified && profile.role === 'member') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
        <Card className="max-w-md p-8">
          <ShieldCheck className="mx-auto text-blue-600 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-slate-900">Member Verification</h2>
          <p className="text-slate-500 mt-4 leading-relaxed">
            You have successfully joined <b>{community?.name}</b>. 
            To maintain a trusted platform, the community President or Treasurer must verify your residency (Flat {profile.flatNumber}) before you can access the dashboard.
          </p>
          <div className="mt-8 p-4 bg-blue-50 text-blue-700 rounded-xl text-xs font-semibold uppercase tracking-wider">
            Status: Waiting for verification
          </div>
        </Card>
      </div>
    );
  }

  const renderView = () => {
    if (isSuperAdmin && activeView === 'dashboard') {
      return <SuperAdminBoard onManageCommunity={(id) => {
        setManagedCommunityId(id);
        setActiveView('community-admin');
      }} />;
    }
    if (activeChat) {
      return (
        <ChatWindow 
          chatId={activeChat.id} 
          otherName={activeChat.otherName} 
          onBack={() => setActiveChat(null)} 
        />
      );
    }

    if (selectedItem) {
      return (
        <ItemDetails 
          item={selectedItem} 
          onBack={() => setSelectedItem(null)} 
          onBook={(ownerUid, ownerName) => {
            setSelectedItem(null);
            const chatId = [user!.uid, ownerUid].sort().join('_');
            setActiveChat({ id: chatId, otherName: ownerName });
          }} 
        />
      );
    }

    switch (activeView) {
      case 'dashboard':
        return <Dashboard onSelectItem={setSelectedItem} />;
      case 'post-item':
        return <PostItem onSuccess={() => setActiveView('dashboard')} />;
      case 'my-items':
        return <MyItems onSelectItem={setSelectedItem} />;
      case 'chats':
        return (
          <ChatList 
            onSelectChat={(id, otherName) => setActiveChat({ id, otherName })} 
          />
        );
      case 'profile':
        return <Profile />;
      case 'community-admin':
        return <CommunityAdmin forcedCommunityId={managedCommunityId || undefined} />;
      default:
        return <Dashboard onSelectItem={setSelectedItem} />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar onNavigate={(view) => {
        setActiveView(view);
        setSelectedItem(null);
        setActiveChat(null);
      }} activeView={activeView} />
      
      <main className="pb-24">
        {renderView()}
      </main>

      {activeView === 'dashboard' && !selectedItem && !activeChat && (
        <Button 
          className="fixed bottom-24 right-6 md:bottom-12 md:right-12 shadow-2xl rounded-full w-16 h-16 p-0 z-50 bg-slate-900 border-4 border-white"
          onClick={() => setActiveView('post-item')}
        >
          <Plus size={32} />
        </Button>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

