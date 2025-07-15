import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModificarUserComponent } from './modificar-user.component';

describe('ModificarUserComponent', () => {
  let component: ModificarUserComponent;
  let fixture: ComponentFixture<ModificarUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModificarUserComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModificarUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
