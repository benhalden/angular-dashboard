import { Component, inject } from '@angular/core';
import { DashboardComponent, DashboardWidgetDefinitionsService } from './dashboard/public-api';

@Component({
  selector: 'app-root',
  imports: [DashboardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private readonly widgetDefinitionsService = inject(DashboardWidgetDefinitionsService);

  protected readonly widgetDefinitions = this.widgetDefinitionsService.widgetDefinitions;
  protected readonly initialWidgetIds = this.widgetDefinitionsService.initialWidgetIds;
}
