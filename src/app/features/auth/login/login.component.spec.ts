import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { signal } from '@angular/core';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: any;
  let router: Router;

  beforeEach(async () => {
    mockAuthService = {
      login: jasmine.createSpy('login'),
      currentRol: signal(null)
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule, RouterTestingModule.withRoutes([])],
      providers: [
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not submit if form is invalid', () => {
    component.form.setValue({ email: '', password: '' });
    component.onSubmit();
    expect(mockAuthService.login).not.toHaveBeenCalled();
  });

  it('should navigate to select-role if response has roles', () => {
    component.form.setValue({ email: 'test@test.com', password: 'password123' });
    mockAuthService.login.and.returnValue(of({ roles: ['ATLETA', 'ORGANIZADOR'], token: null }));
    
    component.onSubmit();

    expect(mockAuthService.login).toHaveBeenCalledWith({ email: 'test@test.com', password: 'password123' });
    expect(router.navigate).toHaveBeenCalledWith(['/auth/select-role']);
  });

  it('should navigate to dashboard if response only has token', () => {
    component.form.setValue({ email: 'test@test.com', password: 'password123' });
    mockAuthService.login.and.returnValue(of({ roles: [], token: 'fake-token' }));
    mockAuthService.currentRol = signal('ATLETA'); // mock signal value
    
    component.onSubmit();

    expect(mockAuthService.login).toHaveBeenCalledWith({ email: 'test@test.com', password: 'password123' });
    expect(router.navigate).toHaveBeenCalledWith(['/athlete']);
  });

  it('should set error message on login failure', () => {
    component.form.setValue({ email: 'test@test.com', password: 'wrong' });
    mockAuthService.login.and.returnValue(throwError(() => ({ error: { message: 'Invalid credentials' } })));
    
    component.onSubmit();

    expect(component.errorMessage()).toBe('Invalid credentials');
    expect(component.loading()).toBeFalse();
  });
});
