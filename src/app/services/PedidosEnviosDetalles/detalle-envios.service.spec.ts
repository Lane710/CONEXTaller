import { TestBed } from '@angular/core/testing';

import { DetalleEnviosService } from './detalle-envios.service';

describe('DetalleEnviosService', () => {
  let service: DetalleEnviosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DetalleEnviosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
