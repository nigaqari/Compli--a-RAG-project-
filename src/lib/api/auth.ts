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
  email: string;
  message: string;
}

export const authApi = {
  signup: async (fullName: string, email: string, password: string): Promise<User> => {
    const res = await fetch(`${API_BASE}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Signup failed');
    return data;
  },

  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Login failed');
    return data;
  },

  verifyOtp: async (email: string, otpCode: string): Promise<AuthSuccess> => {
    const res = await fetch(`${API_BASE}/api/v1/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp_code: otpCode })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Invalid verification code');

    // Save token & user in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('compli_token', data.access_token);
      localStorage.setItem('compli_user', JSON.stringify(data.user));
    }
    return data;
  },

  resendOtp: async (email: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/api/v1/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to resend code');
    return data;
  },

  getMe: async (): Promise<User> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('compli_token') : null;
    const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error('Unauthorized');
    return res.json();
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
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to update profile');
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
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to change password');
    return data;
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
