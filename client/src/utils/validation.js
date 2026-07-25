export const ALLOWED_EMAIL_DOMAINS = [
  '@charusat.edu.in',
  '@charusat.ac.in',
];

export const isValidInstitutionEmail = (email) =>
  ALLOWED_EMAIL_DOMAINS.some((domain) => email.toLowerCase().endsWith(domain));

export const getInstitutionIdFromEmail = (email) => {
  const atIndex = email.indexOf('@');
  if (atIndex === -1) return '';
  return email.substring(0, atIndex).toUpperCase();
};

export const validatePassword = (password) => {
  if (password.length < 6) return 'Password must be at least 6 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
    return 'Password must contain at least one special character.';
  return null;
};
