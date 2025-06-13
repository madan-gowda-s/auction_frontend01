// import { Component, effect, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { HttpClient } from '@angular/common/http';
// import { Router } from '@angular/router';
// import { FormsModule } from '@angular/forms';
 
// interface Auction {
//   auctionId: number;
//   productId: number;
//   title: string;
//   startDate: string;
//   endDate: string;
//   currentBid: number;
//   status: string;
// }
 
// interface Product {
//   productId: number;
//   title: string;
//   description: string;
//   startPrice: number;
//   category: string;
//   status: string;
//   imageUrls: string[];
// }
 
// @Component({
//   selector: 'app-buyer',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './buyer.component.html',
//   styleUrl: './buyer.component.css',
// })
// export class BuyerComponent {
//   private http = inject(HttpClient);
//   private router = inject(Router);
 
//   auctions = signal<Auction[]>([]);
//   filteredAuctions = signal<Auction[]>([]);
//   products = signal<Product[]>([]);
//   selectedProduct = signal<Product | null>(null);
//   showProductDetails = signal(false);
//   noAuctionsFound = signal(false);
//   filterMode = signal(false);
 
//   // Filter model
//   filterData = {
//     category: '',
//     minBid: 0,
//     maxBid: 100000,
//     timeLeftInHours: 24,
//     status: 'Available'
//   };
 
//   constructor() {
//     this.fetchAuctions();
//     this.fetchProducts();
//   }
 
//   fetchAuctions() {
//     this.http.get<Auction[]>('https://localhost:7046/api/Auction/all').subscribe({
//       next: (res) => {
//         this.auctions.set(res);
//         this.filteredAuctions.set(res);
//         this.noAuctionsFound.set(res.length === 0);
//       },
//       error: (err) => console.error('Error fetching auctions:', err)
//     });
//   }
 
//   fetchProducts() {
//     const token = localStorage.getItem('token');
//     this.http.get<Product[]>('https://localhost:7046/api/Product/all', {
//       headers: { Authorization: `Bearer ${token}` }
//     }).subscribe({
//       next: (res) => this.products.set(res),
//       error: (err) => console.error('Error fetching products:', err)
//     });
//   }

//   getAuctionStatus(auction: Auction): 'live' | 'upcoming' | 'completed' {
//     const now = new Date();
//     const start = new Date(auction.startDate);
//     const end = new Date(auction.endDate);
 
//     if (now >= start && now <= end) return 'live';
//     if (now < start) return 'upcoming';
//     return 'completed';
//   }
 
//   viewProduct(productId: number) {
//     const product = this.products().find(p => p.productId === productId);
//     if (product) {
//       this.selectedProduct.set(product);
//       this.showProductDetails.set(true);
//     }
//   }
 
//   backToList() {
//     this.showProductDetails.set(false);
//     this.selectedProduct.set(null);
//   }
 
//   applyFilters() {
//     this.filterMode.set(true);
//     const token = localStorage.getItem('token');
 
//     this.http.post<Auction[]>(
//       'https://localhost:7046/api/Auction/filter',
//       this.filterData,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       }
//     ).subscribe({
//       next: (res) => {
//         this.filteredAuctions.set(res);
//         this.noAuctionsFound.set(res.length === 0);
//       },
//       error: (err) => console.error('Error applying filter:', err)
//     });
//   }
 
//   resetFilter() {
//     this.filterMode.set(false);
//     this.fetchAuctions();
//   }
 
//   // bidNow(auctionId: number) {
//   //   this.router.navigate(['/auction/dashboard'], { queryParams: { id: auctionId } });
//   // }

//   bidNow(auctionId: number) {
//     const auction = this.auctions().find(a => a.auctionId === auctionId);
//     const product = this.products().find(p => p.productId === auction?.productId);
  
//     if (auction && product) {
//       this.router.navigate(['/auction/dashboard'], {
//         state: { auction, product }
//       });
//     }
//   }
  
  
// }


import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
// import { RouterLink } from '@angular/router';

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

  // Filter model
  filterData = {
    category: '',
    minBid: 0,
    maxBid: 100000,
    timeLeftInHours: 24,
    status: 'Available'
  };

  

  constructor() {
    this.fetchBuyerInfo();
    this.fetchAuctions();
    this.fetchProducts();
  }

  fetchBuyerInfo() {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const email = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"];
      const name = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];

      this.http.get<any[]>('https://localhost:7046/api/Users').subscribe({
        next: (users) => {
          const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
          if (user) {
            this.buyerId.set(user.userId);
            this.buyerName.set(name);
            this.checkWinnerStatus(user.userId);
          }
        },
        error: (err) => console.error('Error fetching users:', err)
      });
    }
  }

  fetchAuctions() {
    this.http.get<Auction[]>('https://localhost:7046/api/Auction/all').subscribe({
      next: (res) => {
        this.auctions.set(res);
        this.filteredAuctions.set(res);
        this.noAuctionsFound.set(res.length === 0);
  
        // ✅ Now that auctions are loaded, check winner status
        if (this.buyerId()) {
          this.checkWinnerStatus(this.buyerId()!);
        }
      },
      error: (err) => console.error('Error fetching auctions:', err)
    });
  }
  

  fetchProducts() {
    const token = localStorage.getItem('token');
    this.http.get<Product[]>('https://localhost:7046/api/Product/all', {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => this.products.set(res),
      error: (err) => console.error('Error fetching products:', err)
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
      error: (err) => console.error('Error applying filter:', err)
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
        error: (err) => console.error(`Error checking winner for auction ${auction.auctionId}`, err)
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
}

 