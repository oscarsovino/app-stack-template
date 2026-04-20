import { MMKV } from "react-native-mmkv"

const backing = new MMKV({ id: "app-stack-mobile" })

export const storage = {
  getString: (key: string) => backing.getString(key),
  setString: (key: string, value: string) => backing.set(key, value),
  getBoolean: (key: string) => backing.getBoolean(key),
  setBoolean: (key: string, value: boolean) => backing.set(key, value),
  getNumber: (key: string) => backing.getNumber(key),
  setNumber: (key: string, value: number) => backing.set(key, value),
  delete: (key: string) => backing.delete(key),
  clearAll: () => backing.clearAll(),
}
