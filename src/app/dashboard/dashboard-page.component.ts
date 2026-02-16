import { Component } from '@angular/core';
import { DashboardComponent } from './pages/dashboard.component';
import { DashboardWidgetDefinitionsService } from './services/dashboard-widget-definitions.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  template: `
    <app-dashboard
      [dashboardId]="dashboardId"
      [widgetDefinitions]="widgetDefinitions"
      [initialWidgetIds]="initialWidgetIds"
    ></app-dashboard>
  `,
  imports: [DashboardComponent]
})
export class DashboardPageComponent {
  readonly dashboardId = 'dashboard';
  readonly widgetDefinitions = this.dashboardWidgetDefinitionsService.widgetDefinitions;
  readonly initialWidgetIds = [];//this.dashboardWidgetDefinitionsService.initialWidgetIds;

  constructor(private readonly dashboardWidgetDefinitionsService: DashboardWidgetDefinitionsService) {}
}
