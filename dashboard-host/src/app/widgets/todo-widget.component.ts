import { Component } from '@angular/core';

@Component({
  selector: 'app-todo-widget',
  standalone: true,
  template: `
    <ol>
      <li>Review analytics</li>
      <li>Confirm sprint scope</li>
      <li>Prepare Monday summary</li>
    </ol>
  `,
  styles: [
    `
      ol {
        margin: 0;
        padding-left: 1rem;
        display: grid;
        gap: 0.35rem;
      }
    `
  ]
})
export class TodoWidgetComponent {}