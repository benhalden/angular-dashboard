import { Type } from '@angular/core';

export type DashboardWidgetSize = '1x1' | '2x1' | '2x2' | '3x2' | '3x3' | '4x3' | '5x4';

export interface DashboardWidgetSizeOption {
  value: DashboardWidgetSize;
  label: string;
}

export interface DashboardWidgetLayoutItem {
  id: string;
  size: DashboardWidgetSize;
  column?: number;
  row?: number;
}

export interface DashboardWidgetDefinition {
  id: string;
  title: string;
  description?: string;
  component: Type<unknown>;
  defaultWidth: number;
  defaultHeight: number;
  allowedWidths?: number[];
  allowedHeights?: number[];  
  thumbnailImageUrl?: string;
}