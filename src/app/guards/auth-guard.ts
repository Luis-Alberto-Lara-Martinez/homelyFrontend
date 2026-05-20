import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Users } from '../services/users/users';

export const authGuard: CanActivateFn = (route, state) => {
  const usersService = inject(Users);
  const router = inject(Router);

  // Verificamos en el servicio si el token existe
  if (!usersService.isAuthenticated()) {
    // Si NO está logueado, lo mandamos expulsado al /login
    router.navigate(['/login']);
    return false;
  }

  // Si la ruta empieza con /admin, verificamos que el rol sea 'admin'
  if (state.url.startsWith('/admin')) {
    if (!usersService.isAdmin()) {
      // Si no es admin, denegamos el acceso y redirigimos a /home
      router.navigate(['/home']);
      return false;
    }
  }

  return true;
};
