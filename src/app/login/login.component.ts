import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
 
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  apiUrl: string = 'https://localhost:7046/api/Users/login';
 
  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router) {}
 
  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }
 
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
 
    const userData = this.loginForm.value;
 
    this.http.post<any>(this.apiUrl, userData).subscribe({
      next: (res) => {
        alert(res.message);  // "Login Successful"
        localStorage.setItem('token', res.token);
 
        const payload = JSON.parse(atob(res.token.split('.')[1]));
        const role = payload.role?.toLowerCase();
        const name = payload.name;
 
        // Optional: store name for displaying later
        localStorage.setItem('name', name);
 
        // Redirect based on role
        switch (role) {
          case 'Admin':
            this.router.navigate(['/admin/dashboard']);
            break;
          case 'Seller':
            this.router.navigate(['/seller/dashboard']);
            break;
          case 'Buyer':
            this.router.navigate(['/buyer/dashboard']);
            break;
          default:
            alert('Role not recognized.');
            this.router.navigate(['/login']);
        }
      },
      error: (err) => {
        alert(err.error);  // "Invalid credentials."
      }
    });
  }
}
 