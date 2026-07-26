'use client';

import { useEffect, useState } from 'react';

export function useMountedTimestamp(): number | null {
  const [timestamp, setTimestamp] = useState<number | null>(null);

  useEffect(() => {
    setTimestamp(Date.now());
  }, []);

  return timestamp;
}
