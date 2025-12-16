import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TimelineComponent } from './components/timeline/timeline.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MatToolbarModule, TimelineComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Income Flow';
}
