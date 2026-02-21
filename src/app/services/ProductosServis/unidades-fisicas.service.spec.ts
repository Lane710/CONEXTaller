import { TestBed } from '@angular/core/testing';

import { UnidadesFisicasService } from './unidades-fisicas.service';

describe('UnidadesFisicasService', () => {
  let service: UnidadesFisicasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UnidadesFisicasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
