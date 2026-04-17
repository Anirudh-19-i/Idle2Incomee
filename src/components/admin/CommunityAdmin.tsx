import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { db, collection, query, where, onSnapshot, doc, updateDoc, setDoc, handleFirestoreError, OperationType, getDoc } from '../../lib/firebase';
import { UserProfile, Booking } from '../../types';
import { Card, Button, Input } from '../ui/Base';
import { Users, TrendingUp, DollarSign, CheckCircle, XCircle, Building2, ShieldAlert, Edit2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

export const CommunityAdmin: React.FC<{ forcedCommunityId?: string }> = ({ forcedCommunityId }) => {
  const { profile, community: myCommunity, user } = useAuth();
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [externalCommunity, setExternalCommunity] = useState<any>(null);

  const targetCommunityId = forcedCommunityId || profile?.communityId;
  const isSuperAdmin = user?.email === 'anirudhreddymogulla@gmail.com';
  const isPresident = profile?.role === 'president' || isSuperAdmin;
  const isTreasurer = profile?.role === 'treasurer' || isSuperAdmin;

  const [editMode, setEditMode] = useState(false);
  const [commEdit, setCommEdit] = useState({ name: '', location: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!targetCommunityId || !user) return;

    if (forcedCommunityId) {
      getDoc(doc(db, 'communities', forcedCommunityId)).then(s => {
        if (s.exists()) setExternalCommunity(s.data());
      }).catch(err => handleFirestoreError(err, OperationType.GET, `communities/${forcedCommunityId}`));
    } else if (myCommunity) {
      setCommEdit({ name: myCommunity.name, location: myCommunity.location });
    }
    
    // Fetch members
    const membersQuery = query(collection(db, 'users'), where('communityId', '==', targetCommunityId));
    const unsubMembers = onSnapshot(membersQuery, 
      (snap) => {
        setMembers(snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `users?communityId=${targetCommunityId}`)
    );

    // Fetch bookings for revenue analysis
    const bookingsQuery = query(
      collection(db, 'bookings'), 
      where('communityId', '==', targetCommunityId),
      where('status', '==', 'completed')
    );
    const unsubBookings = onSnapshot(bookingsQuery, 
      (snap) => {
        const data = snap.docs.map(doc => doc.data() as Booking);
        setTotalTransactions(data.length);
        const revenue = data.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);
        setTotalRevenue(revenue);

        // Simple chart data
        const chartData = data.slice(-7).map((b, i) => ({
          name: `Tx ${i + 1}`,
          revenue: b.totalPrice,
          count: 1
        }));
        setStats(chartData);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `bookings?communityId=${targetCommunityId}`)
    );

    return () => {
      unsubMembers();
      unsubBookings();
    };
  }, [targetCommunityId, forcedCommunityId]);

  const toggleVerification = async (userId: string, status: boolean) => {
    if (!isPresident) return; 
    try {
      await updateDoc(doc(db, 'users', userId), {
        isVerified: status
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const toggleEditMode = () => {
    if (!editMode && activeCommunity) {
      setCommEdit({ name: activeCommunity.name, location: activeCommunity.location });
    }
    setEditMode(!editMode);
  };

  const handleUpdateCommunity = async () => {
    if (!targetCommunityId) return;
    setIsLoading(true);
    try {
      await setDoc(doc(db, 'communities', targetCommunityId), {
        name: commEdit.name,
        location: commEdit.location
      }, { merge: true });
      setEditMode(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `communities/${targetCommunityId}`);
    } finally {
      setIsLoading(false);
    }
  };

  const removeMember = async (userId: string) => {
    if (!isPresident) return;
    if (!window.confirm("Are you sure you want to remove this member? They will need to re-apply to join.")) return;
    
    try {
      // Logic: Just remove their communityId and reset role
      await updateDoc(doc(db, 'users', userId), {
        communityId: '',
        role: 'member',
        isVerified: false
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const activeCommunity = forcedCommunityId ? externalCommunity : myCommunity;

  if (!isPresident && !isTreasurer) {
    return (
      <div className="pt-24 pb-32 px-6 max-w-6xl mx-auto flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="text-red-600" size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Access Restricted</h2>
        <p className="max-w-md text-slate-500 mb-8 leading-relaxed">
          The Community Administration board is reserved for society leaders. 
          Please contact your building President or Treasurer for administrative matters.
        </p>
        <Button variant="outline" onClick={() => window.location.href = '/'}>Return Home</Button>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-32 px-6 max-w-6xl mx-auto">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Community Administration</h2>
          <p className="text-slate-500">Analytics for <b>{activeCommunity?.name || 'Loading...'}</b> • {isSuperAdmin ? 'SUPER ADMIN' : profile?.role?.toUpperCase()}</p>
        </div>
        {(isPresident || isTreasurer) && (
          <Button 
            variant={editMode ? 'ghost' : 'outline'} 
            onClick={toggleEditMode}
            className="flex items-center gap-2"
          >
            {editMode ? 'Cancel' : <><Edit2 size={16} /> Edit Details</>}
          </Button>
        )}
      </div>

      <AnimatePresence>
        {editMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="mb-10 p-8 border-orange-200 bg-orange-50/30 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-orange-600" />
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Building2 className="text-orange-600" size={20} /> Society Identity
              </h3>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Society Name</label>
                  <Input 
                    value={commEdit.name} 
                    onChange={(e) => setCommEdit({ ...commEdit, name: e.target.value })}
                    placeholder="Enter official society name"
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Physical Location</label>
                  <Input 
                    value={commEdit.location} 
                    onChange={(e) => setCommEdit({ ...commEdit, location: e.target.value })}
                    placeholder="Area, City"
                    className="bg-white"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleUpdateCommunity} className="bg-orange-600 shadow-lg shadow-orange-200" isLoading={isLoading}>
                  Save Community Profile
                </Button>
                <Button variant="ghost" onClick={toggleEditMode}>Discard</Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card className="p-6 bg-orange-600 text-white border-0">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-orange-100 text-sm font-medium uppercase tracking-wider">Total Revenue</p>
              <h3 className="text-3xl font-bold mt-1">₹{totalRevenue}</h3>
            </div>
            <DollarSign className="text-orange-200" size={24} />
          </div>
        </Card>
        <Card className="p-6 bg-slate-900 text-white border-0">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Transactions</p>
              <h3 className="text-3xl font-bold mt-1">{totalTransactions}</h3>
            </div>
            <TrendingUp className="text-slate-500" size={24} />
          </div>
        </Card>
        <Card className="p-6 border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Verified Members</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">{members.filter(m => m.isVerified).length}</h3>
            </div>
            <Users className="text-slate-300" size={24} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <Card className="p-6">
          <h4 className="font-bold text-slate-900 mb-6">Revenue Performance</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#ea580c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-6">
          <h4 className="font-bold text-slate-900 mb-6">Transaction Growth</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#0f172a" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h4 className="font-bold text-slate-900">Member Directory</h4>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{members.length} Total Users</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Flat No</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                {isPresident && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map(member => (
                <tr key={member.uid} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={member.photoURL || ''} className="w-8 h-8 rounded-full" alt="" />
                      <span className="font-medium text-slate-900">{member.displayName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{member.flatNumber}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        member.role === 'president' ? 'bg-orange-100 text-orange-700' :
                        member.role === 'treasurer' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                    }`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {member.isVerified ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 font-bold">
                        <CheckCircle size={14} /> Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-slate-400 font-bold">
                        <Clock size={14} /> Pending
                      </span>
                    )}
                  </td>
                  {isPresident && (
                    <td className="px-6 py-4 text-right">
                      {member.uid !== profile?.uid && (
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant={member.isVerified ? 'ghost' : 'outline'} 
                            size="sm"
                            onClick={() => toggleVerification(member.uid, !member.isVerified)}
                          >
                            {member.isVerified ? 'Revoke' : 'Verify'}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => removeMember(member.uid)}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const Clock: React.FC<{ size?: number, className?: string }> = ({ size = 20, className }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
