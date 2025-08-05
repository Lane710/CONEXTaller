import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/api-response';
import { envios } from '../../models/PedidosEnviosDetalles/envios';

@Injectable({
  providedIn: 'root'
})
export class EnviosService {

  private Url='http://localhost:8080/envios/';
  
  constructor( private http:HttpClient) { }

  listado():Observable<ApiResponse>{
    return this.http.get<ApiResponse>(`${this.Url}findAll`);
  }

  save(envio:envios):Observable<ApiResponse>{
      return this.http.post<ApiResponse>(`${this.Url}save`,envio);
    }

}
