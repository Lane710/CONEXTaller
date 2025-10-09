import { TestBed } from '@angular/core/testing';
import { SubcategoriaService } from './subcategoria-service.service';



describe('SubcategoriaServiceService', () => {
  let service: SubcategoriaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SubcategoriaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
