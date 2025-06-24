import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { jwtDecode } from 'jwt-decode';

//Declaring bootstrap as global variable

declare var bootstrap: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';
  toastMessage: string = '';
  loading: boolean = false;
  showPassword: boolean = false;

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

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  showToast(message: string, isError: boolean = false): void {
    this.toastMessage = message;
    const toastElement = document.getElementById('loginToast');
    if (toastElement) {
      toastElement.classList.remove('bg-success', 'bg-danger');
      toastElement.classList.add(isError ? 'bg-danger' : 'bg-success');
      const toast = new bootstrap.Toast(toastElement);
      toast.show();
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.loading = true;
    this.http.post('https://localhost:7046/api/Users/login', this.loginForm.value).subscribe({
      next: (response: any) => {
        this.showToast(response.message);
        localStorage.setItem('token', response.token);

        setTimeout(() => {
          try {
            const decoded: any = jwtDecode(response.token);
            const role = decoded['role'] || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

            //Role based routing/redirection

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
                this.showToast('Role not recognized.', true);
                this.router.navigate(['/']);
            }
          } catch (e) {
            this.showToast('Invalid token format.', true);
          }
        }, 1700);
      },
      error: err => {
        this.loading = false;
        this.errorMessage = err.status === 401
          ? 'Invalid credentials.'
          : 'Something went wrong. Please try again.';
        this.showToast(this.errorMessage, true);
      }
    });
  }
}
