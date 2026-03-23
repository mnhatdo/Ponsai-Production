import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

// Debug flag - set to false in production to reduce console noise
const DEBUG_MODE = false;

const normalizeApiErrorMessage = (message: unknown): string => {
  if (typeof message !== 'string' || !message) {
    return 'An unexpected error occurred';
  }

  if (message.startsWith('Duplicate field value entered')) {
    return 'Dữ liệu đã tồn tại. Vui lòng kiểm tra lại và thử lại.';
  }

  return message;
};

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  // Removed AuthService to prevent circular dependency
  
  return next(req).pipe(
    catchError((incomingError: HttpErrorResponse) => {
      let error = incomingError;
      let errorMessage = 'An error occurred';

      // Identify request types early
      const isLoginRequest = req.url.includes('/auth/login');
      const isRegisterRequest = req.url.includes('/auth/register');
      const isGoogleAuthRequest = req.url.includes('/auth/google');
      const isAuthMeRequest = req.url.includes('/auth/me');
      const isPublicRoute = req.url.includes('/products') || req.url.includes('/blogs') || req.url.includes('/categories');

      // ========== SELECTIVE DEBUG LOGGING ==========
      // Only log unexpected errors, not expected auth failures
      const shouldLogDetails = DEBUG_MODE && !(
        (error.status === 401 && (isLoginRequest || isRegisterRequest || isGoogleAuthRequest))
      );

      if (shouldLogDetails) {
        console.group(`HTTP Error - ${error.status}`);
        console.log('URL:', req.urlWithParams);
        console.log('Method:', req.method);
        console.log('Has Auth Header:', req.headers.has('Authorization'));
        console.log('Request Body:', req.body);
        console.log('Error Response:', error.error);
        console.log('Timestamp:', new Date().toISOString());
        console.log('Current Route:', window.location.pathname);
        console.groupEnd();
      }
      // ========== END DEBUG LOGGING ==========

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = error.error.message;
      } else {
        // Server-side error
        errorMessage = error.error?.error || error.error?.message || error.message;
        
        // Handle 401 Unauthorized
        if (error.status === 401) {
          if (isLoginRequest || isRegisterRequest || isGoogleAuthRequest) {
            // Expected: User entered invalid credentials or registration failed
            // Silently pass error to component - no logging noise
            // Component will display user-friendly error message
          } else if (isAuthMeRequest) {
            // Token validation failed - clear token silently without redirect
            if (DEBUG_MODE) {
              console.warn('Token invalid, clearing session');
            }
            // Clear session but don't redirect - let the app continue as guest
            localStorage.removeItem('ponsai_token');
          } else if (isPublicRoute) {
            // Public routes should never get 401 - this is unexpected
            if (DEBUG_MODE) {
              console.error('Unexpected 401 on public route:', req.url);
            }
          } else {
            // Protected route with invalid/expired token
            if (DEBUG_MODE) {
              console.warn('Session expired on protected route:', req.url);
            }
            // Clear session and redirect to login with returnUrl
            localStorage.removeItem('ponsai_token');
            const currentUrl = router.url;
            router.navigate(['/auth/login'], {
              queryParams: { returnUrl: currentUrl }
            });
          }
        }
        
        // Handle 403 Forbidden
        if (error.status === 403) {
          console.warn('403 Forbidden - Insufficient permissions:', req.url);
          errorMessage = 'You do not have permission to perform this action';
        }
        
        // Handle 503 Service Unavailable (Maintenance Mode)
        if (error.status === 503) {
          if (error.error?.maintenanceMode) {
            if (DEBUG_MODE) {
              console.log('Maintenance Mode Active - Redirecting to maintenance page');
            }
            // Redirect to maintenance page
            router.navigate(['/maintenance']);
          }
        }
        
        // Handle 404 Not Found
        if (error.status === 404) {
          if (DEBUG_MODE) {
            console.warn('404 Not Found:', req.url);
          }
        }
      }

      // Minimal logging for production - only log unexpected errors
      if (DEBUG_MODE && !isLoginRequest && !isRegisterRequest && error.status >= 500) {
        console.error('HTTP Error:', error.status, errorMessage, req.url);
      }

      // Normalize backend message once so all pages/components receive same friendly text
      const normalizedMessage = normalizeApiErrorMessage(errorMessage);
      if (normalizedMessage !== errorMessage) {
        const normalizedPayload =
          typeof error.error === 'object' && error.error !== null
            ? { ...error.error, error: normalizedMessage, message: normalizedMessage }
            : { error: normalizedMessage, message: normalizedMessage };

        error = new HttpErrorResponse({
          error: normalizedPayload,
          headers: error.headers,
          status: error.status,
          statusText: error.statusText,
          url: error.url || undefined
        });
      }
      
      // Return the original error response for component handling
      return throwError(() => error);
    })
  );
};

