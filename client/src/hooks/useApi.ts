import { useCallback } from 'react';

export function useApi() {
  const post = useCallback(async (url: string, body?: object) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.json();
  }, []);

  const put = useCallback(async (url: string, body?: object) => {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.json();
  }, []);

  const del = useCallback(async (url: string) => {
    const res = await fetch(url, { method: 'DELETE' });
    return res.json();
  }, []);

  return { post, put, del };
}
