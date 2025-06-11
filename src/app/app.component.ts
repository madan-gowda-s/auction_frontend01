import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // ✅ Make sure this is imported

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule], // ✅ RouterModule must be here
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  userName: string = '';
  isLoggedIn: boolean = false;

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload: any = JSON.parse(atob(token.split('.')[1]));
        this.userName = payload.name || '';
        this.isLoggedIn = true;
      } catch (e) {
        console.error('Invalid token:', e);
      }
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    this.userName = '';
    this.isLoggedIn = false;
  }
}
