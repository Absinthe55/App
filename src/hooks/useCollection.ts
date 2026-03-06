import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useCollection(collectionName: string, orderByField?: string, orderDirection: 'asc' | 'desc' = 'desc') {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    let q: any = collection(db, collectionName);
    if (orderByField) {
      q = query(q, orderBy(orderByField, orderDirection));
    }
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: any[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setData(items);
    });
    return () => unsubscribe();
  }, [collectionName, orderByField, orderDirection]);

  return data;
}
