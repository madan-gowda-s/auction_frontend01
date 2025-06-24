import { bootstrapApplication } from '@angular/platform-browser';  //  Importing the bootstrapApplication function
import { AppComponent } from './app/app.component';                //  AppComponent is usually the entry point.
import { appConfig } from './app/app.config';
import { provideHttpClient } from '@angular/common/http';
 
bootstrapApplication(AppComponent, {
  providers: [provideHttpClient(), ...appConfig.providers]        // Combining multiple sources of providers into one array
});
 