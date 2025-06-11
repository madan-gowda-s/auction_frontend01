import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { jwtDecode } from 'jwt-decode';

 
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';
 
  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
this.loginForm = this.fb.group({
email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }
 
  onSubmit(): void {
    if (this.loginForm.invalid) return;
 
this.http.post('https://localhost:7046/api/Users/login', this.loginForm.value).subscribe({
      next: (response: any) => {
        alert(response.message); // Login Successful
        localStorage.setItem('token', response.token);
 
        try {
          const decoded: any = jwtDecode(response.token);
const role = decoded['role'] || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
const name = decoded['name'] || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'];
 
          switch (role.toLowerCase()) {
            case 'admin':
              this.router.navigate(['/admin/dashboard']);
              break;
            case 'seller':
              this.router.navigate(['/seller/dashboard']);
              break;
            case 'buyer':
              this.router.navigate(['/buyer/dashboard']);
              break;
            default:
              alert('Role not recognized.');
              this.router.navigate(['/']);
          }
        } catch (e) {
          alert('Invalid token format.');
        }
      },
      error: err => {
        if (err.status === 401) {
          this.errorMessage = 'Invalid credentials.';
          alert(this.errorMessage);
        } else {
          this.errorMessage = 'Something went wrong. Please try again.';
        }
      }
    });
  }
}