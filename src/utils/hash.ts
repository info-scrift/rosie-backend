import bcrypt from 'bcryptjs';

export const hash = (password: string) => bcrypt.hashSync(password, 10);

export const compare = (password: string, hash: string) => bcrypt.compareSync(password, hash);