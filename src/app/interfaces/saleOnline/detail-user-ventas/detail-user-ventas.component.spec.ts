import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailUserVentasComponent } from './detail-user-ventas.component';

describe('DetailUserVentasComponent', () => {
  let component: DetailUserVentasComponent;
  let fixture: ComponentFixture<DetailUserVentasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailUserVentasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailUserVentasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
