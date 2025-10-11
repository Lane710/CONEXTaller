import { TestBed } from '@angular/core/testing';

import { VariantesService } from './variantes.service';

describe('VariantesService', () => {
  let service: VariantesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VariantesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
