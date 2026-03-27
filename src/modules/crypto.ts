import crypto, { generateKeyPairSync, createHash, sign, webcrypto } from 'crypto';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

export const hashCode = async (plainCode: string) => {
  const buffer = new TextEncoder().encode(plainCode);
  const hashBuffer = await webcrypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const base64 = Buffer.from(hashArray).toString('base64');
  return base64;
};
