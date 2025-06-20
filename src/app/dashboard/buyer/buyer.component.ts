import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

//Define the structure of auction and product objects for type safety.

interface Auction {
  auctionId: number;
  productId: number;
  title: string;
  startDate: string;
  endDate: string;
  currentBid: number;
  status: string;
}

interface Product {
  productId: number;
  title: string;
  description: string;
  startPrice: number;
  category: string;
  status: string;
  imageUrls: string[];
}

@Component({
  selector: 'app-buyer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './buyer.component.html',
  styleUrls: ['./buyer.component.css'],
})
export class BuyerComponent {
  private http = inject(HttpClient);
  private router = inject(Router);

  //Reactive variable	Automatically updates UI when changed

  auctions = signal<Auction[]>([]);
  filteredAuctions = signal<Auction[]>([]);
  products = signal<Product[]>([]);
  selectedProduct = signal<Product | null>(null);
  showProductDetails = signal(false);
  noAuctionsFound = signal(false);
  filterMode = signal(false);
  buyerId = signal<number | null>(null);
  buyerName = signal<string | null>(null);
  winnerAuctions = signal<number[]>([]);
  userProfile = signal<any | null>(null);
  showSuccessAlert = signal(false);

  

  filterData = {
    category: '',
    minBid: '',
    maxBid: '',
    timeLeftInHours: '',
    status: 'Available'
  };

  constructor() {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state;
    console.log(state);

    this.fetchBuyerInfo();
    this.fetchAuctions();
    this.fetchProducts();
  }

  fetchBuyerInfo() {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      const email = decoded['email'] || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
      const name = decoded['name'] || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'];

      this.http.get<any[]>('https://localhost:7046/api/Users').subscribe({
        next: (users) => {
          const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
          if (user) {
            this.buyerId.set(user.userId);
            this.buyerName.set(name);
            this.userProfile.set(user);
            this.checkWinnerStatus(user.userId);
          }
        },
        error: (err: any) => console.error('Error fetching users:', err)
      });
    }
  }

  fetchAuctions() {
    this.http.get<Auction[]>('https://localhost:7046/api/Auction/all').subscribe({
      next: (res) => {
        this.auctions.set(res);
        this.filteredAuctions.set(res);
        this.noAuctionsFound.set(res.length === 0);
        if (this.buyerId()) {
          this.checkWinnerStatus(this.buyerId()!);
        }
      },
      error: (err: any) => console.error('Error fetching auctions:', err)
    });
  }

  fetchProducts() {
    const token = localStorage.getItem('token');
    this.http.get<Product[]>('https://localhost:7046/api/Product/all', {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => this.products.set(res),
      error: (err: any) => console.error('Error fetching products:', err)
    });
  }

  getAuctionStatus(auction: Auction): 'live' | 'upcoming' | 'completed' {
    const now = new Date();
    const start = new Date(auction.startDate);
    const end = new Date(auction.endDate);

    if (now >= start && now <= end) return 'live';
    if (now < start) return 'upcoming';
    return 'completed';
  }

  viewProduct(productId: number) {
    const product = this.products().find(p => p.productId === productId);
    if (product) {
      this.selectedProduct.set(product);
      this.showProductDetails.set(true);
    }
  }

  backToList() {
    this.showProductDetails.set(false);
    this.selectedProduct.set(null);
  }

  applyFilters() {
    this.filterMode.set(true);
    const token = localStorage.getItem('token');

    this.http.post<Auction[]>(
      'https://localhost:7046/api/Auction/filter',
      this.filterData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    ).subscribe({
      next: (res) => {
        this.filteredAuctions.set(res);
        this.noAuctionsFound.set(res.length === 0);
      },
      error: (err: any) => console.error('Error applying filter:', err)
    });
  }

  resetFilter() {
    this.filterMode.set(false);
    this.fetchAuctions();
  }

  bidNow(auctionId: number) {
    const auction = this.auctions().find(a => a.auctionId === auctionId);
    const product = this.products().find(p => p.productId === auction?.productId);

    if (auction && product) {
      this.router.navigate(['/auction/dashboard'], {
        state: { auction, product }
      });
    }
  }

  checkWinnerStatus(buyerId: number) {
    this.filteredAuctions().forEach(auction => {
      this.http.get<any[]>(`https://localhost:7046/api/Bid/auction/${auction.auctionId}`).subscribe({
        next: (bids) => {
          const highestBid = Math.max(...bids.map(b => b.amount));
          const winnerBid = bids.find(b => b.amount === highestBid);
          if (winnerBid?.buyerId === buyerId) {
            const currentWinners = this.winnerAuctions();
            this.winnerAuctions.set([...currentWinners, auction.auctionId]);
          }
        },
        error: (err: any) => console.error(`Error checking winner for auction ${auction.auctionId}`, err)
      });
    });
  }

  goToPayment(auctionId: number) {
    const auction = this.auctions().find(a => a.auctionId === auctionId);
    const product = this.products().find(p => p.productId === auction?.productId);

    if (auction && product && this.buyerId()) {
      this.router.navigate(['/payment'], {
        state: {
          auctionId: auction.auctionId,
          productId: product.productId,
          buyerId: this.buyerId()
        }
      });
    }
  }

  goToReview(auctionId: number) {
    const auction = this.auctions().find(a => a.auctionId === auctionId);
    const product = this.products().find(p => p.productId === auction?.productId);

    if (auction && product && this.buyerId()) {
      this.router.navigate(['/review'], {
        state: {
          auction,
          product,
          buyerId: this.buyerId()
        }
      });
    }
  }

showProfileModal = signal(false);

profileForm = {
  name: '',
  contactNumber: '',
  password: ''
};

openProfileForm() {
  const user = this.userProfile();
  if (user) {
    this.profileForm.name = user.name;
    this.profileForm.contactNumber = user.contactNumber;
    this.profileForm.password = '';
    this.showProfileModal.set(true);
  }
}

closeProfileForm() {
  this.showProfileModal.set(false);
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
      this.showSuccessAlert.set(true);
      setTimeout(() => this.showSuccessAlert.set(false), 2000);
      this.fetchBuyerInfo();
      this.closeProfileForm();
    },
    error: (err: any) => console.error('Error updating profile:', err)
  });
}  
}

 