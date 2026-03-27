import { JwtPayload } from 'jsonwebtoken';

export interface NormalUserPayload extends JwtPayload {
  userId: number;
  mobileNumber: string;
  issuer: string;
}

export interface AdminPayload extends JwtPayload {
  userId: number;
  email: string;
  issuer: string;
}

export interface SupervisorPayload extends JwtPayload {
  userId: number;
  username: string;
  issuer: string;
}

export interface ScannerUserPayload extends JwtPayload {
  userId: number;
  name: string;
  issuer: string;
}
