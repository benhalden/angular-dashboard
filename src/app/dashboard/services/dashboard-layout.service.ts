import { Injectable } from '@angular/core';
import { UsersService, IUserSetting } from '@app/core/services/users.service';
import { LoggingService } from '@app/core/services/logging.service';
import { DashboardWidgetLayoutItem } from '../components/dashboard-widget';

export interface DashboardLayout {
  widgets: DashboardWidgetLayoutItem[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardLayoutService {
  private static readonly SETTING_NAME = 'DashboardLayout';

  constructor(    
    private readonly userService: UsersService,
    private readonly logger: LoggingService
  ) {}

  loadLayout(dashboardId: string): DashboardLayout | null {
    const setting = this.userService.getUserSetting(DashboardLayoutService.SETTING_NAME);
    const raw = setting?.userSettingStringValue;
    this.logger.info(`Loading dashboard layout for dashboard '${dashboardId}' from setting '${DashboardLayoutService.SETTING_NAME}'. Raw value: ${raw}`);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      const payload = this.resolvePayloadForDashboard(parsed, dashboardId);

      if (!payload || typeof payload !== 'object') {
        return null;
      }

      const layoutPayload = payload as Partial<DashboardLayout>;

      if (Array.isArray(layoutPayload.widgets)) {
        const widgets = layoutPayload.widgets
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

      if (Array.isArray((layoutPayload as { widgetIds?: unknown[] }).widgetIds)) {
        const widgetIds = (layoutPayload as { widgetIds?: unknown[] }).widgetIds ?? [];
        const widgets = widgetIds
          .filter((id): id is string => typeof id === 'string')
          .map((id) => ({ id, size: '2x2' as const }));

        return { widgets };
      }

      return null;
    } catch (error) {
      this.logger.error('Invalid DashboardLayout JSON', [error]);
      return null;
    }
  }

  saveLayout(dashboardId: string, layout: DashboardLayout): void {
    const setting = this.userService.getUserSetting(DashboardLayoutService.SETTING_NAME);

    if (!setting) {
      this.logger.error(`Could not save layout: user setting '${DashboardLayoutService.SETTING_NAME}' was not found.`);
      return;
    }

    const nextSetting = this.withSerializedLayout(setting, dashboardId, layout);
    this.userService.setUserSetting(nextSetting);
  }

  clearLayout(dashboardId: string): void {
    const setting = this.userService.getUserSetting(DashboardLayoutService.SETTING_NAME);

    if (!setting) {
      return;
    }

    const nextSetting = this.withSerializedLayout(setting, dashboardId, null);
    this.userService.setUserSetting(nextSetting);
  }

  private resolvePayloadForDashboard(parsed: unknown, dashboardId: string): unknown {
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const candidate = parsed as { widgets?: unknown; widgetIds?: unknown; [key: string]: unknown };

    if (Array.isArray(candidate.widgets) || Array.isArray(candidate.widgetIds)) {
      return candidate;
    }

    const byDashboard = candidate[dashboardId];

    if (byDashboard && typeof byDashboard === 'object') {
      return byDashboard;
    }

    return null;
  }

  private withSerializedLayout(
    setting: IUserSetting,
    dashboardId: string,
    layout: DashboardLayout | null
  ): IUserSetting {
    const current = this.parseDashboardMap(setting.userSettingStringValue, dashboardId);

    if (layout) {
      current[dashboardId] = layout;
    } else {
      delete current[dashboardId];
    }

    return {
      ...setting,
      userSettingStringValue: JSON.stringify(current)
    };
  }

  private parseDashboardMap(raw: string | undefined, dashboardId: string): Record<string, DashboardLayout> {
    if (!raw) {
      return {};
    }

    try {
      const parsed = JSON.parse(raw) as unknown;

      if (!parsed || typeof parsed !== 'object') {
        return {};
      }

      const candidate = parsed as { widgets?: unknown; widgetIds?: unknown; [key: string]: unknown };

      if (Array.isArray(candidate.widgets) || Array.isArray(candidate.widgetIds)) {
        return { [dashboardId]: candidate as DashboardLayout };
      }

      return parsed as Record<string, DashboardLayout>;
    } catch {
      return {};
    }
  }
}