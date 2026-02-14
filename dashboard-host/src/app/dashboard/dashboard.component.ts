import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DashboardLayoutService } from './dashboard-layout.service';
import { DashboardWidgetDefinition } from './dashboard-widget';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnChanges {
  @Input({ required: true }) widgetDefinitions: DashboardWidgetDefinition[] = [];
  @Input() dashboardId = 'default';
  @Input() initialWidgetIds: string[] = [];

  displayedWidgetIds: string[] = [];
  selectedWidgetId = '';
  private readonly layoutService = inject(DashboardLayoutService);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['widgetDefinitions'] || changes['initialWidgetIds'] || changes['dashboardId']) {
      this.syncDisplayedWidgets();
    }
  }

  displayedWidgets(): DashboardWidgetDefinition[] {
    const byId = new Map(this.widgetDefinitions.map((widget) => [widget.id, widget]));
    return this.displayedWidgetIds
      .map((id) => byId.get(id))
      .filter((widget): widget is DashboardWidgetDefinition => !!widget);
  }

  availableWidgets(): DashboardWidgetDefinition[] {
    const displayedIds = new Set(this.displayedWidgetIds);
    return this.widgetDefinitions.filter((widget) => !displayedIds.has(widget.id));
  }

  addSelectedWidget(): void {
    if (!this.selectedWidgetId) {
      return;
    }

    const isAlreadyDisplayed = this.displayedWidgetIds.includes(this.selectedWidgetId);
    const existsInDefinitions = this.widgetDefinitions.some((widget) => widget.id === this.selectedWidgetId);

    if (!isAlreadyDisplayed && existsInDefinitions) {
      this.displayedWidgetIds = [...this.displayedWidgetIds, this.selectedWidgetId];
      this.persistLayout();
    }

    this.selectedWidgetId = '';
  }

  removeWidget(widgetId: string): void {
    this.displayedWidgetIds = this.displayedWidgetIds.filter((id) => id !== widgetId);
    this.persistLayout();
  }

  drop(event: CdkDragDrop<DashboardWidgetDefinition[]>): void {
    moveItemInArray(this.displayedWidgetIds, event.previousIndex, event.currentIndex);
    this.displayedWidgetIds = [...this.displayedWidgetIds];
    this.persistLayout();
  }

  trackByWidgetId(_: number, widget: DashboardWidgetDefinition): string {
    return widget.id;
  }

  private syncDisplayedWidgets(): void {
    const validIds = new Set(this.widgetDefinitions.map((widget) => widget.id));
    const persistedLayout = this.layoutService.loadLayout(this.dashboardId);

    const sourceIds = persistedLayout?.widgetIds?.length
      ? persistedLayout.widgetIds
      : this.initialWidgetIds.length > 0
        ? this.initialWidgetIds
        : this.displayedWidgetIds;

    const uniqueDisplayedIds: string[] = [];

    for (const id of sourceIds) {
      if (validIds.has(id) && !uniqueDisplayedIds.includes(id)) {
        uniqueDisplayedIds.push(id);
      }
    }

    this.displayedWidgetIds = uniqueDisplayedIds;
    this.persistLayout();
    if (!this.availableWidgets().some((widget) => widget.id === this.selectedWidgetId)) {
      this.selectedWidgetId = '';
    }
  }

  private persistLayout(): void {
    this.layoutService.saveLayout(this.dashboardId, { widgetIds: this.displayedWidgetIds });
  }
}