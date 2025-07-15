import { TestBed } from '@angular/core/testing';

import { ProductoImagenService } from './producto-imagen.service';

describe('ProductoImagenService', () => {
  let service: ProductoImagenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductoImagenService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
