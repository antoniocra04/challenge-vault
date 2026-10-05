/** An error whose message is safe and meant to be shown to the user. */
export class VaultError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "VaultError"
  }
}
