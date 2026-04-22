
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
    userId: "arnesh",
    passcode: "veilowner77",
    role: "head_admin",
    fullName: "Arnesh Barik",
    email: HEAD_ADMIN_EMAIL,
    status: "active"
  }
];

export function validateUser(userId: string, passcode: string): UserCredential | null {
  // Head admin check (mock)
  if (userId === "arnesh" && passcode === "veilowner77") return MOCK_USERS[0];
  return null;
}
