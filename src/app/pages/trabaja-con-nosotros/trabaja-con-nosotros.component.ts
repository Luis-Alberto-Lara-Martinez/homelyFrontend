import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Properties } from '../../services/properties/properties';

@Component({
  selector: 'app-trabaja-con-nosotros',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './trabaja-con-nosotros.component.html'
})
export class TrabajaConNosotrosComponent {
  formData = {
    name: '',
    email: '',
    phone: '',
    position: 'Agente Inmobiliario',
    message: ''
  };

  submitted = false;
  submissionError: string | null = null;
  selectedFile: File | null = null;

  positions = [
    'Agente Inmobiliario',
    'Asesor Financiero',
    'Marketing & Diseño',
    'Desarrollo de Software',
    'Atención al Cliente',
    'Administración'
  ];

  constructor(
    private propertiesService: Properties,
    private cdr: ChangeDetectorRef
  ) {}

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.cdr.detectChanges();
    }
  }

  onSubmit() {
    if (!this.selectedFile) return;
    this.submissionError = null;
    this.cdr.detectChanges();

    const formData = new FormData();
    formData.append('from', this.formData.email);
    formData.append('name', this.formData.name);
    formData.append('workingArea', this.formData.position);
    formData.append('phone', this.formData.phone);
    formData.append('description', this.formData.message);
    formData.append('cvFile', this.selectedFile);

    this.propertiesService.sendWorkWithUs(formData).subscribe({
      next: (response) => {
        console.log('Solicitud enviada con éxito:', response);
        this.submitted = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al enviar la solicitud de empleo:', err);
        this.submissionError = 'Ocurrió un error al enviar tu solicitud. Por favor, inténtalo de nuevo.';
        this.cdr.detectChanges();
      }
    });
  }
}
