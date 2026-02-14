import { Injectable } from '@angular/core';
import { DashboardWidgetLayoutItem } from './dashboard-widget';

export interface DashboardLayout {
  widgets: DashboardWidgetLayoutItem[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardLayoutService {
  loadLayout(dashboardId: string): DashboardLayout | null {
    const key = this.storageKey(dashboardId);
    const raw = localStorage.getItem(key);

    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<DashboardLayout>;

      if (Array.isArray(parsed.widgets)) {
        const widgets = parsed.widgets
          .filter((item): item is DashboardWidgetLayoutItem => {
            return !!item && typeof item.id === 'string' && typeof item.size === 'string';
          })
          .map((item) => {
            const layoutItem: DashboardWidgetLayoutItem = {
              id: item.id,
              size: item.size
            };

            if (typeof item.column === 'number' && item.column >= 1) {
              layoutItem.column = item.column;
            }

            if (typeof item.row === 'number' && item.row >= 1) {
              layoutItem.row = item.row;
            }

            return layoutItem;
          });

        return { widgets };
      }

      if (Array.isArray((parsed as { widgetIds?: unknown[] }).widgetIds)) {
        const widgetIds = (parsed as { widgetIds?: unknown[] }).widgetIds ?? [];
        const widgets = widgetIds
          .filter((id): id is string => typeof id === 'string')
          .map((id) => ({ id, size: '2x2' as const }));

        return { widgets };
      }

      return null;
    } catch {
      return null;
    }
  }

  saveLayout(dashboardId: string, layout: DashboardLayout): void {
    const key = this.storageKey(dashboardId);
    localStorage.setItem(key, JSON.stringify(layout));
  }

  clearLayout(dashboardId: string): void {
    localStorage.removeItem(this.storageKey(dashboardId));
  }

  private storageKey(dashboardId: string): string {
    return `dashboard-layout:${dashboardId}`;
  }
}