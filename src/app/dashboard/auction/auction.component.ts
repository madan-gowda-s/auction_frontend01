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
  bidHistory: any[] = [];
  bidSuggestions: number[] = [];
  buyerId: number = 0;
  buyerName: string = '';
  auctionEnded: boolean = false;
  isWinner: boolean = false;
  timeRemaining: string = '';
  auctionReminderMessage: string = '';
  showReminder: boolean = false;

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
    this.updateTimeRemaining();

    interval(1000).subscribe(() => {
      this.updateTimeRemaining();
    });

    interval(10000).subscribe(() => {
      this.fetchBidHistory();
      this.checkAuctionStatus();
      this.sendAuctionReminders();
    });
  }

  checkAuctionStatus() {
    const now = new Date();
    const end = new Date(this.auction.endDate);
    this.auctionEnded = now > end;
  }

  updateTimeRemaining() {
    const now = new Date().getTime();
    const end = new Date(this.auction.endDate).getTime();
    const diff = end - now;

    if (diff <= 0) {
      this.timeRemaining = 'Auction ended';
      this.auctionEnded = true;
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    this.timeRemaining = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
    if (!token) return;
  
    const payload = JSON.parse(atob(token.split('.')[1]));
    const email = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"];
  
    this.http.get<any[]>('https://localhost:7046/api/Users').subscribe({
      next: (users) => {
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (user) {
          this.buyerId = user.userId;
          this.buyerName = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];
        }
  
        const auctionId = this.auction.auctionId;
  
        this.http.get<any[]>(`https://localhost:7046/api/Bid/auction/${auctionId}`).subscribe({
          next: (res: any[]) => {
            this.bidHistory = res;
  
            if (this.bidHistory.length === 0) {
              this.bidMessage = 'No bids yet. Be the first to place your bid!';
              this.auction.currentBid = this.product.startPrice;
              this.bidSuggestions = [this.product.startPrice + 5000, this.product.startPrice + 10000, this.product.startPrice + 15000];
              return;
            }
  
            const highest = Math.max(...this.bidHistory.map(b => b.amount));
            this.auction.currentBid = highest;
            this.bidSuggestions = [highest + 5000, highest + 10000, highest + 15000];
  
            const highestBid = this.bidHistory.find(b => b.amount === highest);
            const isCurrentUserHighestBidder = highestBid?.buyerId === this.buyerId;
  
            if (this.auctionEnded) {
              const auctionEndTime = new Date(this.auction.endDate).getTime();
            
              const validBids = this.bidHistory.filter(b => new Date(b.bidTime).getTime() <= auctionEndTime);
              const highestBeforeEnd = Math.max(...validBids.map(b => b.amount));
              const winningBid = validBids.find(b => b.amount === highestBeforeEnd);
              const isCurrentUserWinner = winningBid?.buyerId === this.buyerId;
            
              if (isCurrentUserWinner) {
                this.isWinner = true;
                this.bidMessage = 'You are the winner!';
              } else {
                this.isWinner = false;
                this.bidMessage = 'Your bid is lower than the highest. Bidding is closed.';
              }
            }     
          },
          error: (err: any) => console.error('Error fetching bid history:', err)
        });
      },
      error: (err: any) => console.error('Error fetching users:', err)
    });
  }
  
  sendAuctionReminders() {
    const now = new Date();
    const end = new Date(this.auction.endDate);
    const diff = Math.floor((end.getTime() - now.getTime()) / 60000);

    if ([30, 5, 2].includes(diff)) {
      this.auctionReminderMessage = `${diff} minute${diff > 1 ? 's' : ''} remaining before auction ends.`;
      this.showReminder = true;

      setTimeout(() => {
        this.showReminder = false;
        this.auctionReminderMessage = '';
      }, 5000);
    }
  }

  goToPayment() {
    this.router.navigate(['/buyer/dashboard'], {
      state: {
        auctionId: this.auction.auctionId,
        amount: this.amount,
        buyerId: this.buyerId
      }
    });
  }
}
