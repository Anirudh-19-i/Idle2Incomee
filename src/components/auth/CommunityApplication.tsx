import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import { Button, Input, Card } from '../ui/Base';
import { motion } from 'motion/react';
import { Building2, MapPin, Mail, AlertCircle, CheckCircle, LogIn, ArrowRight, Package } from 'lucide-react';

export const CommunityApplication: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { createCommunity, user, signIn } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    flatNumber: '',
    treasurerEmail: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Community name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }

    if (!formData.flatNumber.trim()) {
      newErrors.flatNumber = 'Your flat/house number is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.treasurerEmail.trim()) {
      newErrors.treasurerEmail = 'Treasurer email is required';
    } else if (!emailRegex.test(formData.treasurerEmail)) {
      newErrors.treasurerEmail = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrors({ submit: 'You must be signed in to submit an application.' });
      return;
    }
    if (!validate()) return;

    setIsLoading(true);
    try {
      await createCommunity({
        name: formData.name,
        location: formData.location,
        flatNumber: formData.flatNumber,
        treasurerUid: formData.treasurerEmail, 
      });
      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      setErrors({ submit: 'Failed to submit application. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <Card className="p-10 text-center shadow-2xl border-0 ring-1 ring-slate-200">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-green-600 w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-4">Application Received</h2>
            <p className="text-slate-600 mb-8 leading-relaxed">
              Superb! Your application for <b>{formData.name}</b> has been received. 
              Our network admins will review your request and get back to you shortly.
            </p>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">What happens next?</p>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  We'll verify the community details. Once approved, you'll be able to invite residents and manage the treasury.
                </p>
              </div>
              <Button className="w-full h-14 text-lg font-bold" onClick={() => window.location.reload()}>
                Check Status <ArrowRight className="ml-2" />
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <Card className="p-8 shadow-2xl border-0 ring-1 ring-slate-200">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="text-orange-600 w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Register Community</h1>
            <p className="text-slate-500 mt-2 text-sm">Apply to list your society on SamaajShare and become its President.</p>
          </div>

          {!user ? (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center mb-6">
              <LogIn className="mx-auto text-slate-400 mb-3" size={32} />
              <h3 className="font-bold text-slate-900 mb-1">Identity Required</h3>
              <p className="text-xs text-slate-500 mb-4">You need to sign in with Google to apply as a community President.</p>
              <Button onClick={() => signIn()} className="w-full flex items-center justify-center gap-2">
                <LogIn size={18} /> Sign In to Continue
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
                  <Building2 size={14} className="text-slate-400" /> Society Name
                </label>
                <Input 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Royal Heights Apartment"
                  className={errors.name ? 'border-red-300 focus:ring-red-500' : ''}
                />
                {errors.name && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium">
                    <AlertCircle size={12} /> {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
                  <MapPin size={14} className="text-slate-400" /> Location
                </label>
                <Input 
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Whitefield, Bengaluru"
                  className={errors.location ? 'border-red-300 focus:ring-red-500' : ''}
                />
                {errors.location && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium">
                    <AlertCircle size={12} /> {errors.location}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
                  <Package size={14} className="text-slate-400" /> Your Flat/House Number
                </label>
                <Input 
                  value={formData.flatNumber}
                  onChange={e => setFormData({ ...formData, flatNumber: e.target.value })}
                  placeholder="e.g. B-402"
                  className={errors.flatNumber ? 'border-red-300 focus:ring-red-500' : ''}
                />
                {errors.flatNumber && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium">
                    <AlertCircle size={12} /> {errors.flatNumber}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
                  <Mail size={14} className="text-slate-400" /> Treasurer Email
                </label>
                <Input 
                  type="email"
                  value={formData.treasurerEmail}
                  onChange={e => setFormData({ ...formData, treasurerEmail: e.target.value })}
                  placeholder="treasurer@example.com"
                  className={errors.treasurerEmail ? 'border-red-300 focus:ring-red-500' : ''}
                />
                {errors.treasurerEmail && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium">
                    <AlertCircle size={12} /> {errors.treasurerEmail}
                  </p>
                )}
              </div>

              {errors.submit && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-xs text-red-700 font-medium">
                  {errors.submit}
                </div>
              )}

              <div className="pt-2 space-y-3">
                <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-200" isLoading={isLoading}>
                  Submit Application
                </Button>
                {onBack && (
                  <Button type="button" variant="ghost" className="w-full text-slate-500" onClick={onBack}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 italic text-center">
            <p className="text-[10px] text-slate-400 leading-normal">
              Note: Applications are reviewed by SamaajShare admins within 24-48 hours. 
              Once approved, you will be granted President privileges for this community.
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
