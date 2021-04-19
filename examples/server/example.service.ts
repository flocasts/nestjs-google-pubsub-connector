/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { Observable, of } from 'rxjs';

@Injectable()
export class ExampleService {
    public doStuff(...any: unknown[]): boolean {
        return true;
    }
    public async doStuffAsync(...any: unknown[]): Promise<boolean> {
        return true;
    }
    public doStuffObservable(...any: unknown[]): Observable<boolean> {
        return of(true);
    }
}
