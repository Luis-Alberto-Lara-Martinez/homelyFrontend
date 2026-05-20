import { Component, inject, ChangeDetectorRef, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Properties } from '../../services/properties/properties';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ventas.component.html'
})
export class VentasComponent implements OnInit, OnDestroy {
  private propertiesService = inject(Properties);
  private router = inject(Router);

  currentStep: number = 1;
  totalSteps: number = 4;

  // Selected Images
  selectedImages: { file: File, previewUrl: string }[] = [];

  // Form Data
  formData = {
    tipoVivienda: '',
    operacion: '',
    titulo: '',
    direccion: '',
    ciudad: '',
    codigoPostal: '',
    latitud: '',
    longitud: '',
    habitaciones: 1,
    banos: 1,
    metros: '',
    extrasCasa: {
      garaje: false,
      piscina: false,
      ascensor: false,
      terraza: false
    },
    extrasGaraje: {
      cubierto: false,
      seguridad24h: false,
      puertaAutomatica: false
    },
    extrasTrastero: {
      acceso24h: false,
      seguridad: false,
      estanterias: false
    },
    precio: '',
    descripcion: '',
    telefono: ''
  };

  isSearchingLocation = false;
  locationError = '';

  isGeneratingDescription = false;
  descriptionError = '';

  tiposVivienda: any[] = [];
  transacciones: any[] = [];

  // Icon map to preserve local icons when backend doesn't provide them
  private ICON_MAP: Record<string, string> = {
    casa: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    apartamento: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    garaje: 'M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6M8 14h8m-4-4v8',
    trastero: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
  };

  extras: any[] = [];

  getStepTitle(): string {
    switch (this.currentStep) {
      case 1: return 'Datos básicos del anuncio';
      case 2: return 'Ubicación del inmueble';
      case 3: return 'Características principales';
      case 4: return 'Detalles comerciales del anuncio';
      default: return '';
    }
  }

  ngOnInit(): void {
    this.loadTypesAndTransactions();
  }

