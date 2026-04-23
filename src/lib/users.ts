export type UserRole = 'HeadAdmin' | 'admin' | 'promoter' | 'manager' | 'CC' | 'Data Collector' | 'pending';

export interface UserCredential {
  userId: string;
  passcode: string;
  role: UserRole;
  fullName: string;
  email: string;
  status: 'active' | 'pending' | 'denied';
  about?: string;
  photoUrl?: string;
}

export const HEAD_ADMIN_EMAIL = "veilconfessions@gmail.com";

export const MOCK_USERS: UserCredential[] = [
  {
    userId: "VeilOfficial",
    passcode: "6767",
    role: "HeadAdmin",
    fullName: "Veil Official Command",
    email: HEAD_ADMIN_EMAIL,
    status: "active"
  }
];

export function validateUser(userId: string, passcode: string): UserCredential | null {
  const user = MOCK_USERS.find(u => u.userId === userId && u.passcode === passcode);
  return user || null;
}
