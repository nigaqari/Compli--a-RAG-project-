const API_BASE = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'reviewer' | 'employee';
  is_active: boolean;
  created_at?: string;
}

export interface AuthSuccess {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginResponse {
  status: 'otp_required';
  requires_otp: boolean;
  pending_token: string;
  masked_email: string;
  email: string;
  message: string;
}

export interface ResendResponse {
  pending_token: string;
  masked_email: string;
  message: string;
}

export function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('compli_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseResponse<T>(res: Response, defaultErrMsg: string): Promise<T> {
  const text = await res.text().catch(() => '');
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    // Response was not JSON
  }

  if (!res.ok) {
    const errorDetail = json?.detail || (typeof json === 'string' ? json : null) || text || `${defaultErrMsg} (${res.status})`;
    throw new Error(errorDetail);
  }

  return json as T;
}

export const authApi = {
  signup: async (fullName: string, email: string, password: string): Promise<User> => {
    const res = await fetch(`${API_BASE}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName, email, password })
    });
    return parseResponse<User>(res, 'Failed to create account');
  },

  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return parseResponse<LoginResponse>(res, 'Login failed');
  },

  verifyOtp: async (pendingToken: string, otpCode: string): Promise<AuthSuccess> => {
    const res = await fetch(`${API_BASE}/api/v1/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pending_token: pendingToken, otp_code: otpCode })
    });
    const data = await parseResponse<AuthSuccess>(res, 'Invalid verification code');

    // Save token & user in localStorage
    if (typeof window !== 'undefined' && data.access_token) {
      localStorage.setItem('compli_token', data.access_token);
      localStorage.setItem('compli_user', JSON.stringify(data.user));
    }
    return data;
  },

  resendOtp: async (pendingToken: string): Promise<ResendResponse> => {
    const res = await fetch(`${API_BASE}/api/v1/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pending_token: pendingToken })
    });
    return parseResponse<ResendResponse>(res, 'Failed to resend code');
  },

  getMe: async (): Promise<User> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('compli_token') : null;
    const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return parseResponse<User>(res, 'Unauthorized');
  },

  updateProfile: async (fullName: string): Promise<User> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('compli_token') : null;
    const res = await fetch(`${API_BASE}/api/v1/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ full_name: fullName })
    });
    const data = await parseResponse<User>(res, 'Failed to update profile');
    if (typeof window !== 'undefined') {
      localStorage.setItem('compli_user', JSON.stringify(data));
    }
    return data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('compli_token') : null;
    const res = await fetch(`${API_BASE}/api/v1/auth/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
    });
    return parseResponse<{ message: string }>(res, 'Failed to change password');
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('compli_token');
      localStorage.removeItem('compli_user');
      window.location.href = '/login';
    }
  },

  getCurrentUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('compli_user');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
};
