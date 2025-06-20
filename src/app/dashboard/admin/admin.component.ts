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
  minDate: string = new Date().toISOString().split('T')[0];
 
 
 
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
 
 
  showUserUpdateForm = false;
  userUpdateForm!: FormGroup;
 
 
  token = localStorage.getItem('token');
  headers = new HttpHeaders({
    Authorization: `Bearer ${this.token}`,
  });
 
  constructor() {
    this.loadProducts();
    this.loadAuctions();
    this.loadUsers();
    this.userUpdateForm = this.fb.group({
      email: ['', []], // No required validator
      name: [''],
      contactNumber: [''],
      password: ['']
    });
    
  }
 
  loadProducts() {
    this.http.get('https://localhost:7046/api/Product/all', { headers: this.headers }).subscribe(data => {
      this.products = data as any[];
    });
  }
 
  loadAuctions() {
    this.http.get('https://localhost:7046/api/Auction/all', { headers: this.headers }).subscribe(data => {
      const now = new Date();
      this.auctions = (data as any[]).map(auction => {
        const startDate = new Date(auction.startDate);
        const endDate = new Date(auction.endDate);
 
        if (now >= startDate && now <= endDate) {
          auction.status = 'Live';
        } else if (now > endDate) {
          auction.status = 'Completed';
        } else if (now < startDate) {
          auction.status = 'Scheduled';
        }
 
        return auction;
      });
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
    }, {
      validators: this.dateRangeValidator
    });
   
    this.showAuctionForm = true;
  }
 
  cancelAuctionForm() {
    this.showAuctionForm = false;
  }
 
  submitAuctionForm(): void {
    if (this.auctionForm.invalid) return;
  
    // Check if an auction already exists for the selected product
    const existingAuction = this.auctions.find(a => a.productId === this.selectedProductId && a.status !== 'Completed');
  
    if (existingAuction) {
      this.toastMessage = 'An auction already exists for this product.';
      this.toastColor = 'bg-warning';
      this.showToast = true;
      setTimeout(() => {
        this.showToast = false;
        this.toastMessage = '';
      }, 2000);
      return;
    }
  
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
    const url = `https://localhost:7046/api/Product/${productId}`;
  
    this.http.delete(url, { headers: this.headers, responseType: 'text' }).subscribe({
      next: () => {
        this.toastMessage = 'Product deleted successfully.';
        this.toastColor = 'bg-success';
        this.showToast = true;
        this.loadProducts();
        setTimeout(() => {
          this.showToast = false;
          this.toastMessage = '';
        }, 1800);
      },
      error: (err) => {
        console.error('Error deleting product:', err);
  
        const errorText = err?.error?.toString() || '';
        const isAuctionConflict = errorText.includes('REFERENCE constraint') || errorText.includes('FK_Transactions_Auctions_AuctionId');
  
        this.toastMessage = isAuctionConflict
          ? 'Cannot delete product: it is linked to an auction that has transactions.'
          : 'Failed to delete product.';
  
        this.toastColor = 'bg-danger';
        this.showToast = true;
  
        setTimeout(() => {
          this.showToast = false;
          this.toastMessage = '';
        }, 1800);
      }
    });
  }
  
 
 
  dateRangeValidator(group: FormGroup) {
    const start = new Date(group.get('startDate')?.value);
    const end = new Date(group.get('endDate')?.value);
    return end > start ? null : { dateRangeInvalid: true };
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
 
  deleteAuction(auction: any) {
    const now = new Date();
    const startDate = new Date(auction.startDate);
    const endDate = new Date(auction.endDate);
 
    let status = '';
    if (now >= startDate && now <= endDate) {
      status = 'Live';
    } else if (now > endDate) {
      status = 'Completed';
    } else if (now < startDate) {
      status = 'Scheduled';
    }
 
    if (status !== 'Scheduled') {
      this.toastMessage = `You can't delete a ${status.toLowerCase()} auction.`;
      this.toastColor = 'bg-warning';
      this.showToast = true;
      setTimeout(() => {
        this.showToast = false;
        this.toastMessage = '';
      }, 2000);
      return;
    }
 
    this.http.delete(`https://localhost:7046/api/Auction/delete/${auction.auctionId}`, { headers: this.headers }).subscribe(() => {
      this.toastMessage = 'Auction deleted successfully.';
      this.toastColor = 'bg-success';
      this.showToast = true;
      this.loadAuctions();
      setTimeout(() => {
        this.showToast = false;
        this.toastMessage = '';
      }, 1800);
    });
  }
 
  deleteUser(email: string): void {
    const encodedEmail = encodeURIComponent(email);
    const url = `https://localhost:7046/api/Users/by-email/${encodedEmail}`;
  
    this.http.delete(url, { headers: this.headers, responseType: 'text' }).subscribe({
      next: () => {
        this.toastMessage = 'User deleted successfully.';
        this.toastColor = 'bg-success';
        this.showToast = true;
        this.loadUsers();
        setTimeout(() => {
          this.showToast = false;
          this.toastMessage = '';
        }, 1800);
      },
      error: (err) => {
        console.error('Delete failed:', err);
  
        const errorText = err?.error?.toString() || '';
        const isTransactionConflict = errorText.includes('REFERENCE constraint') || errorText.includes('FK_Transactions_Users_BuyerId');
  
        this.toastMessage = isTransactionConflict
          ? 'Cannot delete user: As they are linked to existing transactions.'
          : 'Failed to delete user.';
  
        this.toastColor = 'bg-danger';
        this.showToast = true;
  
        setTimeout(() => {
          this.showToast = false;
          this.toastMessage = '';
        }, 1800);
      }
    });
  }
  
 
openUserUpdateForm(user: any): void {
  this.showUserUpdateForm = true;
  this.userUpdateForm.setValue({
    email: user.email,
    name: user.name,
    contactNumber: user.contactNumber,
    password: ''
  });
}

 
cancelUserUpdateForm(): void {
  this.showUserUpdateForm = false;
  this.userUpdateForm.reset();
}

 
submitUserUpdateForm(): void {
  console.log('submitUserUpdateForm called');

  const payload = this.userUpdateForm.value;
  console.log('Form payload:', payload);

  const token = localStorage.getItem('token');
  if (!token) {
    this.toastMessage = 'Authorization token missing.';
    this.toastColor = 'bg-danger';
    this.showToast = true;
    return;
  }

  const headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  this.http.put('https://localhost:7046/api/Users/update-by-email', payload, {
    headers,
    responseType: 'text'
  }).subscribe({
    next: () => {
      this.toastMessage = 'User details updated successfully.';
      this.toastColor = 'bg-success';
      this.showToast = true;
      this.showUserUpdateForm = false;
      this.loadUsers();
      setTimeout(() => {
        this.showToast = false;
        this.toastMessage = '';
      }, 1500);
    },
    error: (err) => {
      console.error('Update failed:', err);
      this.toastMessage = 'Failed to update user.';
      this.toastColor = 'bg-danger';
      this.showToast = true;
      setTimeout(() => {
        this.showToast = false;
        this.toastMessage = '';
      }, 1800);
    }
  });
}


}
 