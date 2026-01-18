// Password validation regex: must have uppercase, special char, and number
export const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])(?=.*[0-9]).+$/;

// Password validation rules
export const passwordValidationRules = [
  { required: true, message: 'Please input your password!' },
  { min: 8, message: 'Min 8 characters!' },
  {
    pattern: passwordRegex,
    message: 'Must include: uppercase, special character, number!',
  },
];
