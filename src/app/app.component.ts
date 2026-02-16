import { Component, inject } from '@angular/core';
import { DashboardComponent, DashboardWidgetDefinitionsService } from './dashboard/public-api';
import { CoreModule } from './core/core.module';


@Component({
  selector: 'app-root',
  imports: [DashboardComponent, CoreModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private readonly widgetDefinitionsService = inject(DashboardWidgetDefinitionsService);

  protected readonly widgetDefinitions = this.widgetDefinitionsService.widgetDefinitions;
  protected readonly initialWidgetIds = [];
}
