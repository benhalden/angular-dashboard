import { TestBed } from '@angular/core/testing';
import { DashboardLayoutService } from './dashboard-layout.service';

describe('DashboardLayoutService', () => {
  let service: DashboardLayoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DashboardLayoutService);
    localStorage.clear();
  });

  it('saves and loads layout by dashboard id', () => {
    service.saveLayout('sales', {
      widgets: [
        { id: 'summary', size: '2x1', column: 1, row: 1 },
        { id: 'todo', size: '2x2', column: 3, row: 1 }
      ]
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
    localStorage.setItem('dashboard-layout:legacy', JSON.stringify({ widgetIds: ['summary', 'todo'] }));

    const loaded = service.loadLayout('legacy');

    expect(loaded).toEqual({
      widgets: [
        { id: 'summary', size: '2x2' },
        { id: 'todo', size: '2x2' }
      ]
    });
  });

  it('returns null for missing or malformed data', () => {
    expect(service.loadLayout('missing')).toBeNull();

    localStorage.setItem('dashboard-layout:bad', '{not-json');
    expect(service.loadLayout('bad')).toBeNull();

    localStorage.setItem('dashboard-layout:wrong-shape', JSON.stringify({ widgetIds: 'x' }));
    expect(service.loadLayout('wrong-shape')).toBeNull();
  });
});