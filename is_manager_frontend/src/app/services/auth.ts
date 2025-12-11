import { Injectable, inject, PLATFORM_ID } from '@angular/core'; // Import PLATFORM_ID
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment.prod';
import { isPlatformBrowser } from '@angular/common'; // Import this check

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl =  `${environment.apiUrl}/tasks/`;
  
  // This helps us know if we are on the Server or the Browser
  private platformId = inject(PLATFORM_ID);

  login(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}token/`, data).pipe(
      tap((response: any) => {
        if (response.access && isPlatformBrowser(this.platformId)) {
          localStorage.setItem('access_token', response.access);
        }
      })
    );
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}register/`, data);
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('access_token');
    }
  }

  isLoggedIn(): boolean {
    // ONLY check localStorage if we are in the browser
    if (isPlatformBrowser(this.platformId)) {
      return !!localStorage.getItem('access_token');
    }
    return false; // If on server, assume not logged in
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('access_token');
    }
    return null;
  }
}