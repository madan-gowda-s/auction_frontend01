// admin.component.ts
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterModule } from '@angular/router';
 
@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './admin.component.html',
})
export class AdminComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
 
  products: any[] = [];
  auctions: any[] = [];
 
  selectedProductId!: number;
  selectedAuctionId!: number;
 
  showAuctionForm = false;
  showProductForm = false;
  showAuctionUpdateForm = false;
 
  auctionForm!: FormGroup;
  productForm!: FormGroup;
  auctionUpdateForm!: FormGroup;
 
  token = localStorage.getItem('token');
  headers = new HttpHeaders({
    Authorization: `Bearer ${this.token}`,
  });
 
  constructor() {
    this.loadProducts();
    this.loadAuctions();
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
    console.log('Attempting to delete product:',productId);

    this.http.delete(`https://localhost:7046/api/Product/${productId}`, { headers: this.headers, responseType: 'text' }).subscribe({
      next:(response) => {
        console.log('Delete response:', response);

      this.products = this.products.filter(p => p.productId!== productId);
      console.log('Updated product list:',this.products);
    },
    error:(err) => {
      console.error('Error deleting product:',err);
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
}
 