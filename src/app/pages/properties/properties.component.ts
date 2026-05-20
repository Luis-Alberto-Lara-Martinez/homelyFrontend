import { Component, OnInit, ChangeDetectorRef, HostListener, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Properties } from '../../services/properties/properties';
import { FeaturedPropertiesComponent } from '../../components/featured-properties/featured-properties.component';
import { CtaBannerComponent } from '../../components/cta-banner/cta-banner.component';

declare let L: any;

@Component({
  selector: 'app-properties-page',
  standalone: true,
  imports: [CommonModule, FormsModule, FeaturedPropertiesComponent, CtaBannerComponent],
  templateUrl: './properties.component.html'
})
export class PropertiesComponent implements OnInit {
  allProperties: any[] = [];
  propertiesList: any[] = [];
  isSearchFiltered: boolean = false;
  searchRadiusKm: number = 2;
  isLoading: boolean = true;

  // Variables de ubicación/mapa
  location: string = '';
  showMapModal: boolean = false;
  private map: any;
  private marker: any;
  selectedLatitude: number | null = null;
  selectedLongitude: number | null = null;
  distance: number = 2;
  searchQuery: string = '';
  tempLocationData: any = null;
  private circle: any;

  // Filtros de búsqueda

  filterTransaction: string = '';
  filterType: string = '';
  filterMinPrice: number | null = null;
  filterMaxPrice: number | null = null;
  filterBeds: string = '';
  filterSort: string = '';

  // Filtros adicionales toggle y parámetros
  showExtraFilters: boolean = false;
  filterBaths: string = '';
  filterMinSize: number | null = null;
  filterMaxSize: number | null = null;


  // Estado para Dropdowns personalizados
  activeDropdown: string | null = null;

  transactionOptions: { label: string, value: string }[] = [
    { label: 'Cualquiera', value: '' }
  ];

  typeOptions: { label: string, value: string }[] = [
    { label: 'Todos los tipos', value: '' }
  ];

  bedsOptions = [
    { label: 'Cualquiera', value: '' },
    { label: '1 Habitación', value: '1' },
    { label: '2 Habitaciones', value: '2' },
    { label: '3 Habitaciones', value: '3' },
    { label: '4 o más Habitaciones', value: '4' }
  ];

  bathsOptions = [
    { label: 'Cualquiera', value: '' },
    { label: '1 Baño', value: '1' },
    { label: '2 Baños', value: '2' },
    { label: '3 o más Baños', value: '3' }
  ];

  sortOptions = [
    { label: 'Destacados', value: '' },
    { label: 'Precio: menor a mayor', value: 'price_asc' },
    { label: 'Precio: mayor a menor', value: 'price_desc' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private propertiesService: Properties,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) { }

  @HostListener('document:click')
  onDocumentClick() {
    // Cerrar cualquier dropdown abierto si se hace clic fuera
    this.activeDropdown = null;
  }

  toggleDropdown(dropdownName: string, event: Event) {
    event.stopPropagation();
    if (this.activeDropdown === dropdownName) {
      this.activeDropdown = null;
    } else {
      this.activeDropdown = dropdownName;
    }
  }

  selectOption(filterName: string, value: string, event: Event) {
    event.stopPropagation();
    if (filterName === 'transaction') {
      this.filterTransaction = value;
    } else if (filterName === 'type') {
      this.filterType = value;
      if (value !== '' && value !== 'residencia') {
        this.filterBeds = '';
        this.filterBaths = '';
      }
    } else if (filterName === 'beds') {
      this.filterBeds = value;
    } else if (filterName === 'baths') {
      this.filterBaths = value;
    } else if (filterName === 'sort') {
      this.filterSort = value;
    }
    this.activeDropdown = null;
    this.applyFilters();
  }

  getDisplayValue(filterName: string): string {
    if (filterName === 'transaction') {
      const val = this.transactionOptions.find(o => o.value === this.filterTransaction)?.label || 'Cualquiera';
      return val.charAt(0).toUpperCase() + val.slice(1);
    } else if (filterName === 'type') {
      const val = this.typeOptions.find(o => o.value === this.filterType)?.label || 'Todos los tipos';
      return val.charAt(0).toUpperCase() + val.slice(1);
    } else if (filterName === 'beds') {
      return this.bedsOptions.find(o => o.value === this.filterBeds)?.label || 'Cualquiera';
    } else if (filterName === 'baths') {
      return this.bathsOptions.find(o => o.value === this.filterBaths)?.label || 'Cualquiera';
    } else if (filterName === 'sort') {
      return this.sortOptions.find(o => o.value === this.filterSort)?.label || 'Destacados';
    }
    return '';
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.filterTransaction) count++;
    if (this.filterType) count++;
    if (this.filterMinPrice !== null) count++;
    if (this.filterMaxPrice !== null) count++;
    if (this.filterBeds) count++;
    if (this.filterBaths) count++;
    if (this.filterMinSize !== null) count++;
    if (this.filterMaxSize !== null) count++;

    return count;
  }

