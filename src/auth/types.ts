export interface AuthProvider {
  isAuthenticated(): Promise<boolean>;
  getToken(): Promise<string | null>;
  getSession(): Promise<any>;
}

export interface AuthToken {
  token: string;
  type: 'pat' | 'bearer' | 'device' | 'unknown';
}