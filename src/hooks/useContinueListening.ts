import { useCallback, useEffect, useMemo, useState } from 'react';
import { getRecentProgress, ProgressRecord } from '../services/sqlite';
import { Sight } from '../types';

export type ContinueListeningItem = {
  sight: Sight;
  progress: ProgressRecord;
};

export const useContinueListening = (sights: Sight[]) => {
  const [items, setItems] = useState<ContinueListeningItem[]>([]);

  const refresh = useCallback(async () => {
    const progress = await getRecentProgress(6);
    const mapped: ContinueListeningItem[] = [];
    for (const p of progress) {
      const sight = sights.find((s) => s.id === p.sight_id);
      if (!sight) continue;
      mapped.push({ sight, progress: p });
    }
    setItems(mapped);
  }, [sights]);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const top = useMemo(() => items[0] ?? null, [items]);

  return { items, top, refresh };
};

