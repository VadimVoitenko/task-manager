import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class WebRequestService {
  readonly ROOT_URL;

  constructor(private httpClient: HttpClient) {
    this.ROOT_URL = 'http://localhost:3000';
  }

  get(url: string) {
    return this.httpClient.get(`${this.ROOT_URL}/${url}`);
  }

  post(url: string, payload: Object) {
    return this.httpClient.post(`${this.ROOT_URL}/${url}`, payload);
  }

  patch(url: string, payload: Object) {
    return this.httpClient.patch(`${this.ROOT_URL}/${url}`, payload);
  }

  delete(url: string) {
    return this.httpClient.delete(`${this.ROOT_URL}/${url}`);
  }
}
