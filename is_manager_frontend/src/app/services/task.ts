import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // Import HttpHeaders
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';
import { AuthService } from './auth'; // Import AuthService

export interface Task {
  id?: number;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private http = inject(HttpClient);
  private authService = inject(AuthService); // Inject Auth
  private apiUrl = `${environment.apiUrl}/tasks/`;

  // Helper to create headers with the token
  private getHeaders() {
    const token = this.authService.getToken();
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}` // The magic password Django expects
      })
    };
  }

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(this.apiUrl, this.getHeaders());
  }

  createTask(task: Task): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, task, this.getHeaders());
  }

  updateTaskStatus(taskId: number, newStatus: string): Observable<Task> {
    return this.http.patch<Task>(`${this.apiUrl}${taskId}/`, { status: newStatus }, this.getHeaders());
  }

  deleteTask(taskId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${taskId}/`, this.getHeaders());
  }
}