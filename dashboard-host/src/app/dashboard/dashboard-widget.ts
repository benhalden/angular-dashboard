import { Type } from '@angular/core';

export interface DashboardWidgetDefinition {
  id: string;
  title: string;
  component: Type<unknown>;
}