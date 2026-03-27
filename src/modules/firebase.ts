import path from 'path';
import admin from 'firebase-admin';
import { getMessaging, MulticastMessage } from 'firebase-admin/messaging';

const serviceAccountPath = path.join(__dirname, '..', '..', 'e-ticket-sy-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccountPath) });

export const fcm = getMessaging();
