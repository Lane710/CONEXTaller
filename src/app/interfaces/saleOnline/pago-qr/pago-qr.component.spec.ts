import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagoQRComponent } from './pago-qr.component';

describe('PagoQRComponent', () => {
  let component: PagoQRComponent;
  let fixture: ComponentFixture<PagoQRComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PagoQRComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PagoQRComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
