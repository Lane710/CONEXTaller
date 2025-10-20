import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportePedidosComponent } from './reporte-pedidos.component';

describe('ReportePedidosComponent', () => {
  let component: ReportePedidosComponent;
  let fixture: ComponentFixture<ReportePedidosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportePedidosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportePedidosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
