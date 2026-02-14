import { Component } from '@angular/core';
import { DashboardComponent, DashboardWidgetDefinition } from './dashboard/public-api';
import { ActivityWidgetComponent } from './widgets/activity-widget.component';
import { SummaryWidgetComponent } from './widgets/summary-widget.component';
import { TodoWidgetComponent } from './widgets/todo-widget.component';

@Component({
  selector: 'app-root',
  imports: [DashboardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  protected readonly widgetDefinitions: DashboardWidgetDefinition[] = [
    {
      id: 'summary',
      title: 'Summary',
      component: SummaryWidgetComponent,
      defaultSize: '2x1',
      allowedSizes: ['1x1', '2x1', '2x2']
    },
    {
      id: 'activity',
      title: 'Recent Activity',
      component: ActivityWidgetComponent,
      defaultSize: '3x2',
      allowedSizes: ['2x2', '3x2', '4x3']
    },
    {
      id: 'todo',
      title: 'To-Do',
      component: TodoWidgetComponent,
      defaultSize: '2x2',
      allowedSizes: ['1x1', '2x2', '3x2']
    }
  ];

  protected readonly initialWidgetIds = ['summary', 'activity'];
}
