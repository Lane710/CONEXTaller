// src/app/app.config.ts (sin cambios adicionales, el que ya tenías)
import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import localeEsBo from '@angular/common/locales/es-BO';
import localeEs from '@angular/common/locales/es';
import { routes } from './app.routes';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AuthInterceptor } from './auth.interceptor'; // Importa tu AuthInterceptor (ahora es una función)
import { registerLocaleData } from '@angular/common';

registerLocaleData(localeEs, 'es');
registerLocaleData(localeEsBo, 'es-BO');


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    //provideClientHydration(withEventReplay()),
    provideHttpClient(
      withInterceptors([AuthInterceptor]) // Aquí se espera la función interceptor
    ),
    { provide: LOCALE_ID, useValue: 'es-BO' }
  ],
};