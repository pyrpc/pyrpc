'use client';

import { api } from '@/lib/pyrpc';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return <api.Provider>{children}</api.Provider>;
}
