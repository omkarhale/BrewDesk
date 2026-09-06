// Temporary password storage (in-memory only)
// This is used to pass the login password to the change-password page
// without storing it in localStorage or other persistent storage
let temporaryPassword: string | null = null

export function setTemporaryPassword(password: string) {
  temporaryPassword = password
}

export function clearTemporaryPassword() {
  temporaryPassword = null
}

export function getTemporaryPassword(): string | null {
  return temporaryPassword
}
