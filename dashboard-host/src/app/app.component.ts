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
    { id: 'summary', title: 'Summary', component: SummaryWidgetComponent },
    { id: 'activity', title: 'Recent Activity', component: ActivityWidgetComponent },
    { id: 'todo', title: 'To-Do', component: TodoWidgetComponent }
  ];

  protected readonly initialWidgetIds = ['summary', 'activity'];
}
