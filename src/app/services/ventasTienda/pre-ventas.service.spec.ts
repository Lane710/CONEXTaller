import { TestBed } from '@angular/core/testing';

import { PreVentasService } from './pre-ventas.service';

describe('PreVentasService', () => {
  let service: PreVentasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PreVentasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
