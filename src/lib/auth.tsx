import { getCurrentUser } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import React, { createContext, useContext, useEffect, useState } from 'react';

import './amplify'; // ensure Amplify.configure has run before any auth call

type AuthState = {
  userId: string | null;
  loading: boolean;
};

const AuthContext = createContext<AuthState>({ userId: null, loading: true });

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then((u) => setUserId(u.userId))
      .catch(() => setUserId(null))
      .finally(() => setLoading(false));

    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signedIn') {
        getCurrentUser()
          .then((u) => setUserId(u.userId))
          .catch(() => setUserId(null));
      } else if (payload.event === 'signedOut') {
        setUserId(null);
      }
    });
    return unsubscribe;
  }, []);

  return <AuthContext.Provider value={{ userId, loading }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
