import { TestBed } from '@angular/core/testing';
import { UsersService, IUserSetting } from '@app/core/services/users.service';
import { LoggingService } from '@app/core/services/logging.service';
import { DashboardLayoutService } from './dashboard-layout.service';

describe('DashboardLayoutService', () => {
  let service: DashboardLayoutService;
  let userService: jasmine.SpyObj<UsersService>;

  const newDashboardSetting: IUserSetting = {
    recordId: 99,
    userSettingId: 99,
    userSettingName: 'NewDashboardLayout',
    userSettingSection: 'Dashboard',
    userSettingSortOrder: 1,
    userSettingValueFormat: 2,
    userSettingStringValue: undefined
  };

  beforeEach(() => {
    userService = jasmine.createSpyObj<UsersService>('UsersService', ['getUserSetting', 'setUserSetting']);

    TestBed.configureTestingModule({
      providers: [
        DashboardLayoutService,
        { provide: UsersService, useValue: userService },
        {
          provide: LoggingService,
          useValue: jasmine.createSpyObj<LoggingService>('LoggingService', ['error', 'info', 'warn', 'debug'])
        }
      ]
    });

    service = TestBed.inject(DashboardLayoutService);
  });

  it('loads layout by dashboard id from NewDashboardLayout setting payload', () => {
    userService.getUserSetting.and.returnValue({
      ...newDashboardSetting,
      userSettingStringValue: JSON.stringify({
        sales: {
          widgets: [
            { id: 'summary', size: '2x1', column: 1, row: 1 },
            { id: 'todo', size: '2x2', column: 3, row: 1 }
          ]
        }
      })
    });

    const loaded = service.loadLayout('sales');

    expect(loaded).toEqual({
      widgets: [
        { id: 'summary', size: '2x1', column: 1, row: 1 },
        { id: 'todo', size: '2x2', column: 3, row: 1 }
      ]
    });
  });

  it('maps legacy widgetIds payload into default size widgets', () => {
    userService.getUserSetting.and.returnValue({
      ...newDashboardSetting,
      userSettingStringValue: JSON.stringify({ widgetIds: ['summary', 'todo'] })
    });

    const loaded = service.loadLayout('legacy');

    expect(loaded).toEqual({
      widgets: [
        { id: 'summary', size: '2x2' },
        { id: 'todo', size: '2x2' }
      ]
    });
  });

  it('saves layout back into NewDashboardLayout setting', () => {
    userService.getUserSetting.and.returnValue({
      ...newDashboardSetting,
      userSettingStringValue: JSON.stringify({
        existing: {
          widgets: [{ id: 'x', size: '1x1', column: 1, row: 1 }]
        }
      })
    });

    service.saveLayout('sales', {
      widgets: [{ id: 'summary', size: '2x1', column: 1, row: 1 }]
    });

    expect(userService.setUserSetting).toHaveBeenCalledTimes(1);
    const savedSetting = userService.setUserSetting.calls.mostRecent().args[0] as IUserSetting;
    const parsed = JSON.parse(savedSetting.userSettingStringValue ?? '{}') as Record<string, unknown>;

    expect(parsed['existing']).toBeTruthy();
    expect(parsed['sales']).toEqual({
      widgets: [{ id: 'summary', size: '2x1', column: 1, row: 1 }]
    });
  });

  it('returns null for missing or malformed data', () => {
    userService.getUserSetting.and.returnValue(undefined as unknown as IUserSetting);
    expect(service.loadLayout('missing')).toBeNull();

    userService.getUserSetting.and.returnValue({
      ...newDashboardSetting,
      userSettingStringValue: '{not-json'
    });
    expect(service.loadLayout('bad')).toBeNull();

    userService.getUserSetting.and.returnValue({
      ...newDashboardSetting,
      userSettingStringValue: JSON.stringify({ widgetIds: 'x' })
    });
    expect(service.loadLayout('wrong-shape')).toBeNull();
  });
});