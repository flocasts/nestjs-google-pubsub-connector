import { Injectable } from '@nestjs/common';
import { Observable, of } from 'rxjs';

@Injectable()
export class ExampleService {
    public doStuff(...any: any[]): boolean {
        return true;
    }
    public async doStuffAsync(...any: any[]): Promise<boolean> {
        return true;
    }
    public doStuffObservable(...any: any[]): Observable<boolean> {
        return of(true);
    }
}