  loadPropertyTypes() {
    this.propertiesService.getAllPropertyTypes().subscribe({
      next: (types: any[]) => {
        if (types && Array.isArray(types)) {
          this.typeOptions = [
            { label: 'Todos los tipos', value: '' },
            ...types.map(t => ({
              label: t.name,
              value: t.name.toLowerCase()
            }))
          ];
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error fetching property types:', err);
      }
    });
  }

  loadPropertyTransactions() {
    this.propertiesService.getAllPropertyTransactions().subscribe({
      next: (transactions: any[]) => {
        if (transactions && Array.isArray(transactions)) {
          this.transactionOptions = [
            { label: 'Cualquiera', value: '' },
            ...transactions.map(t => ({
              label: t.name,
              value: t.name.toLowerCase()
            }))
          ];
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error fetching property transactions:', err);
      }
    });
  }

  ngOnInit(): void {
    this.loadPropertyTypes();
    this.loadPropertyTransactions();
    this.route.queryParams.subscribe(params => {
      this.filterTransaction = params['transaction'] || '';
      this.filterType = params['type'] || '';

      const lat = params['lat'];
      const lng = params['lng'];
      const rad = params['rad'];

      if (lat && lng) {
        this.selectedLatitude = Number(lat);
        this.selectedLongitude = Number(lng);
        this.distance = Number(rad) || 2;
        this.location = `${this.selectedLatitude.toFixed(4)}, ${this.selectedLongitude.toFixed(4)}`;
        this.reverseGeocode(this.selectedLatitude, this.selectedLongitude).then(() => {
          if (this.tempLocationData) {
            this.location = this.tempLocationData;
            this.cdr.detectChanges();
          }
        });
        this.loadPropertiesWithinRadius(this.selectedLatitude, this.selectedLongitude, this.distance);
      } else {
        this.loadAllProperties();
      }

      if (this.allProperties.length > 0) {
        this.applyFilters();
      }
    });

    setTimeout(() => {
      const element = document.getElementById('propiedades');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 300);
  }

  loadAllProperties() {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.propertiesService.getPropertiesWithinRadius(40.416775, -3.703790, 5000).subscribe({
      next: (data: any) => {
        let list: any[] = [];
        if (Array.isArray(data)) {
          list = data;
        } else if (data && Array.isArray(data.data)) {
          list = data.data;
        } else if (data && Array.isArray(data.properties)) {
          list = data.properties;
        } else if (data && Array.isArray(data.content)) {
          list = data.content;
        }
        this.allProperties = list;
        this.applyFilters(); // Aplica los filtros iniciales (vacio)
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error loading all properties:', err);
        this.allProperties = [];
        this.propertiesList = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters() {
    let filtered = this.allProperties.filter((prop: any) => {
      // 1. Filtrar por Operación (Venta / Alquiler)
      if (this.filterTransaction) {
        const propTrans = (prop.transaction || prop.operacion || prop.status || '').toLowerCase();
        if (propTrans !== this.filterTransaction.toLowerCase()) {
          return false;
        }
      }

      // 2. Filtrar por Tipo de Inmueble (Residencia, Garaje, etc)
      if (this.filterType) {
        const propType = (prop.type || prop.tipoVivienda || prop.residence?.type || '').toLowerCase();
        if (propType !== this.filterType.toLowerCase()) {
          return false;
        }
      }

      // 3. Filtrar por Precio
      const price = Number(prop.price) || 0;
      if (this.filterMinPrice !== null && price < this.filterMinPrice) {
        return false;
      }
      if (this.filterMaxPrice !== null && price > this.filterMaxPrice) {
        return false;
      }

      // 4. Filtrar por Habitaciones
      if (this.filterBeds) {
        const beds = Number(prop.residence?.bedrooms || prop.beds || prop.habitaciones) || 0;
        const requiredBeds = Number(this.filterBeds);

        if (requiredBeds === 4) {
          if (beds < 4) return false;
        } else {
          if (beds !== requiredBeds) return false;
        }
      }

      // 4b. Filtrar por Baños (Filtro Adicional)
      if (this.filterBaths) {
        const baths = Number(prop.residence?.bathrooms || prop.baths || prop.banos || prop.residence?.baths) || 0;
        const requiredBaths = Number(this.filterBaths);
        if (requiredBaths === 3) {
          if (baths < 3) return false;
        } else {
          if (baths !== requiredBaths) return false;
        }
      }

      // 4c. Filtrar por Superficie (Filtro Adicional)
      const size = Number(prop.surface || prop.residence?.size || prop.size || prop.superficie || prop.m2) || 0;
      if (this.filterMinSize !== null && size < this.filterMinSize) {
        return false;
      }
      if (this.filterMaxSize !== null && size > this.filterMaxSize) {
        return false;
      }



      return true;
    });

    // 5. Aplicar ordenación
    if (this.filterSort) {
      filtered.sort((a: any, b: any) => {
        if (this.filterSort === 'price_asc') {
          return (Number(a.price) || 0) - (Number(b.price) || 0);
        } else if (this.filterSort === 'price_desc') {
          return (Number(b.price) || 0) - (Number(a.price) || 0);
        } else if (this.filterSort === 'beds_desc') {
          const bedsA = Number(a.residence?.bedrooms || a.beds || a.habitaciones) || 0;
          const bedsB = Number(b.residence?.bedrooms || b.beds || b.habitaciones) || 0;
          return bedsB - bedsA;
        }
        return 0;
      });
    }

    this.propertiesList = filtered;
    this.cdr.detectChanges();
  }

  resetFilters() {
    this.filterTransaction = '';
    this.filterType = '';
    this.filterMinPrice = null;
    this.filterMaxPrice = null;
    this.filterBeds = '';
    this.filterSort = '';
    this.filterBaths = '';
    this.filterMinSize = null;
    this.filterMaxSize = null;

    this.applyFilters();
  }

  openMapModal() {
    this.showMapModal = true;
    if (this.location && !this.tempLocationData) {
      this.searchQuery = this.location;
    }
    setTimeout(() => {
      this.initMap();
      if (this.searchQuery) {
        this.searchCity();
      }
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 300);
    }, 100);
  }

  closeMapModal() {
    this.showMapModal = false;
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.marker = null;
    this.circle = null;
    this.cdr.detectChanges();
  }

  initMap() {
    if (this.map) return;

    // Madrid center as default location
    const defaultLat = this.selectedLatitude || 40.4168;
    const defaultLng = this.selectedLongitude || -3.7038;
    this.map = L.map('map-container').setView([defaultLat, defaultLng], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    if (this.selectedLatitude && this.selectedLongitude) {
      this.setMarkerAndCircle(this.selectedLatitude, this.selectedLongitude);
    }

    this.map.on('click', (e: any) => {
      this.setMarkerAndCircle(e.latlng.lat, e.latlng.lng);
      this.reverseGeocode(e.latlng.lat, e.latlng.lng);
    });
  }

  setMarkerAndCircle(lat: number, lng: number) {
    this.selectedLatitude = lat;
    this.selectedLongitude = lng;

    if (this.marker) {
      this.map.removeLayer(this.marker);
    }
    if (this.circle) {
      this.map.removeLayer(this.circle);
    }

    const customIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    this.marker = L.marker([lat, lng], { icon: customIcon }).addTo(this.map);

    // Draw circle with brand colors
    this.circle = L.circle([lat, lng], {
      color: '#2563EB', // blue-600
      fillColor: '#3B82F6', // blue-500
      fillOpacity: 0.15,
      weight: 2,
      radius: this.distance * 1000
    }).addTo(this.map);

    this.map.setView([lat, lng], 13);
  }

  updateCircle() {
    if (this.circle && this.marker) {
      this.circle.setRadius(this.distance * 1000);
    }
  }

  async reverseGeocode(lat: number, lon: number) {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`);
      const data = await response.json();

      if (data && data.address) {
        const city = data.address.city || data.address.town || data.address.village || data.address.county;
        const state = data.address.state || data.address.region;

        if (city && state) {
          this.tempLocationData = `${city}, ${state}`;
        } else if (city) {
          this.tempLocationData = city;
        } else if (state) {
          this.tempLocationData = state;
        } else if (data.display_name) {
          this.tempLocationData = data.display_name.split(',')[0];
        }
      } else {
        this.tempLocationData = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      this.tempLocationData = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }
    this.cdr.detectChanges();
  }

  async searchCity() {
    if (!this.searchQuery) return;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.searchQuery)}&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        this.setMarkerAndCircle(lat, lon);
        this.reverseGeocode(lat, lon);
      }
    } catch (err) {
      console.error('Error searching city:', err);
    }
  }

  useCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          this.setMarkerAndCircle(lat, lon);
          this.reverseGeocode(lat, lon);
        },
        (error) => {
          console.error('Error obtaining location', error);
          alert('No se ha podido acceder a la ubicación. Revisa los permisos del navegador.');
        }
      );
    } else {
      alert('Tu navegador no soporta geolocalización.');
    }
  }

  applyLocation() {
    if (this.tempLocationData) {
      this.location = this.tempLocationData;
    }
    this.closeMapModal();
  }

  applyAndSearch() {
    this.applyLocation();
    if (this.selectedLatitude !== null && this.selectedLongitude !== null) {
      this.loadPropertiesWithinRadius(this.selectedLatitude, this.selectedLongitude, this.distance);
    }
  }

  loadPropertiesWithinRadius(lat: number, lng: number, rad: number) {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.propertiesService.getPropertiesWithinRadius(lat, lng, rad).subscribe({
      next: (data: any) => {
        let list: any[] = [];
        if (Array.isArray(data)) {
          list = data;
        } else if (data && Array.isArray(data.data)) {
          list = data.data;
        } else if (data && Array.isArray(data.properties)) {
          list = data.properties;
        } else if (data && Array.isArray(data.content)) {
          list = data.content;
        }
        this.allProperties = list;
        this.applyFilters();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error loading properties within radius:', err);
        this.allProperties = [];
        this.propertiesList = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
