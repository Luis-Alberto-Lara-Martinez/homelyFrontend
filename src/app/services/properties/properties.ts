import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Properties {
  private baseUrl = environment.backendUrl + '/api/properties'; // Base URL del backend

  // Cache para almacenar las propiedades devueltas de la búsqueda en el frontend
  public latestResults: any[] = [];

  constructor(private http: HttpClient) { }

  // Obtener todas las propiedades (POST /admin/properties)
  getAllProperties(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<any>(`${environment.backendUrl}/admin/properties`, { page: 0, size: 9999 }, { headers }).pipe(
      tap((results: any) => {
        const list = (results && Array.isArray(results.content)) ? results.content : results;
        console.log('Properties Service - Guardando listado completo:', list);
        this.latestResults = list;
      })
    );
  }

  // Obtener propiedades dentro de un radio (POST /api/properties)
  getPropertiesWithinRadius(latitude: number, longitude: number, radiusKm: number): Observable<any[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const body = {
      latitude: latitude,
      longitude: longitude,
      radiusKm: radiusKm
    };
    return this.http.post<any[]>(`${this.baseUrl}`, body, { headers }).pipe(
      tap((results: any[]) => {
        console.log('Properties Service - Guardando búsqueda de radio:', results);
        this.latestResults = results;
      })
    );
  }

  // Obtener una propiedad por ID (asume GET /api/properties/{id})
  getPropertyById(id: number): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<any>(`${environment.backendUrl}/api/property/${id}`, {}, { headers });
  }

  // Crear una nueva propiedad (asume POST /api/properties)
  createProperty(propertyData: any): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<any>(`${this.baseUrl}`, propertyData, { headers });
  }

  // Actualizar una propiedad (asume PUT /api/properties/{id})
  updateProperty(id: number, propertyData: any): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put<any>(`${this.baseUrl}/${id}`, propertyData, { headers });
  }

  // Eliminar una propiedad (asume DELETE /api/properties/{id})
  deleteProperty(id: number): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.delete<any>(`${this.baseUrl}/${id}`, { headers });
  }

  getAllPropertyTypes(): Observable<any[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any[]>(`${this.baseUrl}/types`, { headers });
  }

  getAllPropertyTransactions(): Observable<any[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any[]>(`${this.baseUrl}/transactions`, { headers });
  }

  sendContactRequest(requestData: { email: string, name: string, message: string }): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<any>(`${environment.backendUrl}/api/contact`, requestData, { headers });
  }

  sendWorkWithUs(formData: FormData): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<any>(`${environment.backendUrl}/api/work-with-us`, formData, { headers });
  }
}