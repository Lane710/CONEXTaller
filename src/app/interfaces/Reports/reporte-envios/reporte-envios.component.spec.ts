import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReporteEnviosComponent } from './reporte-envios.component';

describe('ReporteEnviosComponent', () => {
  let component: ReporteEnviosComponent;
  let fixture: ComponentFixture<ReporteEnviosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReporteEnviosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReporteEnviosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
