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
  sellerId = 0;
  productResponses: any[] = [];
  errorMessage: string = '';

  userProfile: any = null;
  showProfileModal = false;
  showSuccessAlert = false;
  showProductSuccess = false;
  reviews: any[] = [];
  showReviewsSection = false;



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

        this.http.get<any[]>('https://localhost:7046/api/Users').subscribe({
          next: (users) => {
            const user = users.find(u => u.email.toLowerCase() === this.sellerEmail.toLowerCase());
            if (user) {
              this.userProfile = user;
              this.sellerId = user.userId;
              this.product.sellerId = user.userId;

              // Fetch reviews for this seller
this.http.get<any[]>(`https://localhost:7046/api/Review/targetUser/${user.userId}`).subscribe({
  next: (reviewData) => {
    this.http.get<any[]>('https://localhost:7046/api/Users').subscribe({
      next: (allUsers) => {
        this.reviews = reviewData.map((review: any) => {
          const reviewer = allUsers.find(u => u.userId === review.userId);
          return {
            reviewerName: reviewer ? reviewer.name : 'Unknown',
            rating: review.rating,
            comment: review.comment,
            date: review.date
          };
        });
        this.showReviewsSection = this.reviews.length > 0;
      },
      error: (err) => console.error('Error fetching users for reviews:', err)
    });
  },
  error: (err) => console.error('Error fetching reviews:', err)
});


              // Fetch products after sellerId is set
              this.fetchSellerProducts();
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

  fetchSellerProducts() {
    this.http.get<any[]>('https://localhost:7046/api/Product/all').subscribe({
      next: (products) => {
        this.productResponses = products.filter(p => p.sellerId === this.sellerId);
      },
      error: (err) => {
        console.error('Error fetching products:', err);
        this.errorMessage = "Failed to fetch products.";
      }
    });
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

  submitProduct(): void {
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
  
    this.http.post<any>('https://localhost:7046/api/Product', this.product, { headers }).subscribe({
      next: (res: any) => {
        this.productResponses.push(res);
        this.product = {
          title: '',
          description: '',
          startPrice: null,
          category: '',
          sellerId: this.sellerId,
          imageUrls: ['']
        };
  
        this.showProductSuccess = true;
        setTimeout((): void => {
          this.showProductSuccess = false;
        }, 3000);
      },
      error: (err: any) => {
        console.error('Product registration error:', err);
        this.errorMessage = 'Product registration failed.';
      }
    });
  }  
}
