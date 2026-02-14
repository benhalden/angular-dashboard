import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { DashboardComponent } from './dashboard.component';
import { DashboardLayoutService } from './dashboard-layout.service';
import { DashboardWidgetDefinition } from './dashboard-widget';

@Component({
  selector: 'app-widget-a',
  standalone: true,
  template: '<p>Widget A</p>'
})
class WidgetAComponent {}

@Component({
  selector: 'app-widget-b',
  standalone: true,
  template: '<p>Widget B</p>'
})
class WidgetBComponent {}

@Component({
  selector: 'app-widget-c',
  standalone: true,
  template: '<p>Widget C</p>'
})
class WidgetCComponent {}

describe('DashboardComponent', () => {
  let layoutService: jasmine.SpyObj<DashboardLayoutService>;

  const widgetDefinitions: DashboardWidgetDefinition[] = [
    { id: 'a', title: 'Widget A', component: WidgetAComponent, defaultSize: '1x1', allowedSizes: ['1x1', '2x1'] },
    { id: 'b', title: 'Widget B', component: WidgetBComponent, defaultSize: '2x2', allowedSizes: ['2x2', '3x2'] },
    { id: 'c', title: 'Widget C', component: WidgetCComponent, defaultSize: '4x3', allowedSizes: ['4x3'] }
  ];

  beforeEach(async () => {
    layoutService = jasmine.createSpyObj<DashboardLayoutService>('DashboardLayoutService', ['loadLayout', 'saveLayout']);
    layoutService.loadLayout.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [{ provide: DashboardLayoutService, useValue: layoutService }]
    }).compileComponents();
  });

  it('initialises displayed widgets from initialWidgetIds and excludes them from available list', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.componentRef.setInput('widgetDefinitions', widgetDefinitions);
    fixture.componentRef.setInput('dashboardId', 'main');
    fixture.componentRef.setInput('initialWidgetIds', ['a', 'c']);
    fixture.detectChanges();

    const component = fixture.componentInstance;

    expect(component.displayedWidgets().map((widget) => widget.id)).toEqual(['a', 'c']);
    expect(component.availableWidgets().map((widget) => widget.id)).toEqual(['b']);
    expect(layoutService.saveLayout).toHaveBeenCalledWith('main', {
      widgets: [
        { id: 'a', size: '1x1', column: 1, row: 1 },
        { id: 'c', size: '4x3', column: 2, row: 1 }
      ]
    });
  });

  it('prefers persisted layout over initial widget ids when present', () => {
    layoutService.loadLayout.and.returnValue({
      widgets: [
        { id: 'c', size: '4x3', column: 6, row: 2 },
        { id: 'b', size: '3x2', column: 1, row: 4 }
      ]
    });

    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.componentRef.setInput('widgetDefinitions', widgetDefinitions);
    fixture.componentRef.setInput('dashboardId', 'main');
    fixture.componentRef.setInput('initialWidgetIds', ['a']);
    fixture.detectChanges();

    expect(fixture.componentInstance.displayedWidgets()).toEqual([
      jasmine.objectContaining({ id: 'c', column: 6, row: 2 }),
      jasmine.objectContaining({ id: 'b', column: 1, row: 4 })
    ]);
  });

  it('does not allow add remove or drag when not in edit mode', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.componentRef.setInput('widgetDefinitions', widgetDefinitions);
    fixture.componentRef.setInput('dashboardId', 'main');
    fixture.componentRef.setInput('initialWidgetIds', ['a', 'b']);
    fixture.detectChanges();

    const component = fixture.componentInstance;

    component.selectedWidgetId = 'c';
    component.addSelectedWidget();
    component.removeWidget('a');
    component.drop({ previousIndex: 0, currentIndex: 1 } as CdkDragDrop<any>);

    expect(component.displayedWidgets().map((widget) => widget.id)).toEqual(['a', 'b']);
    expect(layoutService.saveLayout).toHaveBeenCalledTimes(1);
  });

  it('adds selected widget and removes it from available widgets', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.componentRef.setInput('widgetDefinitions', widgetDefinitions);
    fixture.componentRef.setInput('dashboardId', 'main');
    fixture.componentRef.setInput('initialWidgetIds', ['a']);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.toggleEditMode();
    component.selectedWidgetId = 'b';
    component.addSelectedWidget();

    expect(component.displayedWidgets().map((widget) => widget.id)).toEqual(['a', 'b']);
    expect(component.availableWidgets().map((widget) => widget.id)).toEqual(['c']);
    expect(layoutService.saveLayout).toHaveBeenCalledWith('main', {
      widgets: [
        { id: 'a', size: '1x1', column: 1, row: 1 },
        { id: 'b', size: '2x2', column: 2, row: 1 }
      ]
    });
  });

  it('removes widget and returns it to available list', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.componentRef.setInput('widgetDefinitions', widgetDefinitions);
    fixture.componentRef.setInput('dashboardId', 'main');
    fixture.componentRef.setInput('initialWidgetIds', ['a', 'b']);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.toggleEditMode();
    component.removeWidget('a');

    expect(component.displayedWidgets().map((widget) => widget.id)).toEqual(['b']);
    expect(component.availableWidgets().map((widget) => widget.id)).toEqual(['a', 'c']);
    expect(layoutService.saveLayout).toHaveBeenCalledWith('main', {
      widgets: [{ id: 'b', size: '2x2', column: 2, row: 1 }]
    });
  });

  it('updates widget size in edit mode and persists', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.componentRef.setInput('widgetDefinitions', widgetDefinitions);
    fixture.componentRef.setInput('dashboardId', 'main');
    fixture.componentRef.setInput('initialWidgetIds', ['a']);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.toggleEditMode();
    component.updateWidgetSize('a', '2x1');

    expect(component.displayedWidgets().map((widget) => widget.size)).toEqual(['2x1']);
    expect(layoutService.saveLayout).toHaveBeenCalledWith('main', {
      widgets: [{ id: 'a', size: '2x1', column: 1, row: 1 }]
    });
  });

  it('drops a widget to a snapped grid position', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.componentRef.setInput('widgetDefinitions', widgetDefinitions);
    fixture.componentRef.setInput('dashboardId', 'main');
    fixture.componentRef.setInput('initialWidgetIds', ['a', 'b', 'c']);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.toggleEditMode();

    const grid = document.createElement('div');
    Object.defineProperty(grid, 'scrollLeft', { value: 0, configurable: true });
    Object.defineProperty(grid, 'scrollTop', { value: 0, configurable: true });
    spyOn(window, 'getComputedStyle').and.returnValue({
      columnGap: '12px',
      rowGap: '12px',
      gap: '12px',
      gridAutoRows: '110px'
    } as CSSStyleDeclaration);
    spyOn(grid, 'getBoundingClientRect').and.returnValue({
      left: 0,
      top: 0,
      width: 1200,
      height: 700,
      right: 1200,
      bottom: 700,
      x: 0,
      y: 0,
      toJSON: () => ({})
    } as DOMRect);

    (component as any).dashboardGridRef = { nativeElement: grid };

    component.drop({
      item: { data: { id: 'a' } },
      dropPoint: { x: 650, y: 260 }
    } as CdkDragDrop<any>);

    const moved = component.displayedWidgets().find((widget) => widget.id === 'a');
    expect(moved).toEqual(jasmine.objectContaining({ column: 7, row: 3 }));
    expect(layoutService.saveLayout).toHaveBeenCalled();
  });

  it('tracks active drag widget only in edit mode', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.componentRef.setInput('widgetDefinitions', widgetDefinitions);
    fixture.componentRef.setInput('dashboardId', 'main');
    fixture.componentRef.setInput('initialWidgetIds', ['a']);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.onDragStarted('a');
    expect(component.activeDragWidgetId).toBeNull();

    component.toggleEditMode();
    component.onDragStarted('a');
    expect(component.activeDragWidgetId).toBe('a');

    component.onDragEnded();
    expect(component.activeDragWidgetId).toBeNull();
  });
});