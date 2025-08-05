import { TestBed } from '@angular/core/testing';

import { DetallePedidosService } from './detalle-pedidos.service';

describe('DetallePedidosService', () => {
  let service: DetallePedidosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DetallePedidosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
