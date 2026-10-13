import { Pipe, PipeTransform } from '@angular/core';

const quantityFormat = new Intl.NumberFormat('en-US');

@Pipe({ name: 'quantity' })
export class QuantityPipe implements PipeTransform {
  transform(value: number | bigint): string {
    return quantityFormat.format(value);
  }
}
