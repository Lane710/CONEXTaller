import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '../../models/api-response';
import { Observable } from 'rxjs';
import { direccionesEnvio } from '../../models/PedidosEnviosDetalles/direccionesEnvio';

@Injectable({
  providedIn: 'root'
})
export class DetalleEnviosService {

  private Url='http://localhost:8080/direcciones-envio/';;

  constructor( private http:HttpClient) { }


  listado():Observable<ApiResponse>{
    return this.http.get<ApiResponse>(`${this.Url}findAll`);
  }

  save(envio:direccionesEnvio):Observable<ApiResponse>{
      return this.http.post<ApiResponse>(`${this.Url}save`,envio);
    }

}
