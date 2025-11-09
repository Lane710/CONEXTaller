import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreSaleComponent } from './pre-sale.component';

describe('PreSaleComponent', () => {
  let component: PreSaleComponent;
  let fixture: ComponentFixture<PreSaleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreSaleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreSaleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
