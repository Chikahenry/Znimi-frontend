import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'naira', standalone: true })
export class NairaPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null) return '₦0.00';
    return '₦' + value.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
