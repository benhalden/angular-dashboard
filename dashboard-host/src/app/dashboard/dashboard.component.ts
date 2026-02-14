import { CommonModule } from '@angular/common';
import { CdkDragDrop, CdkDragMove, DragDropModule } from '@angular/cdk/drag-drop';
import { Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DashboardLayoutService } from './dashboard-layout.service';
import {
  DASHBOARD_WIDGET_SIZE_OPTIONS,
  DashboardWidgetDefinition,
  DashboardWidgetLayoutItem,
  DashboardWidgetSize,
  DashboardWidgetSizeOption
} from './dashboard-widget';

interface DisplayedDashboardWidget {
  id: string;
  title: string;
  component: DashboardWidgetDefinition['component'];
  size: DashboardWidgetSize;
  allowedSizes: DashboardWidgetSize[];
  column: number;
  row: number;
}

interface DropPreview {
  column: number;
  row: number;
  size: DashboardWidgetSize;
}

const GRID_COLUMNS = 12;
const MAX_LAYOUT_SEARCH_ROWS = 200;

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
  @ViewChild('dashboardGrid') dashboardGridRef?: ElementRef<HTMLElement>;

  displayedWidgetItems: DashboardWidgetLayoutItem[] = [];
  selectedWidgetId = '';
  isEditMode = false;
  activeDragWidgetId: string | null = null;
  lastDragBoundsPoint: { x: number; y: number } | null = null;
  dropPreview: DropPreview | null = null;
  dropPreviewStyles: Record<string, string> | null = null;
  readonly sizeOptions: DashboardWidgetSizeOption[] = DASHBOARD_WIDGET_SIZE_OPTIONS;
  readonly gridColumns = GRID_COLUMNS;

  private readonly layoutService = inject(DashboardLayoutService);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['widgetDefinitions'] || changes['initialWidgetIds'] || changes['dashboardId']) {
      this.syncDisplayedWidgets();
    }
  }

  displayedWidgets(): DisplayedDashboardWidget[] {
    const byId = new Map(this.widgetDefinitions.map((widget) => [widget.id, widget]));
    return this.displayedWidgetItems
      .map((layoutItem) => {
        const definition = byId.get(layoutItem.id);

        if (!definition) {
          return null;
        }

        return {
          id: definition.id,
          title: definition.title,
          component: definition.component,
          size: layoutItem.size,
          allowedSizes: this.allowedSizesForWidget(definition),
          column: layoutItem.column ?? 1,
          row: layoutItem.row ?? 1
        };
      })
      .filter((widget): widget is DisplayedDashboardWidget => !!widget);
  }

  availableWidgets(): DashboardWidgetDefinition[] {
    const displayedIds = new Set(this.displayedWidgetItems.map((item) => item.id));
    return this.widgetDefinitions.filter((widget) => !displayedIds.has(widget.id));
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
  }

  addSelectedWidget(): void {
    if (!this.isEditMode) {
      return;
    }

    if (!this.selectedWidgetId) {
      return;
    }

    const isAlreadyDisplayed = this.displayedWidgetItems.some((item) => item.id === this.selectedWidgetId);
    const definition = this.widgetDefinitions.find((widget) => widget.id === this.selectedWidgetId);

    if (!isAlreadyDisplayed && definition) {
      const size = this.defaultSizeForWidget(definition);
      const position = this.findNextAvailablePosition(size, this.displayedWidgetItems);

      this.displayedWidgetItems = [
        ...this.displayedWidgetItems,
        {
          id: this.selectedWidgetId,
          size,
          column: position.column,
          row: position.row
        }
      ];

      this.persistLayout();
    }

    this.selectedWidgetId = '';
  }

  removeWidget(widgetId: string): void {
    if (!this.isEditMode) {
      return;
    }

    this.displayedWidgetItems = this.displayedWidgetItems.filter((item) => item.id !== widgetId);
    this.persistLayout();
  }

  drop(event: CdkDragDrop<DisplayedDashboardWidget[]>): void {
    if (!this.isEditMode) {
      return;
    }

    const draggedWidget = event.item.data as DisplayedDashboardWidget | undefined;

    if (!draggedWidget) {
      return;
    }

    const previewPosition = this.dropPreview;
    const dragRootElement = typeof (event.item as { getRootElement?: unknown })?.getRootElement === 'function'
      ? (event.item as { getRootElement: () => HTMLElement }).getRootElement()
      : null;

    const boundsPoint =
      this.lastDragBoundsPoint ??
      this.pointFromCurrentDragBounds(dragRootElement) ??
      event.dropPoint;

    const dropResult = previewPosition
      ? {
          layout: this.layoutWithPinnedWidget(
            this.displayedWidgetItems,
            draggedWidget.id,
            previewPosition.column,
            previewPosition.row
          ),
          position: { column: previewPosition.column, row: previewPosition.row }
        }
      : this.previewDropResult(draggedWidget.id, boundsPoint);

    if (!dropResult) {
      return;
    }

    this.displayedWidgetItems = dropResult.layout;

    this.persistLayout();

    this.activeDragWidgetId = null;
    this.lastDragBoundsPoint = null;
    this.dropPreview = null;
    this.dropPreviewStyles = null;
  }

  updateWidgetSize(widgetId: string, nextSize: DashboardWidgetSize): void {
    if (!this.isEditMode) {
      return;
    }

    const definition = this.widgetDefinitions.find((widget) => widget.id === widgetId);

    if (!definition) {
      return;
    }

    const allowedSizes = this.allowedSizesForWidget(definition);

    if (!allowedSizes.includes(nextSize)) {
      return;
    }

    const resizedItems = this.displayedWidgetItems.map((item) =>
      item.id === widgetId ? { ...item, size: nextSize } : item
    );

    this.displayedWidgetItems = this.layoutWithPinnedWidget(resizedItems, widgetId);

    this.persistLayout();
  }

  onDragStarted(widgetId: string): void {
    if (!this.isEditMode) {
      return;
    }

    this.activeDragWidgetId = widgetId;
    this.lastDragBoundsPoint = null;

    const draggedItem = this.displayedWidgetItems.find((item) => item.id === widgetId);

    if (!draggedItem || typeof draggedItem.column !== 'number' || typeof draggedItem.row !== 'number') {
      this.dropPreview = null;
      this.dropPreviewStyles = null;
      return;
    }

    this.dropPreview = {
      column: draggedItem.column,
      row: draggedItem.row,
      size: draggedItem.size
    };
    this.dropPreviewStyles = this.buildDropPreviewStyles(this.dropPreview);
  }

  onDragMoved(event: CdkDragMove<DisplayedDashboardWidget>): void {
    if (!this.isEditMode) {
      return;
    }

    const draggedWidgetId = event.source.data?.id;

    if (!draggedWidgetId) {
      return;
    }

    const dragBoundsPoint = this.pointFromCurrentDragBounds(event.source.getRootElement());

    if (!dragBoundsPoint) {
      return;
    }

    this.lastDragBoundsPoint = dragBoundsPoint;
    const dropResult = this.previewDropResult(draggedWidgetId, dragBoundsPoint);

    if (!dropResult) {
      return;
    }

    const draggedItem = dropResult.layout.find((item) => item.id === draggedWidgetId);

    if (!draggedItem || typeof draggedItem.column !== 'number' || typeof draggedItem.row !== 'number') {
      return;
    }

    this.dropPreview = {
      column: draggedItem.column,
      row: draggedItem.row,
      size: draggedItem.size
    };
    this.dropPreviewStyles = this.buildDropPreviewStyles(this.dropPreview);
  }

  onDragEnded(): void {
    this.activeDragWidgetId = null;
  }

  gridColumnSpan(size: DashboardWidgetSize): number {
    return Number(size.split('x')[0]);
  }

  gridRowSpan(size: DashboardWidgetSize): number {
    return Number(size.split('x')[1]);
  }

  dropPreviewCells(): number[] {
    if (!this.dropPreview) {
      return [];
    }

    return this.ghostCells(this.dropPreview.size);
  }

  ghostCells(size: DashboardWidgetSize): number[] {
    const totalCells = this.gridColumnSpan(size) * this.gridRowSpan(size);
    return Array.from({ length: totalCells }, (_, index) => index);
  }

  trackByWidgetId(_: number, widget: DisplayedDashboardWidget): string {
    return widget.id;
  }

  private syncDisplayedWidgets(): void {
    const validIds = new Set(this.widgetDefinitions.map((widget) => widget.id));
    const persistedLayout = this.layoutService.loadLayout(this.dashboardId);

    const sourceItems: DashboardWidgetLayoutItem[] = persistedLayout?.widgets?.length
      ? persistedLayout.widgets
      : this.initialWidgetIds.length > 0
        ? this.initialWidgetIds.map((id) => ({ id, size: '2x2' as DashboardWidgetSize, column: undefined, row: undefined }))
        : this.displayedWidgetItems;

    const uniqueDisplayedItems: DashboardWidgetLayoutItem[] = [];

    for (const item of sourceItems) {
      if (!validIds.has(item.id) || uniqueDisplayedItems.some((existing) => existing.id === item.id)) {
        continue;
      }

      const definition = this.widgetDefinitions.find((widget) => widget.id === item.id);

      if (!definition) {
        continue;
      }

      const allowedSizes = this.allowedSizesForWidget(definition);
      const size = allowedSizes.includes(item.size)
        ? item.size
        : this.defaultSizeForWidget(definition);

      uniqueDisplayedItems.push({ id: item.id, size, column: item.column, row: item.row });
    }

    this.displayedWidgetItems = this.layoutWithPinnedWidget(uniqueDisplayedItems);
    this.persistLayout();
    if (!this.availableWidgets().some((widget) => widget.id === this.selectedWidgetId)) {
      this.selectedWidgetId = '';
    }
  }

  private allowedSizesForWidget(widget: DashboardWidgetDefinition): DashboardWidgetSize[] {
    if (widget.allowedSizes?.length) {
      return widget.allowedSizes;
    }

    return this.sizeOptions.map((option) => option.value);
  }

  private defaultSizeForWidget(widget: DashboardWidgetDefinition): DashboardWidgetSize {
    const allowedSizes = this.allowedSizesForWidget(widget);

    if (widget.defaultSize && allowedSizes.includes(widget.defaultSize)) {
      return widget.defaultSize;
    }

    return allowedSizes[0] ?? '2x2';
  }

  private layoutWithPinnedWidget(
    sourceItems: DashboardWidgetLayoutItem[],
    pinnedWidgetId?: string,
    pinnedColumn?: number,
    pinnedRow?: number
  ): DashboardWidgetLayoutItem[] {
    const occupiedCells = new Set<string>();
    const placedById = new Map<string, DashboardWidgetLayoutItem>();

    if (pinnedWidgetId) {
      const pinnedItem = sourceItems.find((item) => item.id === pinnedWidgetId);

      if (pinnedItem) {
        const pinnedPosition = this.findBestPositionForItem(
          pinnedItem.size,
          occupiedCells,
          pinnedColumn ?? pinnedItem.column ?? 1,
          pinnedRow ?? pinnedItem.row ?? 1
        );

        const placedPinned = {
          ...pinnedItem,
          column: pinnedPosition.column,
          row: pinnedPosition.row
        };

        this.markOccupied(occupiedCells, placedPinned);
        placedById.set(placedPinned.id, placedPinned);
      }
    }

    for (const item of sourceItems) {
      if (placedById.has(item.id)) {
        continue;
      }

      const position = this.findBestPositionForItem(
        item.size,
        occupiedCells,
        item.column ?? 1,
        item.row ?? 1
      );

      const placed = {
        ...item,
        column: position.column,
        row: position.row
      };

      this.markOccupied(occupiedCells, placed);
      placedById.set(item.id, placed);
    }

    return sourceItems
      .map((item) => placedById.get(item.id))
      .filter((item): item is DashboardWidgetLayoutItem => !!item);
  }

  private findNextAvailablePosition(
    size: DashboardWidgetSize,
    currentItems: DashboardWidgetLayoutItem[]
  ): { column: number; row: number } {
    const occupiedCells = new Set<string>();

    for (const item of currentItems) {
      if (typeof item.column === 'number' && typeof item.row === 'number') {
        this.markOccupied(occupiedCells, item as DashboardWidgetLayoutItem & { column: number; row: number });
      }
    }

    return this.findBestPositionForItem(size, occupiedCells, 1, 1);
  }

  private findBestPositionForItem(
    size: DashboardWidgetSize,
    occupiedCells: Set<string>,
    preferredColumn: number,
    preferredRow: number
  ): { column: number; row: number } {
    const columnSpan = this.gridColumnSpan(size);
    const rowSpan = this.gridRowSpan(size);

    const clampedStartColumn = this.clampColumn(preferredColumn, columnSpan);
    const clampedStartRow = Math.max(1, preferredRow);

    for (let row = clampedStartRow; row <= MAX_LAYOUT_SEARCH_ROWS; row += 1) {
      const startColumnForRow = row === clampedStartRow ? clampedStartColumn : 1;

      for (let column = startColumnForRow; column <= this.maxColumnStart(columnSpan); column += 1) {
        if (this.canPlace(size, column, row, occupiedCells)) {
          return { column, row };
        }
      }
    }

    for (let row = 1; row <= MAX_LAYOUT_SEARCH_ROWS; row += 1) {
      for (let column = 1; column <= this.maxColumnStart(columnSpan); column += 1) {
        if (this.canPlace(size, column, row, occupiedCells)) {
          return { column, row };
        }
      }
    }

    return { column: 1, row: 1 };
  }

  private canPlace(
    size: DashboardWidgetSize,
    column: number,
    row: number,
    occupiedCells: Set<string>
  ): boolean {
    const columnSpan = this.gridColumnSpan(size);
    const rowSpan = this.gridRowSpan(size);

    if (column < 1 || row < 1 || column + columnSpan - 1 > this.gridColumns) {
      return false;
    }

    for (let rowOffset = 0; rowOffset < rowSpan; rowOffset += 1) {
      for (let columnOffset = 0; columnOffset < columnSpan; columnOffset += 1) {
        const cellKey = `${column + columnOffset}:${row + rowOffset}`;

        if (occupiedCells.has(cellKey)) {
          return false;
        }
      }
    }

    return true;
  }

  private markOccupied(
    occupiedCells: Set<string>,
    item: DashboardWidgetLayoutItem & { column: number; row: number }
  ): void {
    const columnSpan = this.gridColumnSpan(item.size);
    const rowSpan = this.gridRowSpan(item.size);

    for (let rowOffset = 0; rowOffset < rowSpan; rowOffset += 1) {
      for (let columnOffset = 0; columnOffset < columnSpan; columnOffset += 1) {
        occupiedCells.add(`${item.column + columnOffset}:${item.row + rowOffset}`);
      }
    }
  }

  private maxColumnStart(columnSpan: number): number {
    return Math.max(1, this.gridColumns - columnSpan + 1);
  }

  private clampColumn(column: number, columnSpan: number): number {
    return Math.min(Math.max(1, column), this.maxColumnStart(columnSpan));
  }

  private gridPositionFromDropPoint(dropPoint: { x: number; y: number } | null | undefined): {
    column: number;
    row: number;
  } | null {
    if (!dropPoint || !this.dashboardGridRef) {
      return null;
    }

    const element = this.dashboardGridRef.nativeElement;
    const rect = element.getBoundingClientRect();
    const styles = getComputedStyle(element);

    const columnGap = Number.parseFloat(styles.columnGap || styles.gap || '0') || 0;
    const rowGap = Number.parseFloat(styles.rowGap || styles.gap || '0') || 0;
    const rowHeight = Number.parseFloat(styles.gridAutoRows || '110') || 110;

    const totalGapWidth = (this.gridColumns - 1) * columnGap;
    const cellWidth = Math.max(1, (rect.width - totalGapWidth) / this.gridColumns);

    const xOffset = dropPoint.x - rect.left + element.scrollLeft;
    const yOffset = dropPoint.y - rect.top + element.scrollTop;

    const column = Math.floor(xOffset / (cellWidth + columnGap)) + 1;
    const row = Math.floor(yOffset / (rowHeight + rowGap)) + 1;

    return {
      column: this.clampColumn(column, 1),
      row: Math.max(1, row)
    };
  }

  private previewDropResult(
    draggedWidgetId: string,
    pointerPosition: { x: number; y: number } | null | undefined
  ): { layout: DashboardWidgetLayoutItem[]; position: { column: number; row: number } } | null {
    const targetPosition = this.gridPositionFromDropPoint(pointerPosition);

    if (!targetPosition) {
      return null;
    }

    const nextLayout = this.layoutWithPinnedWidget(
      this.displayedWidgetItems,
      draggedWidgetId,
      targetPosition.column,
      targetPosition.row
    );

    const draggedItem = nextLayout.find((item) => item.id === draggedWidgetId);

    if (!draggedItem || typeof draggedItem.column !== 'number' || typeof draggedItem.row !== 'number') {
      return null;
    }

    return {
      layout: nextLayout,
      position: {
        column: draggedItem.column,
        row: draggedItem.row
      }
    };
  }

  private pointFromCurrentDragBounds(sourceElement: HTMLElement | null | undefined): {
    x: number;
    y: number;
  } | null {
    const previewElement = document.querySelector('.cdk-drag-preview') as HTMLElement | null;
    const element = previewElement ?? sourceElement;

    if (!element) {
      return null;
    }

    const elementRect = element.getBoundingClientRect();

    return {
      x: elementRect.left + 1,
      y: elementRect.top + 1
    };
  }

  private buildDropPreviewStyles(dropPreview: DropPreview): Record<string, string> | null {
    if (!this.dashboardGridRef) {
      return null;
    }

    const element = this.dashboardGridRef.nativeElement;
    const styles = getComputedStyle(element);

    const columnGap = Number.parseFloat(styles.columnGap || styles.gap || '0') || 0;
    const rowGap = Number.parseFloat(styles.rowGap || styles.gap || '0') || 0;
    const rowHeight = Number.parseFloat(styles.gridAutoRows || '110') || 110;
    const totalGapWidth = (this.gridColumns - 1) * columnGap;
    const cellWidth = Math.max(1, (element.clientWidth - totalGapWidth) / this.gridColumns);

    const columnSpan = this.gridColumnSpan(dropPreview.size);
    const rowSpan = this.gridRowSpan(dropPreview.size);

    const left = (dropPreview.column - 1) * (cellWidth + columnGap);
    const top = (dropPreview.row - 1) * (rowHeight + rowGap);
    const width = columnSpan * cellWidth + Math.max(0, columnSpan - 1) * columnGap;
    const height = rowSpan * rowHeight + Math.max(0, rowSpan - 1) * rowGap;

    return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
      '--ghost-cols': `${columnSpan}`,
      '--ghost-rows': `${rowSpan}`
    };
  }

  private persistLayout(): void {
    this.layoutService.saveLayout(this.dashboardId, { widgets: this.displayedWidgetItems });
  }
}