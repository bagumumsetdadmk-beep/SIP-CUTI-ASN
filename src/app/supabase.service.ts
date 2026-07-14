import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = environment.supabaseUrl;
    const supabaseKey = environment.supabaseKey;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase URL atau Key belum dikonfigurasi pada environment.');
    }

    // Inisialisasi client Supabase
    this.supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder-key');
  }

  /**
   * Mendapatkan instance SupabaseClient untuk digunakan oleh service lain
   */
  getClient(): SupabaseClient {
    return this.supabase;
  }
}
