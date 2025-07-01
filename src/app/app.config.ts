import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';            // Imports a function to provide routing configuration.
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';   // Provides Angular's HttpClient service.

 
export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes),
    provideHttpClient(),
  ]
};
 
 
