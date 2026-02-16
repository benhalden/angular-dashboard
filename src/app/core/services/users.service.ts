import { Injectable } from '@angular/core';

export interface IUserSetting {
  recordId: number;
  userSettingId: number;
  userSettingName: string;
  userSettingSection: string;
  userSettingSortOrder: number;
  userSettingValueFormat: number;
  userSettingStringValue?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private static readonly STORAGE_KEY = 'user-settings';

  private readonly settings = new Map<string, IUserSetting>();
  private nextSettingId = 1;

  constructor() {
    this.restoreFromStorage();
    this.ensureSettingExists('DashboardLayout');
  }

  getUserSetting(settingName: string): IUserSetting | undefined {
    const setting = this.settings.get(settingName);

    if (!setting) {
      return undefined;
    }

    return { ...setting };
  }

  setUserSetting(setting: IUserSetting): void {
    if (!setting.userSettingName) {
      return;
    }

    const normalizedSetting: IUserSetting = {
      ...setting,
      recordId: setting.recordId > 0 ? setting.recordId : this.nextId(),
      userSettingId: setting.userSettingId > 0 ? setting.userSettingId : this.nextId()
    };

    this.settings.set(normalizedSetting.userSettingName, { ...normalizedSetting });
    this.persistToStorage();
  }

  private ensureSettingExists(settingName: string): void {
    if (this.settings.has(settingName)) {
      return;
    }

    const newId = this.nextId();
    const defaultSetting: IUserSetting = {
      recordId: newId,
      userSettingId: newId,
      userSettingName: settingName,
      userSettingSection: 'Dashboard',
      userSettingSortOrder: 1,
      userSettingValueFormat: 2,
      userSettingStringValue: undefined
    };

    this.settings.set(settingName, defaultSetting);
    this.persistToStorage();
  }

  private restoreFromStorage(): void {
    const raw = this.readStorage();

    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as unknown;

      if (!Array.isArray(parsed)) {
        return;
      }

      parsed.forEach((item) => {
        if (!item || typeof item !== 'object') {
          return;
        }

        const candidate = item as Partial<IUserSetting>;

        if (
          typeof candidate.userSettingName !== 'string' ||
          typeof candidate.userSettingSection !== 'string' ||
          typeof candidate.userSettingSortOrder !== 'number' ||
          typeof candidate.userSettingValueFormat !== 'number'
        ) {
          return;
        }

        const recordId = typeof candidate.recordId === 'number' && candidate.recordId > 0 ? candidate.recordId : this.nextId();
        const userSettingId =
          typeof candidate.userSettingId === 'number' && candidate.userSettingId > 0 ? candidate.userSettingId : recordId;

        this.nextSettingId = Math.max(this.nextSettingId, recordId + 1, userSettingId + 1);

        this.settings.set(candidate.userSettingName, {
          recordId,
          userSettingId,
          userSettingName: candidate.userSettingName,
          userSettingSection: candidate.userSettingSection,
          userSettingSortOrder: candidate.userSettingSortOrder,
          userSettingValueFormat: candidate.userSettingValueFormat,
          userSettingStringValue: typeof candidate.userSettingStringValue === 'string' ? candidate.userSettingStringValue : undefined
        });
      });
    } catch {
      this.settings.clear();
    }
  }

  private persistToStorage(): void {
    const values = Array.from(this.settings.values());
    this.writeStorage(JSON.stringify(values));
  }

  private nextId(): number {
    const value = this.nextSettingId;
    this.nextSettingId += 1;
    return value;
  }

  private readStorage(): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    return localStorage.getItem(UsersService.STORAGE_KEY);
  }

  private writeStorage(value: string): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(UsersService.STORAGE_KEY, value);
  }
}
