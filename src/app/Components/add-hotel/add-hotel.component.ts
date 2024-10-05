import { Component, NgZone, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';

import { HotelService } from '../../Services/hotel/hotel.service';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
import { HeremapsService } from '../../Services/heremaps/heremaps.service';

@Component({
  selector: 'app-add-hotel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    FormsModule,
    RouterModule,
  ],
  providers: [HotelService],
  templateUrl: './add-hotel.component.html',
  styleUrls: ['./add-hotel.component.css'],
})
export class AddHotelComponent {
  hotelForm!: FormGroup;
  selectedFiles: File[] = [];
  errorMessage: string = '';
  addressInput: string = '';

  constructor(
    private fb: FormBuilder,
    private hotelService: HotelService,
    private hereMapsService: HeremapsService,
    private router: Router,
    private zone: NgZone
  ) {}

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.hotelForm = this.fb.group({
      name: this.fb.group({
        en: [
          '',
          [
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(50),
          ],
        ],
        ar: [
          '',
          [
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(50),
          ],
        ],
      }),
      description: this.fb.group({
        en: ['', Validators.required],
        ar: ['', Validators.required],
      }),
      subDescription: this.fb.group({
        en: ['', Validators.required],
        ar: ['', Validators.required],
      }),
      phone: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      location: this.fb.group({
        Address: this.fb.group({
          en: ['', Validators.required],
          ar: ['', Validators.required],
        }),
        city: this.fb.group({
          en: ['', Validators.required],
          ar: ['', Validators.required],
        }),
        country: this.fb.group({
          en: ['', Validators.required],
          ar: ['', Validators.required],
        }),
      }),
      HouseRules: this.fb.group({
        NoSmoking: [false, Validators.required],
        NoPets: [false, Validators.required],
        NoParties: [false, Validators.required],
        CheckInTime: ['', Validators.required],
        CheckOutTime: ['', Validators.required],
        PricePerNight: ['', [Validators.required, Validators.min(1)]],
        Cancellation: this.fb.group({
          Policy: this.fb.group({
            en: [''],
            ar: [''],
          }),
          Refundable: [false],
          DeadlineDays: ['', [Validators.required, Validators.min(0)]],
        }),
      }),
      images: [[], Validators.required],
    });
  }

  onAddressInput(event: Event) {
    const input = (event.target as HTMLInputElement).value;
    this.addressInput = input;

    if (input.length > 3) {
      this.searchAddress(input);
    }
  }
  searchAddress(query: string) {
    this.hereMapsService.searchAddress(query).subscribe(
      (location) => {
        this.zone.run(() => {
          this.updateFormWithAddress(location);
        });
      },
      (error) => {
        console.error('Error searching address:', error);
      }
    );
  }

  updateFormWithAddress(location: any) {
    const addressEn = location.en.address;
    const addressAr = location.ar.address;

    this.hotelForm.patchValue({
      location: {
        Address: {
          en: addressEn.label || '',
          ar: addressAr.label || '',
        },
        city: {
          en: addressEn.city || '',
          ar: addressAr.city || '',
        },
        country: {
          en: addressEn.countryName || '',
          ar: addressAr.countryName || '',
        },
      },
    });
  }

  onFileSelect(event: Event) {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;
    if (fileList) {
      this.selectedFiles = [...this.selectedFiles, ...Array.from(fileList)];
      this.hotelForm.patchValue({ images: this.selectedFiles });
    }
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
    this.hotelForm.patchValue({ images: this.selectedFiles });
  }

  onSubmit() {
    if (this.hotelForm.valid && this.selectedFiles.length > 0) {
      const formData = this.hotelForm.value;
      formData.images = this.selectedFiles;
      this.hotelService.createHotel(formData, this.selectedFiles).subscribe(
        (response) => {
          console.log('Hotel created successfully', response);
          this.router.navigate([
            '/add-property/amenities/' + response.data._id,
          ]);
        },
        (error) => {
          console.error('Error creating hotel', error);
          this.errorMessage =
            error.error.message ||
            'An error occurred while creating the hotel. Please try again.';
        }
      );
    } else {
      this.errorMessage =
        'Please fill in all required fields and select at least one image.';
      Object.keys(this.hotelForm.controls).forEach((key) => {
        const control = this.hotelForm.get(key);
        control!.markAsTouched();
      });
    }
  }
}
