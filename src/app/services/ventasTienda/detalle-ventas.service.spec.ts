import { TestBed } from '@angular/core/testing';

import { DetalleVentasService } from './detalle-ventas.service';

describe('DetalleVentasService', () => {
  let service: DetalleVentasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DetalleVentasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
