import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
 
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
 
  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {}
 
  ngOnInit(): void {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      role: ['', Validators.required],
      contactNumber: ['', Validators.required]
    });
  }
 
  register() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched(); // Show errors on all fields
      return;
    }
 
    this.http.post('https://localhost:7046/api/Users/register', this.registerForm.value, { responseType: 'text' })
      .subscribe({
        next: (res) => {
          alert(res); // "Registration successful."
          this.router.navigate(['/login']);
        },
        error: (err) => {
          if (err.status === 400) {
            alert(err.error); // "Email already registered."
          } else {
            alert('Something went wrong. Please try again later.');
          }
        }
      });
  }
}
 