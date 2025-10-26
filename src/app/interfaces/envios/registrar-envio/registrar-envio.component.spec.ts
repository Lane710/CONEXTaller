import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrarEnvioComponent } from './registrar-envio.component';

describe('RegistrarEnvioComponent', () => {
  let component: RegistrarEnvioComponent;
  let fixture: ComponentFixture<RegistrarEnvioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarEnvioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrarEnvioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
