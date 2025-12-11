import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment.prod';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  // 1. Point to the base API url (e.g. 'https://.../api')
  // REMOVE '/tasks/' from here!
  private baseUrl = environment.apiUrl; 

  login(data: any): Observable<any> {
    // 2. Add the specific endpoint here: /token/
    // Result: https://.../api/token/
    return this.http.post(`${this.baseUrl}/token/`, data).pipe(
      tap((response: any) => {
        if (response.access && isPlatformBrowser(this.platformId)) {
          localStorage.setItem('access_token', response.access);
        }
      })
    );
  }

  register(data: any): Observable<any> {
    // 3. Add the specific endpoint here: /register/
    // Result: https://.../api/register/
    return this.http.post(`${this.baseUrl}/register/`, data);
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('access_token');
    }
  }

  isLoggedIn(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!localStorage.getItem('access_token');
    }
    return false;
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('access_token');
    }
    return null;
  }
}