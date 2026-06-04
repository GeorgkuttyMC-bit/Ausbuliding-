import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export function useApplicationState(key: string, hospitalName: string, location: string) {
  const { user, loading } = useAuth();
  const [isApplied, setIsApplied] = useState(false);
  const [loadingState, setLoadingState] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (user) {
      // Check Firebase
      const checkFirebase = async () => {
        try {
          const docRef = doc(db, 'users', user.uid, 'applications', key);
          const docSnap = await getDoc(docRef);
          setIsApplied(docSnap.exists());
        } catch (error) {
          console.error("Failed to fetch application state", error);
        } finally {
          setLoadingState(false);
        }
      };
      checkFirebase();
    } else {
      // Fallback to local storage
      const stored = localStorage.getItem(key);
      if (stored === 'true') {
        setIsApplied(true);
      } else {
        setIsApplied(false);
      }
      setLoadingState(false);
    }
  }, [key, user, loading]);

  const toggleApplied = async () => {
    const newValue = !isApplied;
    // Optimistic update
    setIsApplied(newValue);

    if (user) {
      try {
        const docRef = doc(db, 'users', user.uid, 'applications', key);
        if (newValue) {
          await setDoc(docRef, {
            userId: user.uid,
            hospitalName,
            location,
            appliedAt: 1
          });
        } else {
          await deleteDoc(docRef);
        }
      } catch (error) {
        console.error("Failed to update application", error);
        setIsApplied(!newValue); // Revert on failure
        alert('Failed to save state to cloud.');
      }
    } else {
      // Fallback to local storage
      localStorage.setItem(key, String(newValue));
    }
  };

  return { isApplied, toggleApplied, loadingState };
}
