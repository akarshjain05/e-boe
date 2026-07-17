import api from '../axios';

export interface Product {
  id: string;
  name: string;
  description?: string;
  hsn_code?: string;
  unit?: string;
  unit_price: number;
  tax_rate: number;
  is_active: boolean;
  created_at: string;
}

export interface ProductCreate {
  name: string;
  description?: string;
  hsn_code?: string;
  unit?: string;
  unit_price?: number;
  tax_rate?: number;
  is_active?: boolean;
}

export interface ProductUpdate {
  name?: string;
  description?: string;
  hsn_code?: string;
  unit?: string;
  unit_price?: number;
  tax_rate?: number;
  is_active?: boolean;
}

class ProductService {
  async getProducts(params?: { skip?: number; limit?: number; search?: string; type?: string }) {
    const response = await api.get<Product[]>('/products/', { params });
    return response.data;
  }

  async getProduct(id: string) {
    const response = await api.get<Product>(`/products/${id}`);
    return response.data;
  }

  async createProduct(data: ProductCreate) {
    const response = await api.post<Product>('/products/', data);
    return response.data;
  }

  async updateProduct(id: string, data: ProductUpdate) {
    const response = await api.put<Product>(`/products/${id}`, data);
    return response.data;
  }

  async deleteProduct(id: string) {
    const response = await api.delete<Product>(`/products/${id}`);
    return response.data;
  }

  async lookupHsn(code: string) {
    if (!code) return [];
    const response = await api.get<{hsn_cd: string, description: string}[]>('/products/hsn/lookup', {
      params: { code }
    });
    return response.data;
  }
}

export const productService = new ProductService();
