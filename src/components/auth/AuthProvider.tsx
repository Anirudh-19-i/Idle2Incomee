import React, { useState, useEffect, createContext, useContext } from 'react';
import { auth, signInWithPopup, googleProvider, onAuthStateChanged, db, doc, getDoc, setDoc, serverTimestamp, User, onSnapshot, handleFirestoreError, OperationType } from '../../lib/firebase';
import { UserProfile, Community } from '../../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  community: Community | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  createCommunity: (data: Partial<Community> & { flatNumber: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;
    let unsubscribeCommunity: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // Clear existing listeners if they exist (important for sign-out or session changes)
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = undefined;
      }
      if (unsubscribeCommunity) {
        unsubscribeCommunity();
        unsubscribeCommunity = undefined;
      }

      if (currentUser) {
        // Subscribe to profile
        const userRef = doc(db, 'users', currentUser.uid);
        unsubscribeProfile = onSnapshot(userRef, 
          (snap) => {
            if (snap.exists()) {
              const profileData = snap.data() as UserProfile;
              setProfile(profileData);
              
              if (profileData.communityId) {
                // Clear community listener before creating a new one if community changed
                if (unsubscribeCommunity) {
                  unsubscribeCommunity();
                  unsubscribeCommunity = undefined;
                }
                const commRef = doc(db, 'communities', profileData.communityId);
                unsubscribeCommunity = onSnapshot(commRef, 
                  (commSnap) => {
                    if (commSnap.exists()) {
                      setCommunity({ id: commSnap.id, ...commSnap.data() } as Community);
                    } else {
                      setCommunity(null);
                    }
                    setLoading(false);
                  },
                  (error) => {
                    handleFirestoreError(error, OperationType.GET, `communities/${profileData.communityId}`);
                    setLoading(false);
                  }
                );
              } else {
                setCommunity(null);
                setLoading(false);
              }
            } else {
              setProfile(null);
              setCommunity(null);
              setLoading(false);
            }
          },
          (error) => {
            handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
            setLoading(false);
          }
        );
      } else {
        setProfile(null);
        setCommunity(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeCommunity) unsubscribeCommunity();
    };
  }, []);

  const signIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error.code !== 'auth/cancelled-popup-request') {
        console.error("Sign in error:", error);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const signOut = async () => {
    await auth.signOut();
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const docRef = doc(db, 'users', user.uid);
    const updatedProfile = {
      uid: user.uid,
      displayName: user.displayName || 'Guest',
      email: user.email,
      photoURL: user.photoURL,
      ...data,
      createdAt: profile?.createdAt || serverTimestamp(),
    };
    await setDoc(docRef, updatedProfile, { merge: true });
    setProfile(updatedProfile as UserProfile);
  };

  const createCommunity = async (data: Partial<Community> & { flatNumber: string }) => {
    if (!user) return;
    const commId = data.name!.toLowerCase().replace(/\s+/g, '-');
    const docRef = doc(db, 'communities', commId);
    
    const newCommunity: Community = {
      id: commId,
      name: data.name!,
      location: data.location || '',
      presidentUid: user.uid,
      treasurerUid: data.treasurerUid || '',
      status: 'pending',
      createdAt: serverTimestamp(),
    };

    await setDoc(docRef, newCommunity);
    
    // Auto update profile as president of this new community
    await updateProfile({
      communityId: commId,
      flatNumber: data.flatNumber,
      role: 'president',
      isVerified: true
    });
  };

  return (
    <AuthContext.Provider value={{ user, profile, community, loading, signIn, signOut, updateProfile, createCommunity }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
