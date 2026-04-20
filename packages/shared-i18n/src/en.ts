export type Translations = {
  common: {
    ok: string
    cancel: string
    save: string
    delete: string
    loading: string
    error: string
  }
  auth: {
    signIn: string
    signOut: string
    email: string
    password: string
  }
}

const en: Translations = {
  common: {
    ok: "OK",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    loading: "Loading...",
    error: "Something went wrong",
  },
  auth: {
    signIn: "Sign in",
    signOut: "Sign out",
    email: "Email",
    password: "Password",
  },
}

export default en
