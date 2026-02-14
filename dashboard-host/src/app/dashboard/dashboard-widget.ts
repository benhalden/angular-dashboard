import { Type } from '@angular/core';

export type DashboardWidgetSize = '1x1' | '2x1' | '2x2' | '3x2' | '4x3';

export interface DashboardWidgetSizeOption {
  value: DashboardWidgetSize;
  label: string;
}

export const DASHBOARD_WIDGET_SIZE_OPTIONS: DashboardWidgetSizeOption[] = [
  { value: '1x1', label: 'Small (1x1)' },
  { value: '2x1', label: 'Small Wide (2x1)' },
  { value: '2x2', label: 'Medium (2x2)' },
  { value: '3x2', label: 'Medium Wide (3x2)' },
  { value: '4x3', label: 'Large (4x3)' }
];

export interface DashboardWidgetLayoutItem {
  id: string;
  size: DashboardWidgetSize;
  column?: number;
  row?: number;
}

export interface DashboardWidgetDefinition {
  id: string;
  title: string;
  component: Type<unknown>;
  defaultSize?: DashboardWidgetSize;
  allowedSizes?: DashboardWidgetSize[];
}