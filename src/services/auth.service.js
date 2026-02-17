import bcrypt from "bcrypt";
import env from "../config/env.js";
import { generateToken } from "../utils/jwt.js";
import {
  findUserByEmail,
  createUser
} from "../database/queries/user.query.js";

export const registerService = async (fullName, email, password) => {
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw { status: 400, message: "Email already registered" };
  }

  const hashedPassword = await bcrypt.hash(password, env.BCRYPT_SALT);

  const user = await createUser(fullName, email, hashedPassword);

  const token = generateToken({
    id: user.id,
    role: user.role
  });

  return { user, token };
};

export const loginService = async (email, password) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw { status: 401, message: "Invalid credentials" };
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw { status: 401, message: "Invalid credentials" };
  }

  const token = generateToken({
    id: user.id,
    role: user.role
  });

  return {
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role
    },
    token
  };
};
