import { TestBed } from '@angular/core/testing';

import { DireccionEnvioServiceService } from './direccion-envio-service.service';

describe('DireccionEnvioServiceService', () => {
  let service: DireccionEnvioServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DireccionEnvioServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
