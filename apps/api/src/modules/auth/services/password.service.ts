let timingHash: Promise<string> | null = null;

export class PasswordService {
  static hash(password: string): Promise<string> {
    return Bun.password.hash(password, { algorithm: "argon2id" });
  }

  static verify(password: string, hash: string): Promise<boolean> {
    return Bun.password.verify(password, hash);
  }

  // Verifies against a throwaway hash so unknown emails take as long as wrong passwords.
  static async burnVerifyTime(password: string): Promise<void> {
    timingHash ??= PasswordService.hash("timing-equalizer-password");
    await Bun.password.verify(password, await timingHash);
  }
}
