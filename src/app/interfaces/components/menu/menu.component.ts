import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../services/aut.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit, OnDestroy {
  @Input() sidebarActive: boolean = false;

  userRole: string | null = null;
  username: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(public authService: AuthService) { }

  ngOnInit(): void {
    // Suscribirse al BehaviorSubject para actualizar el rol automáticamente
    this.authService.userRole$
      .pipe(takeUntil(this.destroy$))
      .subscribe(role => {
        this.userRole = role;
      });

    // Tomar username directamente del localStorage
    this.username = this.authService.getUsername();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