  private loadTypesAndTransactions() {
    // Cargar tipos de inmueble
    this.propertiesService.getAllPropertyTypes().subscribe({
      next: (results: any[]) => {
        this.tiposVivienda = (results || []).map(item => {
          if (typeof item === 'string') return { id: item, nombre: item, name: item, icon: this.ICON_MAP[item] || '' };
          const id = item.id ?? item.code ?? item.name ?? item.key ?? '';
          const nombre = item.name ?? item.label ?? item.displayName ?? id;
          return { id, nombre, name: item.name ?? nombre, icon: item.icon ?? this.ICON_MAP[id] ?? '' };
        });
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando tipos de inmueble:', err);
        // fallback local por si hay error
        this.tiposVivienda = [
          { id: 'casa', nombre: 'Casa o Chalet', name: 'casa', icon: this.ICON_MAP['casa'] },
          { id: 'apartamento', nombre: 'Apartamento', name: 'apartamento', icon: this.ICON_MAP['apartamento'] },
          { id: 'garaje', nombre: 'Garaje', name: 'garaje', icon: this.ICON_MAP['garaje'] },
          { id: 'trastero', nombre: 'Trastero', name: 'trastero', icon: this.ICON_MAP['trastero'] }
        ];
        this.cdr.detectChanges();
      }
    });

    // Cargar transacciones
    this.propertiesService.getAllPropertyTransactions().subscribe({
      next: (results: any[]) => {
        this.transacciones = (results || []).map(item => {
          if (typeof item === 'string') return { id: item, nombre: item, name: item };
          const id = item.id ?? item.code ?? item.name ?? item.key ?? '';
          const nombre = item.name ?? item.label ?? item.displayName ?? id;
          return { id, nombre, name: item.name ?? nombre };
        });
        // keep default if none provided
        if (!this.transacciones || this.transacciones.length === 0) {
          this.transacciones = [{ id: 'venta', nombre: 'Venta', name: 'venta' }, { id: 'alquiler', nombre: 'Alquiler', name: 'alquiler' }];
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando transacciones:', err);
        this.transacciones = [{ id: 'venta', nombre: 'Venta', name: 'venta' }, { id: 'alquiler', nombre: 'Alquiler', name: 'alquiler' }];
        this.cdr.detectChanges();
      }
    });
  }

  isStepValid(step: number): boolean {
    switch (step) {
      case 1:
        return !!this.formData.tipoVivienda && !!this.formData.operacion;
      case 2:
        return !!this.formData.latitud && !!this.formData.longitud;
      case 3:
        return !!this.formData.metros && Number(this.formData.metros) > 0;
      case 4:
        return !!this.formData.titulo?.trim() &&
          !!this.formData.descripcion?.trim() &&
          !!this.formData.precio &&
          Number(this.formData.precio) > 0;
      default:
        return true;
    }
  }

  nextStep() {
    if (!this.isStepValid(this.currentStep)) {
      if (this.currentStep === 2) {
        this.locationError = 'Debe buscar y obtener la ubicación exacta del inmueble en el mapa antes de continuar.';
      }
      return;
    }
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  selectTipoVivienda(tipo: any) {
    this.formData.tipoVivienda = tipo;
    this.loadExtras(tipo);
  }

  loadExtras(typeId: any) {
    const numericId = Number(typeId);
    if (!isNaN(numericId)) {
      this.propertiesService.getAllExtrasByTypeId(numericId).subscribe({
        next: (extras: any[]) => {
          this.extras = (extras || []).map(e => ({ ...e, selected: false }));
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading extras:', err);
          this.extras = [];
          this.cdr.detectChanges();
        }
      });
    } else {
      this.extras = [];
    }
  }

  isResidence(): boolean {
    const selectedType = this.tiposVivienda.find(t => t.id === this.formData.tipoVivienda);
    if (!selectedType) return false;
    const name = (selectedType.nombre || selectedType.name || selectedType.id || '').toLowerCase();
    return name === 'casa' || name === 'apartamento' || name === 'residencia';
  }

  generarDescripcionIA() {
    this.isGeneratingDescription = true;
    this.descriptionError = '';

    const selectedExtras = this.extras.filter(e => e.selected).map(e => e.name);
    const selectedType = this.tiposVivienda.find(t => t.id === this.formData.tipoVivienda);
    const typeName = selectedType ? (selectedType.nombre || selectedType.name) : this.formData.tipoVivienda;
    const selectedTransaction = this.transacciones.find(t => t.id === this.formData.operacion);
    const transactionName = selectedTransaction ? (selectedTransaction.nombre || selectedTransaction.name) : this.formData.operacion;

    const payload = {
      type: typeName,
      transaction: transactionName,
      address: this.formData.direccion,
      city: this.formData.ciudad,
      surface: this.formData.metros,
      bedrooms: this.isResidence() ? this.formData.habitaciones : null,
      bathrooms: this.isResidence() ? this.formData.banos : null,
      extras: selectedExtras
    };

    this.propertiesService.generateDescription(payload).subscribe({
      next: (res: any) => {
        this.isGeneratingDescription = false;
        if (res && typeof res === 'string') {
          this.formData.descripcion = res;
        } else if (res && typeof res.description === 'string') {
          this.formData.descripcion = res.description;
        } else if (res && typeof res.result === 'string') {
          this.formData.descripcion = res.result;
        } else {
          console.warn('Estructura de respuesta inesperada:', res);
          this.formData.descripcion = JSON.stringify(res);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al generar descripción con IA:', err);
        this.descriptionError = 'No se pudo generar la descripción. Compruebe que el servicio de IA esté disponible.';
        this.isGeneratingDescription = false;
        this.cdr.detectChanges();
      }
    });
  }

  private cdr = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);

  async buscarUbicacion() {
    if (!this.formData.direccion || !this.formData.ciudad) {
      this.locationError = 'Por favor, introduce la dirección y ciudad completas.';
      this.formData.latitud = '';
      this.formData.longitud = '';
      return;
    }

    this.isSearchingLocation = true;
    this.locationError = '';
    this.cdr.detectChanges();

    try {
      let lat = '';
      let lon = '';

      // 1. Intentar geocodificar con la dirección completa tal como se ha introducido
      const query1 = `${this.formData.direccion}, ${this.formData.ciudad}, ${this.formData.codigoPostal || ''}, España`;
      const data1 = await this.queryGeocode(query1);

      if (data1 && data1.length > 0) {
        lat = data1[0].lat;
        lon = data1[0].lon;
      } else {
        // 2. Fallback: Si no encuentra nada, limpiar detalles de piso, puerta, bloque o letras
        // En España es común poner "Calle Mayor 12, 3º B", lo cual rompe a Nominatim.
        const direccionLimpia = this.formData.direccion
          .split(',')[0] // Tomar la primera parte antes de la coma
          .replace(/\s*(?:\d+)?\s*(?:º|ª|piso|puerta|letra|bloque|bloq|esc|escalera|izq|der|duplicado|dup).*$/i, '')
          .trim();

        if (direccionLimpia && direccionLimpia.toLowerCase() !== this.formData.direccion.trim().toLowerCase()) {
          const query2 = `${direccionLimpia}, ${this.formData.ciudad}, España`;
          const data2 = await this.queryGeocode(query2);
          if (data2 && data2.length > 0) {
            lat = data2[0].lat;
            lon = data2[0].lon;
          }
        }
      }

      if (lat && lon) {
        this.formData.latitud = lat;
        this.formData.longitud = lon;
      } else {
        this.locationError = 'No se ha podido encontrar la dirección exacta en el mapa. Revisa el nombre de la calle e inténtalo de nuevo.';
        this.formData.latitud = '';
        this.formData.longitud = '';
      }
    } catch (error: any) {
      console.error(error);
      this.locationError = 'Error de conexión con el servicio de mapas. Comprueba tu conexión a internet o inténtalo más tarde.';
      this.formData.latitud = '';
      this.formData.longitud = '';
    } finally {
      this.isSearchingLocation = false;
      this.cdr.detectChanges();
    }
  }

  private async queryGeocode(query: string): Promise<any[]> {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500); // Timeout rápido de 3.5 segundos

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'es' // Forzar idioma español
        }
      });
      if (!response.ok) {
        return [];
      }
      return await response.json();
    } catch (e) {
      return [];
    } finally {
      clearTimeout(timeoutId);
    }
  }

  get mapUrl(): SafeResourceUrl | string {
    if (this.formData.latitud && this.formData.longitud) {
      const url = `https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(this.formData.longitud) - 0.005},${parseFloat(this.formData.latitud) - 0.005},${parseFloat(this.formData.longitud) + 0.005},${parseFloat(this.formData.latitud) + 0.005}&layer=mapnik&marker=${this.formData.latitud},${this.formData.longitud}`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
    return '';
  }

  ngOnDestroy() {
    this.selectedImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
  }

  onFilesSelected(event: any) {
    const files = event.target.files;
    if (files) {
      this.addFiles(files);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer?.files;
    if (files) {
      this.addFiles(files);
    }
  }

  private addFiles(files: FileList) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const previewUrl = URL.createObjectURL(file);
        this.selectedImages.push({ file, previewUrl });
      }
    }
    this.cdr.detectChanges();
  }

  removeImage(index: number) {
    const img = this.selectedImages[index];
    if (img) {
      URL.revokeObjectURL(img.previewUrl);
      this.selectedImages.splice(index, 1);
    }
    this.cdr.detectChanges();
  }

  isSubmitting = false;
  submitError = '';

  private buildFormData(formData: FormData, data: any, parentKey?: string) {
    if (data === null || data === undefined) {
      return;
    }

    if (data instanceof File) {
      formData.append(parentKey!, data);
    } else if (Array.isArray(data)) {
      data.forEach((element, index) => {
        this.buildFormData(formData, element, `${parentKey}[${index}]`);
      });
    } else if (typeof data === 'object') {
      Object.keys(data).forEach(key => {
        this.buildFormData(formData, data[key], parentKey ? `${parentKey}.${key}` : key);
      });
    } else {
      formData.append(parentKey!, data.toString());
    }
  }

  publicarAnuncio() {
    if (!this.isStepValid(this.currentStep)) return;

    this.isSubmitting = true;
    this.submitError = '';
    this.cdr.detectChanges();

    const addressDto = {
      street: this.formData.direccion,
      number: '',
      floor: '',
      door: '',
      postalCode: this.formData.codigoPostal,
      city: this.formData.ciudad,
      province: this.formData.ciudad,
      country: 'España',
      latitude: parseFloat(this.formData.latitud),
      longitude: parseFloat(this.formData.longitud)
    };

    const residenceDto = this.isResidence() ? {
      bedrooms: this.formData.habitaciones,
      bathrooms: this.formData.banos,
      conservation: 'Bueno',
      orientation: 'Norte'
    } : null;

    const extrasList = this.extras
      .filter(e => e.selected)
      .map(e => ({ id: e.id, name: e.name }));

    const selectedType = this.tiposVivienda.find(t => t.id === this.formData.tipoVivienda);
    const typeValue = selectedType ? (selectedType.name || selectedType.nombre || this.formData.tipoVivienda) : this.formData.tipoVivienda;

    const selectedTransaction = this.transacciones.find(t => t.id === this.formData.operacion);
    const transactionValue = selectedTransaction ? (selectedTransaction.name || selectedTransaction.nombre || this.formData.operacion) : this.formData.operacion;

    const imagesPayload = this.selectedImages.map((imgObj, index) => ({
      image: imgObj.file,
      displayOrder: index + 1
    }));

    const payload = {
      type: typeValue,
      status: 'disponible',
      transaction: transactionValue,
      title: this.formData.titulo,
      description: this.formData.descripcion,
      surface: parseInt(this.formData.metros),
      price: parseFloat(this.formData.precio),
      images: imagesPayload,
      extras: extrasList,
      address: addressDto,
      residence: residenceDto,
      energyCertificate: this.isResidence() ? {
        hasCertificate: false,
        consumptionScale: 'G',
        consumptionValue: 0,
        emissionsScale: 'G',
        emissionsValue: 0
      } : null
    };

    const formData = new FormData();
    this.buildFormData(formData, payload);

    this.propertiesService.createProperty(formData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/admin/propiedades'], { queryParams: { success: 'true' } });
      },
      error: (err) => {
        console.error('Error al registrar la propiedad:', err);
        this.submitError = 'Hubo un error al registrar la propiedad. Por favor, comprueba que el backend esté levantado y tenga el endpoint configurado.';
        this.isSubmitting = false;
        this.cdr.detectChanges();
      }
    });
  }
}

