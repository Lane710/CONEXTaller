import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListSalesComponent } from '../../storeSale/list-sales/list-sales.component';



describe('ListSaleComponent', () => {
  let component: ListSalesComponent;
  let fixture: ComponentFixture<ListSalesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListSalesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListSalesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
