import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Users {
  // Usamos el entorno para que coja http://localhost:8080/api/user
  private baseUrl = environment.backendUrl + '/api/user';

  // Estado global del usuario
  private userSubject = new BehaviorSubject<any>(null);
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
  }

  clearCurrentUser() {
    this.userSubject.next(null);
  }

  // 1. Añadimos método para Iniciar Sesión usando la ruta del backend
  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${environment.backendUrl}/local/login`, credentials);
  }

  oauth2login(idToken: string): Observable<any> {
    const headers: HttpHeaders = new HttpHeaders().set('Authorization', `Bearer ${idToken}`);
    return this.http.post<any>(`${environment.backendUrl}/oauth2/login`, {}, { headers });
  }

  oauth2Register(idToken: string): Observable<any> {
    const headers: HttpHeaders = new HttpHeaders().set('Authorization', `Bearer ${idToken}`);
    return this.http.post<any>(`${environment.backendUrl}/oauth2/register`, {}, { headers });
  }

  // Registrar un nuevo usuario
  register(userData: any): Observable<any> {
    return this.http.post<any>(`${environment.backendUrl}/local/register`, userData);
  }

  // 2. Añadimos método robusto para verificar si el usuario tiene sesión iniciada
  isAuthenticated(): boolean {
    try {
      const token = localStorage.getItem('token');
      // Verificamos que sea válido y no sean textos 'null' residuales
      return !!token && token !== 'null' && token !== 'undefined';
    } catch (e) {
      // Evita errores en SSR (Server-Side Rendering)
      return false;
    }
  }

  // Obtener perfil del usuario autenticado (GET /api/user/profile)
  getUserProfile(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any>(`${this.baseUrl}/profile`, { headers }).pipe(
      tap(user => this.userSubject.next(user))
    );
  }

  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  isAdmin(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;

    const payload = this.decodeToken(token);
    if (!payload) return false;

    // Extraemos el rol. Dependiendo de tu back, puede estar en 'role', 'roles' o 'sub'
    const role = payload.role || payload.roles || payload.authorities;

    const isAdminRole = Array.isArray(role)
      ? role.some(r => r.toLowerCase() === 'admin')
      : (typeof role === 'string' && role.toLowerCase() === 'admin');

    return isAdminRole;
  }

  // Actualizar perfil (PUT /api/user/profile)
  updateUserProfile(name?: string, avatarFile?: File): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    const formData = new FormData();
    if (name) {
      // Usamos un Blob para el String si es @RequestPart en el back
      formData.append('name', new Blob([name], { type: 'application/json' }));
    }
    if (avatarFile) {
      formData.append('avatarFile', avatarFile);
    }

    return this.http.put<any>(`${this.baseUrl}/profile`, formData, { headers }).pipe(
      tap(user => this.userSubject.next(user))
    );
  }

  // Cambiar contraseña (PUT /api/user/password)
  updateUserPassword(passwordData: { password: string; confirmedPassword: string }): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put<any>(`${this.baseUrl}/password`, passwordData, { headers });
  }

  // Obtener todos los usuarios (para admin, GET /admin/users - si está habilitado)
  getAllUsers(page: number, size: number): Observable<any[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<any[]>(`${environment.backendUrl}/admin/users`, { "page": page, "size": size }, { headers });
  }

  // Delete user (para admin, DELETE /admin/user/{id} - si está habilitado)
  deleteUser(email: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.delete<any>(`${environment.backendUrl}/admin/user`, {
      headers: headers,
      body: { email: email }
    });
  }

  getAllRoles(): Observable<any[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any[]>(`${environment.backendUrl}/admin/user/roles`, { headers });
  }

  getAllStatuses(): Observable<any[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any[]>(`${environment.backendUrl}/admin/user/statuses/user/statuses`, { headers });
  }

  updateUserRole(userEmail: string, role: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put<any>(`${environment.backendUrl}/admin/user/role`, { "email": userEmail, "role": role }, { headers });
  }

  updateUserStatus(userEmail: string, status: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put<any>(`${environment.backendUrl}/admin/user/status`, { "email": userEmail, "status": status }, { headers });
  }

  postUser(name: string, email: string, role: string, status: string, password: string, confirmedPassword: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<any>(`${environment.backendUrl}/admin/user`, { "name": name, "email": email, "role": role, "status": status, "password": password, "confirmedPassword": confirmedPassword }, { headers });
  }

  getUser(email: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any>(`${environment.backendUrl}/admin/user`, {
      headers: headers,
      params: { "email": email }
    });
  }

  getFavouritesProperties(): Observable<any[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any[]>(`${environment.backendUrl}/api/favourites`, { headers });
  }

  postFavouriteProperty(id: number): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<any>(`${environment.backendUrl}/api/favourites`, { "propertyId": id }, { headers });
  }

  deleteFavouriteProperty(id: number): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.delete<any>(`${environment.backendUrl}/api/favourites/${id}`, { headers });
  }
}
