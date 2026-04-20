import { create } from "zustand"
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware"
import { MMKV } from "react-native-mmkv"

const backing = new MMKV({ id: "zustand-auth" })

const mmkvStorage: StateStorage = {
  getItem: (key) => backing.getString(key) ?? null,
  setItem: (key, value) => backing.set(key, value),
  removeItem: (key) => backing.delete(key),
}

type AuthState = {
  userId: string | null
  setUserId: (id: string | null) => void
  signOut: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userId: null,
      setUserId: (userId) => set({ userId }),
      signOut: () => set({ userId: null }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
)
