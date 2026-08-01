export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  avatarUrl: string;
  provider: 'LOCAL' | 'GOOGLE';
  eloRating: number;
  skillLevelSelected?: boolean;
  skillLevel?: string;
  gamesPlayed?: number;
  wins?: number;
}

export interface LoginCredentials {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  name?: string;
}

export interface GoogleAuthPayload {
  googleToken?: string;
  googleId?: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}
