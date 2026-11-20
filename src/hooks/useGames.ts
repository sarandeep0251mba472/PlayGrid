import { useEffect, useState } from 'react';
import { GameMatch } from '../types';
import { subscribeToHostedGames, subscribeToPublicGames } from '../services/gameService';

export function usePublicGames() {
  const [games, setGames] = useState<GameMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToPublicGames(
      (list) => {
        setGames(list);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setLoading(false);
        setError(err instanceof Error ? err.message : 'Unable to load campus matches.');
      }
    );
    return () => unsub();
  }, []);

  return { games, loading, error };
}

export function useHostedGames(hostId: string | undefined) {
  const [hostedGames, setHostedGames] = useState<GameMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hostId) {
      setHostedGames([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeToHostedGames(
      hostId,
      (list) => {
        setHostedGames(list);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );
    return () => unsub();
  }, [hostId]);

  return { hostedGames, loading };
}
