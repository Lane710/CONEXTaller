import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListadoProveedorComponent } from './listado-proveedor.component';

describe('ListadoProveedorComponent', () => {
  let component: ListadoProveedorComponent;
  let fixture: ComponentFixture<ListadoProveedorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListadoProveedorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListadoProveedorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
