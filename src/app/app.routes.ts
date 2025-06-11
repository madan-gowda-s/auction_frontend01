import { Routes } from '@angular/router';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { AdminComponent } from './dashboard/admin/admin.component';
import { SellerComponent } from './dashboard/seller/seller.component';
import { BuyerComponent } from './dashboard/buyer/buyer.component';
// import { AuctionComponent } from './dashboard/auction/auction.component';
import { authGuard } from './guards/auth.guard'; 
 
export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  {
    path: 'admin/dashboard',
    component: AdminComponent,
    canActivate: [authGuard],
    data: { expectedRole: 'admin' }
  },
  {
    path: 'seller/dashboard',
    component: SellerComponent,
    canActivate: [authGuard],
    data: { expectedRole: 'seller' }
  },
  {
    path: 'buyer/dashboard',
    component: BuyerComponent,
    canActivate: [authGuard],
    data: { expectedRole: 'buyer' }
  },
//   {
//     path: 'auction/dashboard',
//     component: AuctionComponent,
//     canActivate: [authGuard],
//     data: { expectedRole: 'seller' } // or 'buyer' or 'admin' depending on your design
//   }
];
 
 