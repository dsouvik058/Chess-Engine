import type {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  GoogleAuthPayload,
  User,
} from '../types/auth';

const BASE_URL = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'chess_engine_auth_token';

export const authApi = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  async register(data: RegisterCredentials): Promise<AuthResponse> {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json: AuthResponse = await res.json();
      if (json.success && json.token) {
        this.setToken(json.token);
      }
      return json;
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Registration failed. Please check network.',
      };
    }
  },

  async login(data: LoginCredentials): Promise<AuthResponse> {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json: AuthResponse = await res.json();
      if (json.success && json.token) {
        this.setToken(json.token);
      }
      return json;
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Login failed. Please check server.',
      };
    }
  },

  async googleLogin(data: GoogleAuthPayload): Promise<AuthResponse> {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json: AuthResponse = await res.json();
      if (json.success && json.token) {
        this.setToken(json.token);
      }
      return json;
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Google OAuth failed.',
      };
    }
  },

  async setSkillLevel(eloRating: number, skillLevel: string): Promise<AuthResponse> {
    const token = this.getToken();
    try {
      const res = await fetch(`${BASE_URL}/api/auth/set-skill-level`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ eloRating, skillLevel }),
      });
      const json: AuthResponse = await res.json();
      return json;
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to update skill level.',
      };
    }
  },

  async updateGameStats(newElo: number, isWin: boolean): Promise<AuthResponse> {
    const token = this.getToken();
    try {
      const res = await fetch(`${BASE_URL}/api/auth/update-stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newElo, isWin }),
      });
      const json: AuthResponse = await res.json();
      return json;
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to update user stats.',
      };
    }
  },

  async getCurrentUser(): Promise<User | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const res = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        this.removeToken();
        return null;
      }
      const data = await res.json();
      return data.success ? data.user : null;
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    const token = this.getToken();
    if (token) {
      try {
        await fetch(`${BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Ignore network error on logout
      }
    }
    this.removeToken();
  },
};
