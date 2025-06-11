import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
 
export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
 
  if (!token) {
    alert('Please log in first.');
    router.navigate(['/login']);
    return false;
  }
 
  const payload = JSON.parse(atob(token.split('.')[1]));
  const role = payload.role?.toLowerCase();
 
  const expectedRole = route.data['expectedRole'];
 
  if (role !== expectedRole) {
    alert('Access denied.');
    router.navigate(['/login']);
    return false;
  }
 
  return true;
};
 