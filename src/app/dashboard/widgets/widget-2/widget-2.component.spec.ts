import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Widget2Component } from './widget-2.component';

describe('Widget2Component', () => {
  let component: Widget2Component;
  let fixture: ComponentFixture<Widget2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Widget2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Widget2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
