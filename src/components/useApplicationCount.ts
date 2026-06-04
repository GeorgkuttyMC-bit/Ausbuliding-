import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export function useApplicationCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }

    const q = query(collection(db, 'users', user.uid, 'applications'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCount(snapshot.size);
    }, (error) => {
      console.error("Failed to fetch application count", error);
    });

    return unsubscribe;
  }, [user]);

  return count;
}
