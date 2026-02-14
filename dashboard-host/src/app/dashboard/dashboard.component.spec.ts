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
    { id: 'a', title: 'Widget A', component: WidgetAComponent },
    { id: 'b', title: 'Widget B', component: WidgetBComponent },
    { id: 'c', title: 'Widget C', component: WidgetCComponent }
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
    expect(layoutService.saveLayout).toHaveBeenCalledWith('main', { widgetIds: ['a', 'c'] });
  });

  it('prefers persisted layout over initial widget ids when present', () => {
    layoutService.loadLayout.and.returnValue({ widgetIds: ['c', 'b'] });

    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.componentRef.setInput('widgetDefinitions', widgetDefinitions);
    fixture.componentRef.setInput('dashboardId', 'main');
    fixture.componentRef.setInput('initialWidgetIds', ['a']);
    fixture.detectChanges();

    expect(fixture.componentInstance.displayedWidgets().map((widget) => widget.id)).toEqual(['c', 'b']);
  });

  it('adds selected widget and removes it from available widgets', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.componentRef.setInput('widgetDefinitions', widgetDefinitions);
    fixture.componentRef.setInput('dashboardId', 'main');
    fixture.componentRef.setInput('initialWidgetIds', ['a']);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.selectedWidgetId = 'b';
    component.addSelectedWidget();

    expect(component.displayedWidgets().map((widget) => widget.id)).toEqual(['a', 'b']);
    expect(component.availableWidgets().map((widget) => widget.id)).toEqual(['c']);
    expect(layoutService.saveLayout).toHaveBeenCalledWith('main', { widgetIds: ['a', 'b'] });
  });

  it('removes widget and returns it to available list', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.componentRef.setInput('widgetDefinitions', widgetDefinitions);
    fixture.componentRef.setInput('dashboardId', 'main');
    fixture.componentRef.setInput('initialWidgetIds', ['a', 'b']);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.removeWidget('a');

    expect(component.displayedWidgets().map((widget) => widget.id)).toEqual(['b']);
    expect(component.availableWidgets().map((widget) => widget.id)).toEqual(['a', 'c']);
    expect(layoutService.saveLayout).toHaveBeenCalledWith('main', { widgetIds: ['b'] });
  });

  it('reorders displayed widgets on drag drop', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.componentRef.setInput('widgetDefinitions', widgetDefinitions);
    fixture.componentRef.setInput('dashboardId', 'main');
    fixture.componentRef.setInput('initialWidgetIds', ['a', 'b', 'c']);
    fixture.detectChanges();

    const component = fixture.componentInstance;

    component.drop({ previousIndex: 0, currentIndex: 2 } as CdkDragDrop<DashboardWidgetDefinition[]>);

    expect(component.displayedWidgets().map((widget) => widget.id)).toEqual(['b', 'c', 'a']);
    expect(layoutService.saveLayout).toHaveBeenCalledWith('main', { widgetIds: ['b', 'c', 'a'] });
  });
});