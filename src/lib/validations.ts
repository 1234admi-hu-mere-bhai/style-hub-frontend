import { z } from 'zod';

export const loginEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Please enter a valid email address' })
    .max(255, { message: 'Email must be less than 255 characters' }),
  password: z
    .string()
    .min(1, { message: 'Password is required' })
    .min(6, { message: 'Password must be at least 6 characters' })
    .max(100, { message: 'Password must be less than 100 characters' }),
});

export const loginPhoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, { message: 'Phone number is required' })
    .regex(/^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/, {
      message: 'Please enter a valid Indian phone number',
    }),
  password: z
    .string()
    .min(1, { message: 'Password is required' })
    .min(6, { message: 'Password must be at least 6 characters' })
    .max(100, { message: 'Password must be less than 100 characters' }),
});

export const signupSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, { message: 'First name is required' })
    .max(50, { message: 'First name must be less than 50 characters' })
    .regex(/^[a-zA-Z\s]+$/, { message: 'First name can only contain letters' }),
  lastName: z
    .string()
    .trim()
    .min(1, { message: 'Last name is required' })
    .max(50, { message: 'Last name must be less than 50 characters' })
    .regex(/^[a-zA-Z\s]+$/, { message: 'Last name can only contain letters' }),
  email: z
    .string()
    .trim()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Please enter a valid email address' })
    .max(255, { message: 'Email must be less than 255 characters' }),
  phone: z
    .string()
    .trim()
    .min(1, { message: 'Phone number is required' })
    .regex(/^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/, {
      message: 'Please enter a valid Indian phone number',
    }),
  password: z
    .string()
    .min(1, { message: 'Password is required' })
    .min(8, { message: 'Password must be at least 8 characters' })
    .max(100, { message: 'Password must be less than 100 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
});

export const addressSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, { message: 'Full name is required' })
    .max(100, { message: 'Name must be less than 100 characters' }),
  phone: z
    .string()
    .trim()
    .min(1, { message: 'Phone number is required' })
    .regex(/^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/, {
      message: 'Please enter a valid Indian phone number',
    }),
  address: z
    .string()
    .trim()
    .min(1, { message: 'Address is required' })
    .max(500, { message: 'Address must be less than 500 characters' }),
  city: z
    .string()
    .trim()
    .min(1, { message: 'City is required' })
    .max(100, { message: 'City must be less than 100 characters' }),
  state: z
    .string()
    .trim()
    .min(1, { message: 'State is required' })
    .max(100, { message: 'State must be less than 100 characters' }),
  pincode: z
    .string()
    .trim()
    .min(1, { message: 'PIN code is required' })
    .regex(/^[1-9][0-9]{5}$/, { message: 'Please enter a valid 6-digit PIN code' }),
  landmark: z
    .string()
    .trim()
    .max(200, { message: 'Landmark must be less than 200 characters' })
    .optional(),
});

export type LoginEmailFormData = z.infer<typeof loginEmailSchema>;
export type LoginPhoneFormData = z.infer<typeof loginPhoneSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type AddressFormData = z.infer<typeof addressSchema>;
