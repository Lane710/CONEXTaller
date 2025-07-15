import { TestBed } from '@angular/core/testing';

import { ProductoPropiedadService } from './producto-propiedad.service';

describe('ProductoPropiedadService', () => {
  let service: ProductoPropiedadService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductoPropiedadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
