import { Timestamp } from 'firebase/firestore';

export interface Employee {
  id: string;
  name: string;
  rate: number;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  clockInTime: Date;
  clockInPhoto: string; // base64 data URL
  clockOutTime: Date | null;
  clockOutPhoto: string | null; // base64 data URL
  status: 'clocked-in' | 'clocked-out';
}

export interface FirestoreAttendanceRecord {
  employeeId: string;
  employeeName: string;
  clockInTime: Timestamp;
  clockInPhoto: string;
  clockOutTime: Timestamp | null;
  clockOutPhoto: string | null;
  status: 'clocked-in' | 'clocked-out';
}

export interface Message {
    type: 'success' | 'error';
    text: string;
}

export type Theme = 'light' | 'dark';

export type Schedule = Record<string, string[]>; // Key: 'YYYY-MM-DD', Value: Employee ID array