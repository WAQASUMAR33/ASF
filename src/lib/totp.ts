import { authenticator } from 'otplib';
import QRCode from 'qrcode';

authenticator.options = {
  window: 1, // Allow 30s clock drift tolerance
};

export function generate2FASecret(username: string) {
  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(username, 'ASF-IMS (Airports Security Force)', secret);
  return { secret, otpauth };
}

export async function generateQRCodeDataURL(otpauth: string): Promise<string> {
  return await QRCode.toDataURL(otpauth);
}

export function verify2FAToken(token: string, secret: string): boolean {
  try {
    return authenticator.check(token, secret);
  } catch (error) {
    return false;
  }
}

export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = Math.floor(10000000 + Math.random() * 90000000).toString();
    codes.push(code);
  }
  return codes;
}
