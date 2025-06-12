import { Component, DoCheck } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
 
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements DoCheck {
  userName: string = '';
  userRole: string = '';
  isLoggedIn: boolean = false;
 
  constructor(private router: Router) {}
 
  ngDoCheck(): void {
    const token = localStorage.getItem('token');
 
    if (token) {
      try {
        const payload: any = JSON.parse(atob(token.split('.')[1]));
        const nameClaim = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name";
        const roleClaim = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
 
        this.userName = payload[nameClaim] || '';
        this.userRole = payload[roleClaim] || '';
        this.isLoggedIn = true;
      } catch (e) {
        console.error('Invalid token:', e);
        this.logout(); // optional: reset state on bad token
      }
    } else {
      this.isLoggedIn = false;
      this.userName = '';
      this.userRole = '';
    }
  }
 
  logout(): void {
    localStorage.removeItem('token');
    this.userName = '';
    this.userRole = '';
    this.isLoggedIn = false;
    this.router.navigate(['/login']);
  }
}
 