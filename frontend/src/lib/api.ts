const API_BASE_URL = import.meta.env.PROD 
  ? 'https://your-backend-app.vercel.app/api/v1'
  : 'http://localhost:3000/api/v1';

  
class ApiClient {
  private getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem('auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...options.headers,
      },
      ...options,
    };

    // Add body only for methods that support it
    if (options.body) {
      config.body = options.body;
    }

    try {
      const response = await fetch(url, config);
      
      // Handle empty responses (like 204 No Content)
      if (response.status === 204) {
        return {} as T;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `API request failed: ${response.statusText}`);
      }

      return data.data || data as T;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  // Dashboard
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  // Assets
  async getAssets(params?: {
    status?: string;
    category?: string;
    search?: string; // ADDED: Missing search parameter
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const query = searchParams.toString();
    return this.request(`/assets${query ? `?${query}` : ''}`);
  }

  async getAsset(id: string) {
    return this.request(`/assets/${id}`);
  }

  async createAsset(data: any) {
    return this.request('/assets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAsset(id: string, data: any) {
    return this.request(`/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAsset(id: string) {
    return this.request(`/assets/${id}`, {
      method: 'DELETE',
    });
  }

  // Vendors - FIXED: Handle "all" filter
  async getVendors(params?: {
    specialization?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        // Skip "all" value for specialization filter
        if (value !== undefined && value !== '' && value !== null && value !== 'all') {
          searchParams.append(key, value.toString());
        }
      });
    }
    const query = searchParams.toString();
    return this.request(`/vendors${query ? `?${query}` : ''}`);
  }

  async createVendor(data: any) {
    return this.request('/vendors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateVendor(id: string, data: any) {
    return this.request(`/vendors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteVendor(id: string) {
    return this.request(`/vendors/${id}`, {
      method: 'DELETE',
    });
  }

  async getVendor(id: string) {
    return this.request(`/vendors/${id}`);
  }

  // Assignments
  async getAssignments(params?: {
    status?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const query = searchParams.toString();
    return this.request(`/assignments${query ? `?${query}` : ''}`);
  }

  async createAssignment(data: any) {
    return this.request('/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAssignment(id: string) {
    return this.request(`/assignments/${id}`);
  }

  async returnAssignment(id: string, data: { reason: string }) {
    return this.request(`/assignments/${id}/return`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Maintenance
  async getMaintenance(params?: {
    status?: string;
    assetId?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const query = searchParams.toString();
    return this.request(`/maintenance${query ? `?${query}` : ''}`);
  }

  async createMaintenance(data: any) {
    return this.request('/maintenance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMaintenanceRecord(id: string) {
    return this.request(`/maintenance/${id}`);
  }

  async updateMaintenance(id: string, data: any) {
    return this.request(`/maintenance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Users
  async getUsers(params?: {
    role?: string;
    department?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const query = searchParams.toString();
    return this.request(`/users${query ? `?${query}` : ''}`);
  }

  async createUser(data: any) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUser(id: string) {
    return this.request(`/users/${id}`);
  }

  async updateUser(id: string, data: any) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async getUserProfile() {
    return this.request('/users/profile');
  }

  async updateProfile(data: any) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Reports
  async getMaintenanceDueReport(days?: number) {
    return this.request(`/reports/maintenance-due${days ? `?days=${days}` : ''}`);
  }

  async getWarrantyExpiryReport(days?: number) {
    return this.request(`/reports/warranty-expiry${days ? `?days=${days}` : ''}`);
  }

  async getInventorySummaryReport() {
    return this.request('/reports/inventory-summary');
  }

  async getComplianceReport() {
    return this.request('/reports/compliance');
  }

  // Audit Logs
  async getAuditLogs(params?: {
    entityType?: string;
    action?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const query = searchParams.toString();
    return this.request(`/audit-logs${query ? `?${query}` : ''}`);
  }
}

export const api = new ApiClient();