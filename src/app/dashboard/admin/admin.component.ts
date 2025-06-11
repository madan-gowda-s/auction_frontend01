import { Component, OnInit } from '@angular/core';
 
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  userName: string = '';
 
  ngOnInit() {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.userName = payload.name || 'User';
    }
  }
}
 
