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

  // User & Product State

  sellerName = '';
  sellerEmail = '';
  productResponses: any[] = [];
  errorMessage: string = '';

  // Profile & Modal State

  userProfile: any = null;
  showProfileModal = false;
  showSuccessAlert = false;

  // Profile Form Model

  profileForm = {
    name: '',
    contactNumber: '',
    password: ''
  };

  // Product Form Model

  product = {
    title: '',
    description: '',
    startPrice: null,
    category: '',
    sellerId: 0,
    imageUrls: ['']
  };

  // Categories List

  categories: string[] = [
    'Electronics', 'Fashion', 'Home & Garden', 'Collectibles',
    'Sports & Outdoors', 'Books', 'Vehicles', 'Art', 'Other'
  ];

  constructor(private http: HttpClient) {
  const token = localStorage.getItem('token');


    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.sellerName = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];
        this.sellerEmail = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"];

        this.http.get<any[]>('https://localhost:7046/api/Users').subscribe({
          next: (users) => {
            const user = users.find(u => u.email.toLowerCase() === this.sellerEmail.toLowerCase());
            if (user) {
              this.userProfile = user;
              this.product.sellerId = user.userId; 
            } else {
              this.errorMessage = "Seller profile not found.";
            }
          },
          error: (err) => {
            console.error('Error fetching seller profile:', err);
            this.errorMessage = "Failed to fetch seller profile.";
          }
        });
      } catch (e) {
        console.error("Error decoding token:", e);
        this.errorMessage = "Failed to parse user session. Please log in again.";
        localStorage.removeItem('token');
      }
    } else {
      this.errorMessage = "No authentication token found. Please log in.";
    }
  }

  openProfileForm() {
    if (this.userProfile) {
      this.profileForm.name = this.userProfile.name;   // Pre-fills the modal form with current profile data.
      this.profileForm.contactNumber = this.userProfile.contactNumber;  //Pre-fills the modal form with current profile data.
      this.profileForm.password = '';
      this.showProfileModal = true;
    }
  }

  closeProfileForm() {
    this.showProfileModal = false;
  }

  submitProfileUpdate() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const decoded = JSON.parse(atob(token.split('.')[1]));
    const email = decoded['email'] || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];

    this.http.put('https://localhost:7046/api/Users/update-by-email', {
      email,
      name: this.profileForm.name,
      contactNumber: this.profileForm.contactNumber,
      password: this.profileForm.password
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      responseType: 'text' as const
    }).subscribe({
      next: () => {
        this.showSuccessAlert = true;
        setTimeout(() => this.showSuccessAlert = false, 1800);
        this.closeProfileForm();
        this.userProfile.name = this.profileForm.name;
        this.userProfile.contactNumber = this.profileForm.contactNumber;
      },
      error: (err) => console.error('Error updating seller profile:', err)
    });
  }

  submitProduct() {
    this.errorMessage = '';
    const token = localStorage.getItem('token') || '';
    if (!token) {
      this.errorMessage = 'Authentication token not found. Please log in.';
      return;
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    if (this.product.startPrice === null) {
      this.errorMessage = 'Start Price cannot be empty.';
      return;
    }

    if (this.product.sellerId === 0) {
      this.errorMessage = 'Seller ID is not set. Please log in correctly.';
      return;
    }

    this.http.post('https://localhost:7046/api/Product', this.product, { headers }).subscribe({
      next: (res) => {
        this.productResponses.push(res);
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
        console.error('Product registration error:', err);
        this.errorMessage = 'Product registration failed.';
      }
    });
  }
}
