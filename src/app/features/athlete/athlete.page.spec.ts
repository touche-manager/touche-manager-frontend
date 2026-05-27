import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { AthletePageComponent } from './athlete.page';
import { AthleteService } from './services/athlete.service';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AthleteResponse } from '../../core/models/athlete.models';
import { provideRouter, RouterLink } from '@angular/router';
import { By } from '@angular/platform-browser';

describe('AthletePageComponent', () => {
  let component: AthletePageComponent;
  let athleteServiceSpy: jasmine.SpyObj<AthleteService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('AthleteService', [
      'getProfile',
      'createProfile',
      'updateProfile',
      'getDocuments',
      'uploadDocument',
      'downloadDocument',
      'deleteDocument'
    ]);

    await TestBed.configureTestingModule({
      imports: [AthletePageComponent, ReactiveFormsModule],
      providers: [
        { provide: AthleteService, useValue: spy },
        provideRouter([])
      ]
    }).compileComponents();

    athleteServiceSpy = TestBed.inject(AthleteService) as jasmine.SpyObj<AthleteService>;
    athleteServiceSpy.getDocuments.and.returnValue(of([]));
  });

  it('should create the component', () => {
    athleteServiceSpy.getProfile.and.returnValue(of({} as AthleteResponse));
    const fixture = TestBed.createComponent(AthletePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      const errorResponse = new HttpErrorResponse({ status: 404, statusText: 'Not Found' });
      athleteServiceSpy.getProfile.and.returnValue(throwError(() => errorResponse));
    });

    it('should validate form fields when empty', () => {
      const fixture = TestBed.createComponent(AthletePageComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      const form = component.athleteForm;
      expect(form.valid).toBeFalse();
      expect(form.get('firstName')?.hasError('required')).toBeTrue();
      expect(form.get('lastName')?.hasError('required')).toBeTrue();
      expect(form.get('dni')?.hasError('required')).toBeTrue();
      expect(form.get('birthDate')?.hasError('required')).toBeTrue();
      expect(form.get('gender')?.hasError('required')).toBeTrue();
      expect(form.get('dominantHand')?.hasError('required')).toBeTrue();
      expect(form.get('club')?.hasError('required')).toBeTrue();
      expect(form.get('province')?.hasError('required')).toBeTrue();
    });

    it('should validate DNI pattern', () => {
      const fixture = TestBed.createComponent(AthletePageComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      const dniControl = component.athleteForm.get('dni');

      dniControl?.setValue('12345'); // too short
      expect(dniControl?.hasError('pattern')).toBeTrue();

      dniControl?.setValue('abc12345'); // non-numeric
      expect(dniControl?.hasError('pattern')).toBeTrue();

      dniControl?.setValue('12345678901'); // too long
      expect(dniControl?.hasError('pattern')).toBeTrue();

      dniControl?.setValue('12345678'); // valid (8 digits)
      expect(dniControl?.hasError('pattern')).toBeFalse();
    });
  });

  describe('Profile Initialization', () => {
    it('should populate form and set isEditMode to true on loadProfile success', () => {
      const mockProfile: AthleteResponse = {
        id: 10,
        userId: 1,
        email: 'athlete@test.com',
        firstName: 'Juan',
        lastName: 'Pérez',
        dni: '12345678',
        birthDate: '1995-05-15',
        gender: 'MASCULINO',
        dominantHand: 'DIESTRO',
        club: 'Club de Esgrima',
        province: 'Córdoba'
      };
      athleteServiceSpy.getProfile.and.returnValue(of(mockProfile));

      const fixture = TestBed.createComponent(AthletePageComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.isEditMode()).toBeTrue();
      expect(component.loading()).toBeFalse();
      expect(component.error()).toBeNull();
      expect(component.athleteForm.value).toEqual({
        firstName: 'Juan',
        lastName: 'Pérez',
        dni: '12345678',
        birthDate: '1995-05-15',
        gender: 'MASCULINO',
        dominantHand: 'DIESTRO',
        club: 'Club de Esgrima',
        province: 'Córdoba'
      });
    });

    it('should set isEditMode to false and keep error null on loadProfile 404 error', () => {
      const errorResponse = new HttpErrorResponse({ status: 404, statusText: 'Not Found' });
      athleteServiceSpy.getProfile.and.returnValue(throwError(() => errorResponse));

      const fixture = TestBed.createComponent(AthletePageComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.isEditMode()).toBeFalse();
      expect(component.loading()).toBeFalse();
      expect(component.error()).toBeNull();
    });

    it('should set error message on loadProfile generic error', () => {
      const errorResponse = new HttpErrorResponse({
        status: 500,
        error: { message: 'Error al cargar el perfil de atleta.' }
      });
      athleteServiceSpy.getProfile.and.returnValue(throwError(() => errorResponse));

      const fixture = TestBed.createComponent(AthletePageComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.loading()).toBeFalse();
      expect(component.error()).toBe('Error al cargar el perfil de atleta.');
    });
  });

  describe('Form Submission', () => {
    it('should not call any service and mark all controls as touched if form is invalid on submit', () => {
      const errorResponse = new HttpErrorResponse({ status: 404, statusText: 'Not Found' });
      athleteServiceSpy.getProfile.and.returnValue(throwError(() => errorResponse));

      const fixture = TestBed.createComponent(AthletePageComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      component.onSubmit();

      expect(athleteServiceSpy.createProfile).not.toHaveBeenCalled();
      expect(athleteServiceSpy.updateProfile).not.toHaveBeenCalled();
      expect(component.athleteForm.touched).toBeTrue();
    });

    it('should call createProfile, set success, set isEditMode and clear success after 5 seconds', fakeAsync(() => {
      const errorResponse = new HttpErrorResponse({ status: 404, statusText: 'Not Found' });
      athleteServiceSpy.getProfile.and.returnValue(throwError(() => errorResponse));

      const mockResponse: AthleteResponse = {
        id: 10,
        userId: 1,
        email: 'athlete@test.com',
        firstName: 'Juan',
        lastName: 'Pérez',
        dni: '12345678',
        birthDate: '1995-05-15',
        gender: 'MASCULINO',
        dominantHand: 'DIESTRO',
        club: 'Club de Esgrima',
        province: 'Córdoba'
      };
      athleteServiceSpy.createProfile.and.returnValue(of(mockResponse));

      const fixture = TestBed.createComponent(AthletePageComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      component.athleteForm.setValue({
        firstName: 'Juan',
        lastName: 'Pérez',
        dni: '12345678',
        birthDate: '1995-05-15',
        gender: 'MASCULINO',
        dominantHand: 'DIESTRO',
        club: 'Club de Esgrima',
        province: 'Córdoba'
      });

      component.onSubmit();

      expect(athleteServiceSpy.createProfile).toHaveBeenCalledWith(component.athleteForm.value);
      expect(component.success()).toBeTrue();
      expect(component.isEditMode()).toBeTrue();
      expect(component.loading()).toBeFalse();

      tick(5000);
      expect(component.success()).toBeFalse();
    }));

    it('should call updateProfile and set success when isEditMode is true', fakeAsync(() => {
      const initialProfile: AthleteResponse = {
        id: 10,
        userId: 1,
        email: 'athlete@test.com',
        firstName: 'Juan',
        lastName: 'Pérez',
        dni: '12345678',
        birthDate: '1995-05-15',
        gender: 'MASCULINO',
        dominantHand: 'DIESTRO',
        club: 'Club de Esgrima',
        province: 'Córdoba'
      };
      athleteServiceSpy.getProfile.and.returnValue(of(initialProfile));

      const updatedProfile: AthleteResponse = {
        ...initialProfile,
        club: 'Nuevo Club'
      };
      athleteServiceSpy.updateProfile.and.returnValue(of(updatedProfile));

      const fixture = TestBed.createComponent(AthletePageComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      component.athleteForm.patchValue({ club: 'Nuevo Club' });
      component.onSubmit();

      expect(athleteServiceSpy.updateProfile).toHaveBeenCalledWith(component.athleteForm.value);
      expect(component.success()).toBeTrue();
      expect(component.loading()).toBeFalse();

      tick(5000);
      expect(component.success()).toBeFalse();
    }));

    it('should set error message when save profile fails', () => {
      const errorResponse = new HttpErrorResponse({ status: 404, statusText: 'Not Found' });
      athleteServiceSpy.getProfile.and.returnValue(throwError(() => errorResponse));

      const saveErrorResponse = new HttpErrorResponse({
        status: 400,
        error: { message: 'El DNI ya existe.' }
      });
      athleteServiceSpy.createProfile.and.returnValue(throwError(() => saveErrorResponse));

      const fixture = TestBed.createComponent(AthletePageComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      component.athleteForm.setValue({
        firstName: 'Juan',
        lastName: 'Pérez',
        dni: '12345678',
        birthDate: '1995-05-15',
        gender: 'MASCULINO',
        dominantHand: 'DIESTRO',
        club: 'Club de Esgrima',
        province: 'Córdoba'
      });

      component.onSubmit();

      expect(component.loading()).toBeFalse();
      expect(component.success()).toBeFalse();
      expect(component.error()).toBe('El DNI ya existe.');
    });
  });

  describe('isFieldInvalid Helper', () => {
    beforeEach(() => {
      const errorResponse = new HttpErrorResponse({ status: 404, statusText: 'Not Found' });
      athleteServiceSpy.getProfile.and.returnValue(throwError(() => errorResponse));
    });

    it('should return true only if field is invalid and dirty/touched', () => {
      const fixture = TestBed.createComponent(AthletePageComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      const firstNameControl = component.athleteForm.get('firstName');

      expect(component.isFieldInvalid('firstName')).toBeFalse();

      firstNameControl?.markAsTouched();
      expect(component.isFieldInvalid('firstName')).toBeTrue();

      firstNameControl?.setValue('Juan');
      expect(component.isFieldInvalid('firstName')).toBeFalse();
    });
  });

  describe('Document Management', () => {
    beforeEach(() => {
      athleteServiceSpy.getProfile.and.returnValue(of({ id: 10 } as AthleteResponse));
    });

    it('should load documents when switching to documents tab', () => {
      const fixture = TestBed.createComponent(AthletePageComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      component.setTab('documents');

      expect(component.activeTab()).toBe('documents');
      expect(athleteServiceSpy.getDocuments).toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('should render "Volver al panel" button with routerLink="/athlete"', () => {
      athleteServiceSpy.getProfile.and.returnValue(of({} as AthleteResponse));
      const fixture = TestBed.createComponent(AthletePageComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      const debugEl = fixture.debugElement.query(By.directive(RouterLink));
      expect(debugEl).toBeTruthy();
      
      const element = debugEl.nativeElement as HTMLAnchorElement;
      expect(element.getAttribute('routerLink')).toBe('/athlete');
      expect(element.textContent).toContain('Volver al panel');
    });
  });
});
