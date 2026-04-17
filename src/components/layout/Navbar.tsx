import React from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Button } from '../ui/Base';
import { LogOut, User as UserIcon, Package, Home, MessageSquare, ShieldCheck } from 'lucide-react';

export const Navbar: React.FC<{ onNavigate: (view: string) => void, activeView: string }> = ({ onNavigate, activeView }) => {
  const { profile, signOut } = useAuth();
  
  const isSuperAdmin = useAuth().user?.email === 'anirudhreddymogulla@gmail.com';
  const canAdmin = profile?.role === 'president' || profile?.role === 'treasurer' || isSuperAdmin;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 md:top-0 md:bottom-auto md:border-t-0 md:border-b z-50">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        <div className="hidden md:flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('dashboard')}>
          <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
            <Package className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-slate-900 text-xl tracking-tight">SamaajShare</span>
        </div>

        <div className="flex flex-1 md:flex-initial justify-around md:gap-x-8">
          <NavItem 
            icon={<Home size={24} />} 
            label="Home" 
            isActive={activeView === 'dashboard'} 
            onClick={() => onNavigate('dashboard')} 
          />
          {canAdmin && (
            <NavItem 
              icon={<ShieldCheck size={24} />} 
              label="Admin" 
              isActive={activeView === 'community-admin'} 
              onClick={() => onNavigate('community-admin')} 
            />
          )}
          <NavItem 
            icon={<Package size={24} />} 
            label="My Items" 
            isActive={activeView === 'my-items'} 
            onClick={() => onNavigate('my-items')} 
          />
          <NavItem 
            icon={<MessageSquare size={24} />} 
            label="Chats" 
            isActive={activeView === 'chats'} 
            onClick={() => onNavigate('chats')} 
          />
          <NavItem 
            icon={<UserIcon size={24} />} 
            label="Profile" 
            isActive={activeView === 'profile'} 
            onClick={() => onNavigate('profile')} 
          />
        </div>

        {profile && (
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">{profile.displayName}</p>
              <p className="text-xs text-slate-500">{profile.flatNumber}</p>
            </div>
            <img src={profile.photoURL || ''} alt="" className="w-10 h-10 rounded-full border-2 border-orange-100" />
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut size={18} />
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }> = ({ icon, label, isActive, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 transition-colors ${isActive ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
  >
    {icon}
    <span className="text-[10px] md:text-sm font-medium">{label}</span>
  </button>
);
