import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { User, onAuthStateChanged, signInAnonymously, signOut, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithName: (name: string) => Promise<void>;
  googleSignIn: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithName: async () => {},
  googleSignIn: async () => {},
  logout: async () => {},
  getAccessToken: () => null,
});

export const useAuth = () => useContext(AuthContext);

let cachedAccessToken: string | null = null;
let isSigningIn = false;

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/gmail.send');

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && !currentUser.isAnonymous) {
        // Ensure user profile exists in Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userRef);
        if (!docSnap.exists()) {
          await setDoc(userRef, { name: currentUser.displayName || 'Anonymous' });
        }
      }
      
      if (!currentUser) {
        cachedAccessToken = null;
      } else if (!isSigningIn && currentUser.isAnonymous) {
         cachedAccessToken = null;
      }
      
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithName = async (name: string) => {
    setLoading(true);
    try {
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

  const googleSignIn = async () => {
    try {
      isSigningIn = true;
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        cachedAccessToken = credential.accessToken;
      }
      setUser(result.user);
    } catch (error: any) {
      console.error('Sign in with Google error:', error);
      throw error;
    } finally {
      isSigningIn = false;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      cachedAccessToken = null;
    } catch (error) {
      console.error('Error logging out', error);
    }
  };

  const getAccessTokenFn = () => cachedAccessToken;

  return (
    <AuthContext.Provider value={{ user, loading, loginWithName, googleSignIn, logout, getAccessToken: getAccessTokenFn }}>
      {children}
    </AuthContext.Provider>
  );
};
