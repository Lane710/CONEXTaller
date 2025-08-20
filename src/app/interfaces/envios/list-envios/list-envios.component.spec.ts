import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListEnviosComponent } from './list-envios.component';

describe('ListEnviosComponent', () => {
  let component: ListEnviosComponent;
  let fixture: ComponentFixture<ListEnviosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListEnviosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListEnviosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
