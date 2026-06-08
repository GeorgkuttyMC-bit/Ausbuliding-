import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { User, onAuthStateChanged, signInAnonymously, signOut, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithName: (name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithName: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Ensure user profile exists in Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userRef);
        if (!docSnap.exists()) {
          await setDoc(userRef, { name: currentUser.displayName || 'Anonymous' });
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithName = async (name: string) => {
    setLoading(true);
    try {
      // We will use anonymous auth to get a valid Firebase UID
      const result = await signInAnonymously(auth);
      await updateProfile(result.user, { displayName: name });
      
      const userRef = doc(db, 'users', result.user.uid);
      await setDoc(userRef, { name: name });
      
      setUser({ ...result.user, displayName: name } as User);
    } catch (error: any) {
      console.error('Error logging in', error);
      if (error.code === 'auth/admin-restricted-operation' || error.code === 'auth/operation-not-allowed') {
        alert('Action Required: Please enable "Anonymous Auth" in your Firebase Project Console under Build -> Authentication -> Sign-in method.');
      } else {
        alert(`Login failed: ${error?.message || 'Please try again.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error logging out', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithName, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
