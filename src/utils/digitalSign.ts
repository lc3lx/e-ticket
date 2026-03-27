import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const privateKey = fs.readFileSync(path.join(__dirname, '..', 'common', 'keys', 'private-key.pem'), 'utf-8');

export const digitalSign = async (jsonBody: any) => {
  const data = Buffer.from(jsonBody, 'utf-8');

  const signature = crypto.sign('sha256', data, {
    key: privateKey,
    passphrase: 'etickets-test-passphrase',
    padding: crypto.constants.RSA_PKCS1_PADDING,
  });

  return signature.toString('base64');
};
