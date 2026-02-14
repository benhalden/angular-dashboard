import { Component } from '@angular/core';

@Component({
  selector: 'app-activity-widget',
  standalone: true,
  template: `
    <ul>
      <li>Data import completed</li>
      <li>Invoice #542 sent</li>
      <li>2 user roles updated</li>
    </ul>
  `,
  styles: [
    `
      ul {
        margin: 0;
        padding-left: 1rem;
        display: grid;
        gap: 0.35rem;
      }
    `
  ]
})
export class ActivityWidgetComponent {}