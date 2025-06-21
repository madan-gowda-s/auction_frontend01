import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

declare var bootstrap: any;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  toastMessage: string = '';
  passwordStrength: string = '';
  isSubmitting: boolean = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern('^[a-zA-Z ]*$')]],    
      email: ['', [Validators.required,Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),Validators.pattern(/@.*\.com$/)]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
      role: ['', Validators.required],
      contactNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]]
    });

    this.registerForm.get('password')?.valueChanges.subscribe(value => {
      this.passwordStrength = this.getPasswordStrength(value);
    });
  }

  getPasswordStrength(password: string): string {
    if (!password) {
      return '';
    }
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[a-z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[$@#&!]/)) strength++;

    if (strength < 3) {
      return 'Weak';
    } else if (strength < 5) {
      return 'Medium';
    } else {
      return 'Strong';
    }
  }

  showToast(message: string, isError: boolean = false): void {
    this.toastMessage = message;
    const toastElement = document.getElementById('registerToast');
    if (toastElement) {
      toastElement.classList.remove('bg-success', 'bg-danger');
      toastElement.classList.add(isError ? 'bg-danger' : 'bg-success');
      const toast = new bootstrap.Toast(toastElement);
      toast.show();
    }
  }

  register() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    this.http.post('https://localhost:7046/api/Users/register', this.registerForm.value, { responseType: 'text' })
      .subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.showToast(res); // Show success message as toast
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 1700); // Delay to show toast before redirecting
        },
        error: (err) => {
          this.isSubmitting = false;
          if (err.status === 400) {
            this.showToast(err.error, true); // Show error message as toast
          } else {
            this.showToast('Something went wrong. Please try again.', true);
          }
        }
      });
  }
}
