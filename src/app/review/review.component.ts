import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule ],
  templateUrl: './review.component.html',
  styleUrls: ['./review.component.css']
})

export class ReviewComponent {
  auction: any;
  product: any;
  buyerId: number | null = null;
  
  constructor(private router: Router) {
  const nav = this.router.getCurrentNavigation();
  const state = nav?.extras?.state;
  
  if (state) {
   this.auction = state['auction'];
   this.product = state['product'];
   this.buyerId = state['buyerId'];
   }
   }
  
goBack() {
  this.router.navigate(['/buyer/dashboard']);
  }
  
submitReview() {
  // Implement review submission logic here
  alert('Review submitted!');
  }
  }
  
  
