import { Injectable } from '@angular/core';
import { DashboardWidgetDefinition } from '../components/dashboard-widget';
import { Widget1Component } from '../widgets/widget-1/widget-1.component';
import { Widget2Component } from '../widgets/widget-2/widget-2.component';
import { Widget3Component } from '../widgets/widget-3/widget-3.component';

@Injectable({
  providedIn: 'root'
})
export class DashboardWidgetDefinitionsService {
  readonly widgetDefinitions: DashboardWidgetDefinition[] = [    
    {
      id: 'widget-1',
      title: 'Widget 1',
      component: Widget1Component,
      defaultSize: '4x3',
      allowedSizes: ['4x3']
    },
    {
      id: 'widget-2',
      title: 'Widget 2',
      component: Widget2Component,
      defaultSize: '2x1',
      allowedSizes: ['2x1', '2x2', '4x3']
    },
    {
      id: 'widget-3',
      title: 'Widget 3',
      component: Widget3Component,
      defaultSize: '1x1',
      allowedSizes: ['1x1', '2x1', '2x2']
    }
  ];

  readonly initialWidgetIds: string[] = ['summary', 'activity'];
}