// src/app/prueba.component.ts
import { Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import Modal from 'bootstrap/js/dist/modal';
declare var bootstrap: any;

@Component({
  selector: 'app-prueba',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './prueba.component.html',
  styleUrl: './prueba.component.css'
})
export class PruebaComponent{
   // Método para mostrar el modal desde otro lugar
  mostrarModal(): void {
    const modalElement = document.getElementById('modalExitoCategoria');
    if (modalElement) {
      const modalExito = new Modal(modalElement);
      modalExito.show();
    }
  }

  onContinuar(): void {
    console.log('Continuar después del éxito');
    // Aquí puedes redirigir o ejecutar otra acción:
    // this.router.navigate(['/home']);
  }
}