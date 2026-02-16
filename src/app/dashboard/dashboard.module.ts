import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { DashboardPageComponent } from './dashboard-page.component';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { CoreModule } from '@app/core/core.module';

@NgModule({
  imports: [CommonModule, DashboardRoutingModule, DashboardPageComponent, CoreModule]
})
export class DashboardModule {}
