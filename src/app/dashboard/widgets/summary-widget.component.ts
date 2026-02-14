import { Component } from '@angular/core';

@Component({
  selector: 'app-summary-widget',
  standalone: true,
  template: `
    <section class="summary-grid">
      <div><strong>Users</strong><span>1,284</span></div>
      <div><strong>Revenue</strong><span>£42,900</span></div>
      <div><strong>Alerts</strong><span>3</span></div>
    </section>
  `,
  styles: [
    `
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.5rem;
      }

      .summary-grid div {
        border: 1px solid #d5d5d5;
        border-radius: 6px;
        padding: 0.4rem;
        display: grid;
      }

      strong {
        font-size: 0.8rem;
      }
    `
  ]
})
export class SummaryWidgetComponent {}