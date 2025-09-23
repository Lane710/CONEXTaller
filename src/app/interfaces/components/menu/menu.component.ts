// En src/app/menu/menu.component.ts

import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService, UserState } from '../../../services/aut.service';

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
    // Suscribirse al nuevo BehaviorSubject que contiene todo el estado
    this.authService.userState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((userState: UserState) => {
        this.userRole = userState.role;
        this.username = userState.username;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}