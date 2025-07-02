import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CodeExecutorService {
  private apiUrl =
    'https://judge0-ce.p.rapidapi.com/submissions/batch?base64_encoded=true&wait=false';
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    // 'X-RapidAPI-Key': 'e5a09e9bc6mshf854b4046f46a91p1783aajsn96f7ba887d11',
    'X-RapidAPI-Key': '8bcfaa3c7dmsh57f3479b1307378p1aa0bbjsn4d6f62005a85',
    'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
  });

  constructor(private http: HttpClient) {}

  // executeCode(code: string, stdin: string, languageId: number): Observable<any> {
  //   const body = {
  //     source_code: code,
  //     language_id: languageId,
  //     stdin: stdin
  //   };

  //   return this.http.post(this.apiUrl, body, { headers: this.headers });
  // }
  executeCode(payloads: any[]): Observable<any> {
    return this.http.post(
      this.apiUrl,
      {
        submissions: payloads,
      },
      { headers: this.headers }
    );
  }
  runCode(payload: any): Observable<any> {
    return this.http.post(
      'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=false',
      payload,
      { headers: this.headers }
    );
  }
  getJudge0Results(token: string) {
    const params = new HttpParams()
      .set('tokens', token)
      .set('base64_encoded', 'true')
      .set(
        'fields',
        'token,stdout,stderr,status_id,language_id,compile_output'
      );
    return this.http.get(`https://judge0-ce.p.rapidapi.com/submissions/batch`, {
      headers: this.headers,
      params,
    });
  }
  getJudge0ResultsRun(token: string) {
    const params = new HttpParams()
      .set('tokens', token)
      .set('base64_encoded', 'true')
      .set(
        'fields',
        'token,stdout,stderr,status_id,language_id,compile_output'
      );
    return this.http.get(`https://judge0-ce.p.rapidapi.com/submissions/${token}?base64_encoded=true&fields=*`, {
      headers: this.headers,
    });
  }
}
