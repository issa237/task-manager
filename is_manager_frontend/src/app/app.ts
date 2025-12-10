import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import {  PLATFORM_ID } from '@angular/core'; // Add PLATFORM_ID
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TaskService, Task } from './services/task';
import { AuthService } from './services/auth'; // Import Auth
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule, DragDropModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  title = 'TaskManager';
  currentUser: string = '';
  currentQuote: string = '';
  private quoteInterval: any;
  private taskService = inject(TaskService);
  public authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  private cd = inject(ChangeDetectorRef);

  quotes: string[] = [
    "The only way to do great work is to love what you do.",
    "Believe you can and you're halfway there.",
    "Your limitation—it's only your imagination.",
    "Push yourself, because no one else is going to do it for you.",
    "Great things never come from comfort zones.",
    "Dream it. Wish it. Do it.",
    "Success doesn’t just find you. You have to go out and get it.",
    "The harder you work for something, the greater you'll feel when you achieve it.",
    "Don't stop when you're tired. Stop when you're done."
  ];

  todo: Task[] = [];
  inProgress: Task[] = [];
  done: Task[] = [];

  newTaskTitle: string = '';

  // Auth State
  showLoginModal = false;
  isRegistering = false;
  username = '';
  password = '';
  authError = '';

ngOnInit() {
    // 2. Only run this logic if we are in the BROWSER
    
    this.updateQuote();

    if (isPlatformBrowser(this.platformId)) {
      // 2. Set up the 30-second timer
      this.quoteInterval = setInterval(() => {
        this.updateQuote();
        this.cd.detectChanges(); // Force screen update
      }, 30000);
      if (this.authService.isLoggedIn()) {
        this.currentUser = localStorage.getItem('username') || 'User';
        this.fetchTasks();
      } else {
        this.showLoginModal = true;
      }

    }
  }

ngOnDestroy() {
    if (this.quoteInterval) {
      clearInterval(this.quoteInterval);
    }
  }

  updateQuote() {
    const randomIndex = Math.floor(Math.random() * this.quotes.length);
    this.currentQuote = this.quotes[randomIndex];
  }

// --- AUTH ACTIONS ---

  onLogin() {
    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: () => {

       this.currentUser = this.username; 
        if (isPlatformBrowser(this.platformId)) {
           localStorage.setItem('username', this.username);
        }

        this.showLoginModal = false;
        this.fetchTasks();
        this.username = '';
        this.password = '';
        this.authError = '';
      },
      error: (err) => {
        console.error(err);
        this.authError = 'Invalid username or password';
      }
    });
  }

  onRegister() {
    this.authService.register({ username: this.username, password: this.password }).subscribe({
      next: () => {
        // After register, immediately login
        this.onLogin();
      },
      error: (err) => {
        console.error(err);
        this.authError = 'Registration failed. Try a different username.';
      }
    });
  }

  logout() {
    this.authService.logout();

    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('username');
    }
    this.currentUser = '';

    this.showLoginModal = true;
    this.todo = [];
    this.inProgress = [];
    this.done = [];
  }


  // --- FIX #1: Add this function ---
  // This prevents the "freeze" by helping Angular track items by ID instead of index
  trackById(index: number, item: Task): any {
    return item.id; 
  }

  fetchTasks() {
    this.taskService.getTasks().subscribe({
      next: (data) => {
        this.todo = []; 
        this.inProgress = []; 
        this.done = [];
        
        data.forEach(task => {
          if (task.status === 'todo') this.todo.push(task);
          else if (task.status === 'in_progress') this.inProgress.push(task);
          else if (task.status === 'done') this.done.push(task);
        });

        // FORCE SCREEN UPDATE
        this.cd.detectChanges(); // <--- Add this line!
      },
      error: (err) => {
        console.error(err);
        if (err.status === 401) this.logout();
      }
    });
  }

 addTask() {
    if (!this.newTaskTitle.trim()) return;

    const newTask: Task = { 
      title: this.newTaskTitle, 
      description: '', 
      status: 'todo' 
    };

    this.taskService.createTask(newTask).subscribe({
      next: (createdTask) => {
        // FORCE UPDATE: Create a new array with the new task added
        this.todo = [...this.todo, createdTask]; 
        
        this.newTaskTitle = ''; // Clear input
      },
      error: (err) => console.error('Error creating task:', err)
    });
  }

  drop(event: CdkDragDrop<Task[]>) {
    // Check if the lists are defined before doing anything
    if (!event.container.data || !event.previousContainer.data) {
      return;
    }

    if (event.previousContainer === event.container) {
      // Reordering in the same list
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Moving between lists
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      
      // Force Angular to detect changes manually (sometimes needed for complex drag/drop)
      this.todo = [...this.todo];
      this.inProgress = [...this.inProgress];
      this.done = [...this.done];

      const movedTask = event.container.data[event.currentIndex];
      
      // 2. Determine the new status based on the column ID we set in HTML
      // Note: We need to assign IDs to our HTML lists for this to work perfectly, 
      // or we can infer it from the array logic.
      
      let newStatus: 'todo' | 'in_progress' | 'done' = 'todo'; // Default
      
      if (event.container.id === 'todoList') newStatus = 'todo';
      else if (event.container.id === 'progressList') newStatus = 'in_progress';
      else if (event.container.id === 'doneList') newStatus = 'done';

      // 3. Send update to Django
      if (movedTask.id) {
        this.taskService.updateTaskStatus(movedTask.id, newStatus).subscribe({
          next: (response) => console.log('Saved to Django:', response),
          error: (err) => console.error('Save failed:', err)
        });
      }
    }
  }

  deleteTask(task: Task) {
    if (!task.id) return;
    
    // Optimistic update: Remove it from the UI immediately
    if (task.status === 'todo') this.todo = this.todo.filter(t => t.id !== task.id);
    else if (task.status === 'in_progress') this.inProgress = this.inProgress.filter(t => t.id !== task.id);
    else if (task.status === 'done') this.done = this.done.filter(t => t.id !== task.id);

    // Then tell the server
    this.taskService.deleteTask(task.id).subscribe({
      error: (err) => {
        console.error('Delete failed, reloading tasks', err);
        this.fetchTasks(); // Revert if server failed
      }
    });
  }
}