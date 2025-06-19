import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './admin.component.html',
})
export class AdminComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  toastColor: string = 'bg-success'; 

  products: any[] = [];
  auctions: any[] = []; 
  users: any[] = [];


  selectedProductId!: number;
  selectedAuctionId!: number;

  showAuctionForm = false;
  showProductForm = false;
  showAuctionUpdateForm = false;

  auctionForm!: FormGroup;
  productForm!: FormGroup;
  auctionUpdateForm!: FormGroup;

  userEmailToDelete: string = '';
  showToast = false;
  toastMessage = '';

  
  // showUserUpdateForm = false;
  // userUpdateForm!: FormGroup;


  token = localStorage.getItem('token');
  headers = new HttpHeaders({
    Authorization: `Bearer ${this.token}`,
  });

  constructor() {
    this.loadProducts();
    this.loadAuctions();
    this.loadUsers(); 
  }

  loadProducts() {
    this.http.get('https://localhost:7046/api/Product/all', { headers: this.headers }).subscribe(data => {
      this.products = data as any[];
    });
  }

  loadAuctions() {
    this.http.get('https://localhost:7046/api/Auction/all', { headers: this.headers }).subscribe(data => {
      this.auctions = data as any[];
    });
  }

  
  loadUsers() {
   this.http.get('https://localhost:7046/api/Users', { headers: this.headers }).subscribe(data => {
   this.users = data as any[];
   });
  }
  

  openAuctionForm(product: any) {
    this.selectedProductId = product.productId;
    this.auctionForm = this.fb.group({
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      startPrice: [product.startPrice, Validators.required],
    });
    this.showAuctionForm = true;
  }

  cancelAuctionForm() {
    this.showAuctionForm = false;
  }

  submitAuctionForm() {
    if (this.auctionForm.invalid) return;

    const payload = {
      productId: this.selectedProductId,
      ...this.auctionForm.value,
    };

    this.http.post('https://localhost:7046/api/Auction/create', payload, { headers: this.headers }).subscribe(() => {
      this.showAuctionForm = false;
      this.loadAuctions();
    });
  }

  openProductForm(product: any) {
    this.selectedProductId = product.productId;
    this.productForm = this.fb.group({
      title: [product.title, Validators.required],
      description: [product.description, Validators.required],
      startPrice: [product.startPrice, Validators.required],
      category: [product.category, Validators.required],
    });
    this.showProductForm = true;
  }

  cancelProductForm() {
    this.showProductForm = false;
  }

  submitProductForm() {
    if (this.productForm.invalid) return;

    this.http.put(`https://localhost:7046/api/Product/${this.selectedProductId}`, this.productForm.value, { headers: this.headers }).subscribe(() => {
      this.showProductForm = false;
      this.loadProducts();
    });
  }

  deleteProduct(productId: number): void {
    this.http.delete(`https://localhost:7046/api/Product/${productId}`, { headers: this.headers, responseType: 'text' }).subscribe({
      next: () => {
        this.products = this.products.filter(p => p.productId !== productId);
      },
      error: err => {
        console.error('Error deleting product:', err);
      }
    });
  }

  openAuctionUpdateForm(auction: any) {
    this.selectedAuctionId = auction.auctionId;
    this.auctionUpdateForm = this.fb.group({
      startDate: [auction.startDate, Validators.required],
      endDate: [auction.endDate, Validators.required],
      status: [auction.status, Validators.required],
    });
    this.showAuctionUpdateForm = true;
  }

  cancelAuctionUpdateForm() {
    this.showAuctionUpdateForm = false;
  }

  submitAuctionUpdateForm() {
    if (this.auctionUpdateForm.invalid) return;

    this.http.put(`https://localhost:7046/api/Auction/update/${this.selectedAuctionId}`, this.auctionUpdateForm.value, {
      headers: this.headers,
    }).subscribe(() => {
      this.showAuctionUpdateForm = false;
      this.loadAuctions();
    });
  }

  deleteAuction(auctionId: number) {
    this.http.delete(`https://localhost:7046/api/Auction/delete/${auctionId}`, { headers: this.headers }).subscribe(() => {
      this.loadAuctions();
    });
  }

  showUserUpdateForm = false;
  userUpdateForm!: FormGroup;

deleteUser(email: string) {
  const encodedEmail = encodeURIComponent(email);
  const url = `https://localhost:7046/api/Users/by-email/${encodedEmail}`;

  this.http.delete(url, { headers: this.headers, responseType: 'text' }).subscribe({
    next: () => {
      this.toastMessage = 'User deleted successfully.';
      this.showToast = true;
      this.loadUsers();
      setTimeout(() => {
        this.showToast = false;
        this.toastMessage = '';
      }, 1800);
    },
    error: () => {
      this.toastMessage = 'Failed to delete user.';
      this.showToast = true;
      setTimeout(() => {
        this.showToast = false;
        this.toastMessage = '';
      }, 1800);
    }
  });
}

openUserUpdateForm(user: any) {
  this.userUpdateForm = this.fb.group({
    email: [user.email, Validators.required],
    name: [user.name, Validators.required],
    contactNumber: [user.contactNumber, Validators.required],
    password: ['', Validators.required], // New password
  });
  this.showUserUpdateForm = true;
}

cancelUserUpdateForm() {
  this.showUserUpdateForm = false;
}

submitUserUpdateForm() {
  if (this.userUpdateForm.invalid) return;

  const payload = this.userUpdateForm.value;
  const headersWithContentType = this.headers.set('Content-Type', 'application/json');

  this.http.put('https://localhost:7046/api/Users/update-by-email', payload, {
    headers: headersWithContentType,
    responseType: 'text' // 👈 Important: handle empty response
  }).subscribe({
    next: () => {
      this.toastMessage = 'User details updated successfully.';
      this.toastColor = 'bg-success'; // 👈 Set toast color
      this.showToast = true;
      this.showUserUpdateForm = false;
      this.loadUsers(); // 👈 Refresh user list
      setTimeout(() => {
        this.showToast = false;
        this.toastMessage = '';
      }, 1500);
    },
    error: (err) => {
      console.error('Update failed:', err);
      this.toastMessage = 'Failed to update user.';
      this.toastColor = 'bg-danger'; // 👈 Red toast on error
      this.showToast = true;
      setTimeout(() => {
        this.showToast = false;
        this.toastMessage = '';
      }, 1800);
    }
  });
}




  // deleteUserByEmail() {
  //   if (!this.userEmailToDelete) return;

  //   const encodedEmail = encodeURIComponent(this.userEmailToDelete);
  //   const url = `https://localhost:7046/api/Users/by-email/${encodedEmail}`;

  //   this.http.delete(url, { headers: this.headers, responseType: 'text' }).subscribe({
  //     next: () => {
  //       this.toastMessage = 'User deleted successfully.';
  //       this.showToast = true;
  //       setTimeout(() => {
  //         this.showToast = false;
  //         this.toastMessage = '';
  //       }, 1500);
  //     },
  //     error: () => {
  //       this.toastMessage = 'Failed to delete user.';
  //       this.showToast = true;
  //       setTimeout(() => {
  //         this.showToast = false;
  //         this.toastMessage = '';
  //       }, 1500);
  //     }
  //   });
  // }
}
