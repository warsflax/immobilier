import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, Agency } from './types';

interface UserContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        setUser(currentUser);
        
        if (currentUser) {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            const masterEmails = ['hussamessmahi2@gmail.com', 'admin@chahin-immobilier.com', 'admin@manda.com'];
            
            // Force admin role and isActive for master emails
            if (masterEmails.includes(currentUser.email || '') && (data.role !== 'admin' || data.isActive !== true)) {
              const updatedProfile = { ...data, role: 'admin' as const, isActive: true };
              await setDoc(docRef, updatedProfile, { merge: true });
              setProfile(updatedProfile);
            } else {
              setProfile(data);
            }
          } else {
            // Create default profile for first-time login
            const masterEmails = ['hussamessmahi2@gmail.com', 'admin@chahin-immobilier.com', 'admin@manda.com'];
            const isMaster = masterEmails.includes(currentUser.email || '');
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              role: 'admin',
              isActive: isMaster // Only masters are active by default if they were just created here (though typically they'd be added by admin)
            };

            console.log("Creating new profile:", newProfile);
            await setDoc(docRef, newProfile);
            setProfile(newProfile);
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("CRITICAL: Error in UserProvider auth state change:", error);
        // Fallback for master admins if Firestore fails
        const masterEmails = ['hussamessmahi2@gmail.com', 'admin@chahin-immobilier.com', 'admin@manda.com'];
        if (currentUser?.email && masterEmails.includes(currentUser.email)) {
          console.log("Applying emergency fallback for master admin");
          setProfile({
            uid: currentUser.uid,
            email: currentUser.email,
            role: 'admin',
            isActive: true
          });
        } else {
          setProfile(null);
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    profile,
    loading,
    isAdmin: !!profile && profile.isActive,
    isSuperAdmin: profile?.email === 'admin@chahin-immobilier.com' || profile?.email === 'admin@manda.com' || profile?.email === 'hussamessmahi2@gmail.com',
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
