import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { interval } from 'rxjs';

@Component({
  selector: 'app-auction',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auction.component.html',
  styleUrls: ['./auction.component.css'],
})
export class AuctionComponent implements OnInit {
  auction: any;
  product: any;
  amount: number = 0;
  bidMessage: string = '';
  bidSuggestions: number[] = [];
  bidHistory: any[] = [];
  buyerId: number = 0;
  buyerName: string = '';
  auctionEnded: boolean = false;
  isWinner: boolean = false;

  constructor(
    private router: Router,
    private location: Location,
    private http: HttpClient
  ) {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as { auction: any; product: any };
    this.auction = state?.auction;
    this.product = state?.product;
  
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const email = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"];
      const name = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];
  
      this.http.get<any[]>('https://localhost:7046/api/Users').subscribe({
        next: (users) => {
          const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
          if (user) {
            this.buyerId = user.userId;
            this.buyerName = user.name;
          } else {
            this.bidMessage = 'User not found. Please login again.';
          }
        },
        error: (err) => {
          console.error('Error fetching users:', err);
          this.bidMessage = 'Unable to identify buyer. Please login again.';
        }
      });
    }
  }
  

  ngOnInit() {
    this.fetchBidHistory();
    this.checkAuctionStatus();
    interval(10000).subscribe(() => {
      this.fetchBidHistory();
      this.checkAuctionStatus();
      this.sendAuctionReminders();
    });
  }

  goBack() {
    this.location.back();
  }

  placeBid() {
    if (!this.buyerId || this.buyerId === 0) {
      this.bidMessage = 'Buyer ID not loaded. Please wait or login again.';
      return;
    }
  
    const payload = {
      auctionId: this.auction.auctionId,
      buyerId: this.buyerId,
      amount: this.amount
    };
  
    this.http.post('https://localhost:7046/api/Bid', payload, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      responseType: 'text'
    }).subscribe({
      next: (res) => {
        this.bidMessage = res;
        this.auction.currentBid = this.amount;
        this.bidSuggestions = [this.amount + 5000, this.amount + 10000, this.amount + 15000];
        this.fetchBidHistory();
      },
      error: (err) => {
        this.bidMessage = err.error || 'Bid must be higher than the current bid.';
      }
    });
  }
  
  

  fetchBidHistory() {
    const token = localStorage.getItem('token');
    let loggedInBuyerId = 0;
  
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const email = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"];
  
      this.http.get<any[]>('https://localhost:7046/api/Users').subscribe({
        next: (users) => {
          const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
          if (user) {
            loggedInBuyerId = user.userId;
            this.buyerId = user.userId;
            this.buyerName = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];
          }
  
          this.http.get<any[]>(`https://localhost:7046/api/Bid/auction/${this.auction.auctionId}`).subscribe({
            next: (res) => {
              this.bidHistory = res;
  
              const highest = Math.max(...this.bidHistory.map(b => b.amount));
              this.auction.currentBid = highest;
              this.bidSuggestions = [highest + 5000, highest + 10000, highest + 15000];
              this.isWinner = this.auctionEnded && highest === this.amount && this.buyerId === this.bidHistory.find(b => b.amount === highest)?.buyerId;
              const highestBid = this.bidHistory.find(b => b.amount === highest);
                if (highestBid?.buyerId !== this.buyerId) {
                  this.bidMessage = 'You have been outbid!';
                  } else {
                  this.bidMessage = 'You are the highest bidder.';
               }
            },
            error: (err) => console.error('Error fetching bid history:', err)
          });
        },
        error: (err) => console.error('Error fetching users:', err)
      });
    }
  }
  


  checkAuctionStatus() {
    const now = new Date();
    const end = new Date(this.auction.endDate);
    this.auctionEnded = now > end;
  }

  sendAuctionReminders() {
    const now = new Date();
    const end = new Date(this.auction.endDate);
    const diff = Math.floor((end.getTime() - now.getTime()) / 60000);
    if ([10, 5, 2, 1].includes(diff)) {
      alert(`${diff} minute${diff > 1 ? 's' : ''} remaining before auction ends.`);
    }
  }

  goToPayment() {
    this.router.navigate(['/buyer/dashboard'],  {
      state: {
        auctionId: this.auction.auctionId,
        amount: this.amount,
        buyerId: this.buyerId
      }
    });
  }
}
