import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModificarEnvioComponent } from './modificar-envio.component';

describe('ModificarEnvioComponent', () => {
  let component: ModificarEnvioComponent;
  let fixture: ComponentFixture<ModificarEnvioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModificarEnvioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModificarEnvioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
