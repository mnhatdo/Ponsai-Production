import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Get token directly from localStorage to avoid circular dependency
  // (AuthService uses HttpClient which uses this interceptor)
  const token = localStorage.getItem('furni_token');

  // Add token to request if available
  // Backend will ignore it for public endpoints, use it for protected ones
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};
