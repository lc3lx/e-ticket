export const validateAge = (date: Date, minAge: number, maxAge: number): { valid: boolean; error?: string } => {
  const today = new Date();
  const birthDate = new Date(date);

  if (isNaN(birthDate.getTime())) {
    return { valid: false, error: 'invalidDate' };
  }

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  if (age < minAge) return { valid: false, error: 'tooYoung' };
  if (age > maxAge) return { valid: false, error: 'tooOld' };

  return { valid: true };
};
