import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type ResourceState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export function useApiResource<T>(path: string) {
  const [state, setState] = useState<ResourceState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;
    getJson<T>(path)
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            data: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      });

    return () => {
      active = false;
    };
  }, [path]);

  return state;
}
