import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
// import { provideForms } from '@angular/forms'
// import { provideCommon } from '@angular/common'
 
export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes),
    provideHttpClient(),
    // provideForms(),
    // provideCommon(),
  ]
};
 
 
