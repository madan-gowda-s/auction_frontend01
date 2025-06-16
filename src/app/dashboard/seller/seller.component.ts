// import { Component } from '@angular/core';
// import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
 
// @Component({
//   selector: 'app-seller',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './seller.component.html',
//   styleUrls: ['./seller.component.css']
// })
// export class SellerComponent {
//   sellerName = '';
//   sellerEmail = '';
//   productResponses: any[] = []; 
//   errorMessage: string = '';
//   product = {
//     title: '',
//     description: '',
//     startPrice: null,
//     category: '',
//     sellerId: 0,
//     imageUrls: ['']
//   };
 
//   constructor(private http: HttpClient) {
//     const token = localStorage.getItem('token');
//     if (token) {
//       const payload = JSON.parse(atob(token.split('.')[1]));
//       this.sellerName = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];
//       this.sellerEmail = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"];
//       this.product.sellerId = 10; 
//     }
//   }
 
//   submitProduct() {
//     this.errorMessage = '';
//     const token = localStorage.getItem('token') || '';
//     const headers = new HttpHeaders({
//       'Content-Type': 'application/json',
//       'Authorization': `Bearer ${token}`
//     });
 
//     this.http.post('https://localhost:7046/api/Product', this.product, { headers }).subscribe({
//       next: (res) => {
//         this.productResponses.push(res); 
//         this.product = {
//           title: '',
//           description: '',
//           startPrice: null,
//           category: '',
//           sellerId: this.product.sellerId,
//           imageUrls: ['']
//         };
//       },
//       error: (err) => {
//         if (err.status === 400 && err.error?.errors) {
//           const errors = Object.values(err.error.errors).flat();
//           this.errorMessage = errors.join(', ');
//         } else {
//           this.errorMessage = 'Product registration failed.';
//         }
//       }
//     });
//   }
// }
 
 
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
  productResponses: any[] = [];
  errorMessage: string = '';

  userProfile: any = null;
  showProfileModal = false;
  showSuccessAlert = false;

  profileForm = {
    name: '',
    contactNumber: '',
    password: ''
  };

  product = {
    title: '',
    description: '',
    startPrice: null,
    category: '',
    sellerId: 0,
    imageUrls: ['']
  };

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
        this.product.sellerId = 10;

        this.http.get<any[]>('https://localhost:7046/api/Users').subscribe({
          next: (users) => {
            const user = users.find(u => u.email.toLowerCase() === this.sellerEmail.toLowerCase());
            if (user) {
              this.userProfile = user;
            }
          },
          error: (err) => console.error('Error fetching seller profile:', err)
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
      this.profileForm.name = this.userProfile.name;
      this.profileForm.contactNumber = this.userProfile.contactNumber;
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
