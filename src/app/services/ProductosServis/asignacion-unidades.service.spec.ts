import { TestBed } from '@angular/core/testing';

import { AsignacionUnidadesService } from './asignacion-unidades.service';

describe('AsignacionUnidadesService', () => {
  let service: AsignacionUnidadesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AsignacionUnidadesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
