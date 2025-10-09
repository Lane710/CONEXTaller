import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegistrarSubcategoriaComponent } from './registrar-sub-categoria.component';



describe('RegistrarSubCategoriaComponent', () => {
  let component: RegistrarSubcategoriaComponent;
  let fixture: ComponentFixture<RegistrarSubcategoriaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarSubcategoriaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrarSubcategoriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
