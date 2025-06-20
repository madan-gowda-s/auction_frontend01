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

 // Lifecycle hook to manually check for changes.

export class AppComponent implements DoCheck {
  title = 'auctionfrontend';
  userName: string = '';
  userRole: string = '';
  isLoggedIn: boolean = false;

 // Injects Angular's Router service.
 
  constructor(private router: Router) {}
 
  ngDoCheck(): void 
  {
    const token = localStorage.getItem('token');
 
    if (token) 
    {
      try      
      {
        // Decodes JWT structure: header.payload.signature
        const payload: any = JSON.parse(atob(token.split('.')[1]));
        const nameClaim = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name";
        const roleClaim = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
 
        // Updates component state based on token.
        this.userName = payload[nameClaim] || '';
        this.userRole = payload[roleClaim] || '';
        this.isLoggedIn = true;
      } 
      catch (e)      
      {
        console.error('Invalid token:', e);
        this.logout(); 
      }
    } 
    else 
    {
      this.isLoggedIn = false;
      this.userName = '';
      this.userRole = '';
    }
  }

  // Clears session and navigates to login.
  logout(): void 
  {
    localStorage.removeItem('token');
    this.userName = '';
    this.userRole = '';
    this.isLoggedIn = false;
    this.router.navigate(['/login']);
  }
}
 