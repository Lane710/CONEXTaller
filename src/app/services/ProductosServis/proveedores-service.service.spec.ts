import { TestBed } from '@angular/core/testing';

import { ProveedoresServiceService } from './proveedores-service.service';

describe('ProveedoresServiceService', () => {
  let service: ProveedoresServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProveedoresServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
