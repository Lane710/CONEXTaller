import { TestBed } from '@angular/core/testing';

import { TipoPropiedadServiceService } from './tipo-propiedad-service.service';

describe('TipoPropiedadServiceService', () => {
  let service: TipoPropiedadServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TipoPropiedadServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
