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
    service.saveLayout('sales', { widgetIds: ['summary', 'todo'] });

    const loaded = service.loadLayout('sales');

    expect(loaded).toEqual({ widgetIds: ['summary', 'todo'] });
  });

  it('returns null for missing or malformed data', () => {
    expect(service.loadLayout('missing')).toBeNull();

    localStorage.setItem('dashboard-layout:bad', '{not-json');
    expect(service.loadLayout('bad')).toBeNull();

    localStorage.setItem('dashboard-layout:wrong-shape', JSON.stringify({ widgetIds: 'x' }));
    expect(service.loadLayout('wrong-shape')).toBeNull();
  });
});