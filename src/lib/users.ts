
export type UserRole = 'admin' | 'user';

export interface UserCredential {
  userId: string;
  passcode: string;
  role: UserRole;
  fullName: string;
  email: string;
}

export const MOCK_USERS: UserCredential[] = [
  {
    userId: "admin",
    passcode: "veiladmin",
    role: "admin",
    fullName: "System Administrator",
    email: "meet.arnesh@gmail.com"
  },
  {
    userId: "analyst_01",
    passcode: "veil_ana_88",
    role: "user",
    fullName: "Data Analyst Alpha",
    email: "analyst1@example.com"
  },
  {
    userId: "operative_x",
    passcode: "veil_op_z9",
    role: "user",
    fullName: "Field Operative Xray",
    email: "opx@example.com"
  }
];

export function validateUser(userId: string, passcode: string): UserCredential | null {
  return MOCK_USERS.find(u => u.userId === userId && u.passcode === passcode) || null;
}
