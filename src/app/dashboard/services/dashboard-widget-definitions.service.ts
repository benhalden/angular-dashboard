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
      description: 'Example dashboard widget 1.',
      thumbnailImageUrl: 'assets/images/default.png',
      component: Widget1Component,      
      defaultWidth: 4,
      defaultHeight: 3,
      allowedWidths: [4,8],
      allowedHeights: [3]
    },
    {
      id: 'widget-2',
      title: 'Widget 2',
      description: 'Example dashboard widget 2.',
      thumbnailImageUrl: 'assets/images/default.png',
      component: Widget2Component,
      defaultWidth: 2,
      defaultHeight: 1,
      allowedWidths: [2, 4],
      allowedHeights: [1, 2, 3]
    },
    {
      id: 'widget-3',
      title: 'Widget 3',
      description: 'Example dashboard widget 3.',
      thumbnailImageUrl: 'assets/images/default.png',
      component: Widget3Component,
      defaultWidth: 2,
      defaultHeight: 2,
      allowedWidths: [1, 2],
      allowedHeights: [1, 2]
    }
  ];

}