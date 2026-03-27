import * as bcrypt from 'bcrypt';

export const hashPassword = async (plainPassword: string) => {
  const hashedPassword = await bcrypt.hash(plainPassword, Number(process.env.B_CRYPT_SALT) ?? 12);

  return hashedPassword;
};

export const comparePassword = async (plainPassword: string, hashedPassword: string) => {
  const isMatch: boolean = await bcrypt.compare(plainPassword, hashedPassword);

  return isMatch;
};
