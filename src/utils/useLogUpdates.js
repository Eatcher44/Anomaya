// src/utils/useLogUpdates.js
import { useEffect } from 'react';
import * as Updates from 'expo-updates';

export function useLogUpdates() {
  useEffect(() => {
    (async () => {
      try {
        console.log('[Updates.channel]', Updates.channel);
        console.log('[Updates.runtimeVersion]', Updates.runtimeVersion);
        console.log('[Updates.updateId]', Updates.updateId);
        const update = await Updates.checkForUpdateAsync();
        console.log('[Updates.checkForUpdateAsync]', update);
      } catch (e) {
        console.log('[Updates.error]', e);
      }
    })();
  }, []);
}
