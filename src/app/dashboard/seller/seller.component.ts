import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
 
@Component({
  selector: 'app-seller',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './seller.component.html',
  styleUrls: ['./seller.component.css']
})
export class SellerComponent {
  sellerName = '';
  sellerEmail = '';
  productResponses: any[] = []; // ✅ Define this array
  errorMessage: string = '';
  product = {
    title: '',
    description: '',
    startPrice: null,
    category: '',
    sellerId: 0,
    imageUrls: ['']
  };
 
  constructor(private http: HttpClient) {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.sellerName = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];
      this.sellerEmail = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"];
      this.product.sellerId = 10; // use actual sellerId if available
    }
  }
 
  submitProduct() {
    this.errorMessage = '';
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
 
    this.http.post('https://localhost:7046/api/Product', this.product, { headers }).subscribe({
      next: (res) => {
        this.productResponses.push(res); // ✅ Add to array
        this.product = {
          title: '',
          description: '',
          startPrice: null,
          category: '',
          sellerId: this.product.sellerId,
          imageUrls: ['']
        };
      },
      error: (err) => {
        if (err.status === 400 && err.error?.errors) {
          const errors = Object.values(err.error.errors).flat();
          this.errorMessage = errors.join(', ');
        } else {
          this.errorMessage = 'Product registration failed.';
        }
      }
    });
  }
}
 
 