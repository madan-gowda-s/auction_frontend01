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
import { NgForm } from '@angular/forms'; // Import NgForm if you plan to use it as an argument, though submitProduct() is currently arg-less
 
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
  product = {
    title: '',
    description: '',
    startPrice: null, // Use null for number inputs to allow empty state
    category: '',
    sellerId: 0, // This will be set from token payload or a fixed value like 10
    imageUrls: [''] // Initialize with an empty string for the first URL
  };
 
  categories: string[] = [
    'Electronics',
    'Fashion',
    'Home & Garden',
    'Collectibles',
    'Sports & Outdoors',
    'Books',
    'Vehicles',
    'Art',
    'Other' // Added 'Other' as a general category
  ];
 
  constructor(private http: HttpClient) {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.sellerName = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];
        this.sellerEmail = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"];
        // It's crucial to set sellerId based on the logged-in user from the token,
        // not a hardcoded value if your system is multi-seller.
        // Assuming your token payload contains seller ID, you'd extract it here:
        // this.product.sellerId = payload["your_seller_id_claim"] || 0;
        this.product.sellerId = 10; // <<-- IMPORTANT: Hardcoded. Ensure this '10' exists in your DB.
      } catch (e) {
        console.error("Error decoding token:", e);
        this.errorMessage = "Failed to parse user session. Please log in again.";
        // Optionally, clear token or redirect to login
        localStorage.removeItem('token');
      }
    } else {
      this.errorMessage = "No authentication token found. Please log in.";
      // Optionally, redirect to login page
    }
  }
 
  // Ensure this method does not take any arguments if you call it as submitProduct() in HTML
  submitProduct() {
    this.errorMessage = ''; // Clear previous error messages
 
    const token = localStorage.getItem('token') || '';
    if (!token) {
      this.errorMessage = 'Authentication token not found. Please log in.';
      return;
    }
 
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
 
    // Ensure startPrice is a number, not null, before sending
    if (this.product.startPrice === null) {
        this.errorMessage = 'Start Price cannot be empty.';
        return;
    }
 
    // Ensure sellerId is properly set before sending
    if (this.product.sellerId === 0) {
        this.errorMessage = 'Seller ID is not set. Please log in correctly.';
        return;
    }
 
    this.http.post('https://localhost:7046/api/Product', this.product, { headers }).subscribe({
      next: (res) => {
        this.productResponses.push(res); // Add the newly created product response to the list
        // Reset form fields after successful submission
        this.product = {
          title: '',
          description: '',
          startPrice: null,
          category: '',
          sellerId: this.product.sellerId, // Keep sellerId for next entry if same seller
          imageUrls: [''] // Reset to a single empty string for next entry
        };
        console.log('Product registered successfully:', res);
      },
      error: (err) => {
        console.error('Product registration error:', err);
        if (err.status === 400 && err.error?.errors) {
          // Flatten all error messages from the backend ModelState
          const errors = Object.values(err.error.errors).flat();
          this.errorMessage = errors.join(', ');
        } else if (err.status === 401 || err.status === 403) {
            this.errorMessage = 'Authentication failed or you do not have permission. Please log in as a Seller.';
            // Optionally clear token and redirect to login
            localStorage.removeItem('token');
        } else if (err.status === 500) {
            this.errorMessage = 'An internal server error occurred. Please check the server logs.';
            // For debugging 500, it's vital to inspect the Network tab's Response body
            if (err.error) {
                console.error('Backend 500 error details:', err.error);
                // Display more specific error if available from backend (e.g., in development mode)
                if (typeof err.error === 'string') { // If the 500 response is just a string error
                    this.errorMessage += ` Details: ${err.error.substring(0, 200)}...`; // Limit length
                } else if (err.error.detail) { // Common in .NET 500 errors
                    this.errorMessage += ` Details: ${err.error.detail.substring(0, 200)}...`;
                }
            }
        }
        else {
          this.errorMessage = 'Product registration failed. An unknown error occurred.';
        }
      }
    });
  }
}
 