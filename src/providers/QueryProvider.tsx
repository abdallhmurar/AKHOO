import { AppState } from 'react-native'
import type { AppStateStatus } from 'react-native'
import * as Network from 'expo-network'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { focusManager, MutationCache, onlineManager, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { reportAppError } from '../services/errors'

type NetworkContextValue = { isOnline: boolean; isInternetReachable: boolean | null }
const NetworkContext = createContext<NetworkContextValue>({ isOnline: true, isInternetReachable: null })

function onAppStateChange(status: AppStateStatus) {
  focusManager.setFocused(status === 'active')
}

export function QueryProvider({ children }: PropsWithChildren) {
  const [network, setNetwork] = useState<NetworkContextValue>({ isOnline: true, isInternetReachable: null })
  const client = useMemo(() => new QueryClient({
    queryCache: new QueryCache({ onError: error => reportAppError(error, { domain: 'query', operation: 'fetch' }) }),
    mutationCache: new MutationCache({ onError: error => reportAppError(error, { domain: 'query', operation: 'mutation' }) }),
    defaultOptions: {
      queries: { staleTime: 30_000, gcTime: 10 * 60_000, retry: (count, error: any) => error?.code !== 'forbidden' && error?.code !== 'auth' && count < 2, refetchOnReconnect: true },
      mutations: { retry: 0 }
    }
  }), [])

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener('change', onAppStateChange)
    const applyNetwork = (state: Network.NetworkState) => {
      const isOnline = state.isConnected !== false && state.isInternetReachable !== false
      setNetwork({ isOnline, isInternetReachable: state.isInternetReachable ?? null })
      onlineManager.setOnline(isOnline)
    }
    Network.getNetworkStateAsync().then(applyNetwork).catch(() => {})
    const networkSubscription = Network.addNetworkStateListener(applyNetwork)
    return () => { appStateSubscription.remove(); networkSubscription.remove() }
  }, [])

  return <NetworkContext.Provider value={network}><QueryClientProvider client={client}>{children}</QueryClientProvider></NetworkContext.Provider>
}

export function useNetworkStatus() {
  return useContext(NetworkContext)
}
