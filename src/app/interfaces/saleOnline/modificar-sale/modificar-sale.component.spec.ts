import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModificarSaleComponent } from './modificar-sale.component';

describe('ModificarSaleComponent', () => {
  let component: ModificarSaleComponent;
  let fixture: ComponentFixture<ModificarSaleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModificarSaleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModificarSaleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
