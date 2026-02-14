import { Injectable } from '@angular/core';

export interface DashboardLayout {
  widgetIds: string[];
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
      if (!Array.isArray(parsed.widgetIds)) {
        return null;
      }

      const widgetIds = parsed.widgetIds.filter((id): id is string => typeof id === 'string');
      return { widgetIds };
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