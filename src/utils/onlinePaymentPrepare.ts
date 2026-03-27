import { webcrypto } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
// const { v4: uuidv4 } = await import('uuid');

// import { ulid } from 'ulid';

export const generateGuid = (invoice: number, resend: boolean, count?: number): string => {
  const i = 1;
  if (!resend) return 'ETickets' + '_M_' + invoice + '_' + i;
  if (!count) return 'null';
  return 'ETickets' + invoice + '_' + ++count;
};

export const hashCode = async (code: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await webcrypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const base64 = Buffer.from(hashArray).toString('base64');
  return base64;
};

export const generateTransactionID = (): string => `ETickets_S_${uuidv4()}`;
