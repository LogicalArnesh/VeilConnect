export type UserRole = 'head_admin' | 'admin' | 'user' | 'pending';

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

export const HEAD_ADMIN_EMAIL = "meet.arnesh@gmail.com";

export const MOCK_USERS: UserCredential[] = [
  {
    userId: "ArneshBarik",
    passcode: "veilowner77",
    role: "head_admin",
    fullName: "Arnesh Barik",
    email: HEAD_ADMIN_EMAIL,
    status: "active"
  },
  {
    userId: "Makerov_61",
    passcode: "admin123",
    role: "admin",
    fullName: "Operational Admin",
    email: "admin.veil@example.com",
    status: "active"
  }
];

export function validateUser(userId: string, passcode: string): UserCredential | null {
  const user = MOCK_USERS.find(u => u.userId === userId && u.passcode === passcode);
  return user || null;
}
