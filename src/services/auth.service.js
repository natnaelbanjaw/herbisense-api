import bcrypt from "bcrypt";
import env from "../config/env.js";
import { generateToken } from "../utils/jwt.js";
import { normalizeRole, ROLES } from "../constants/roles.js";
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

  const user = await createUser(fullName, email, hashedPassword, ROLES.USER);
  const normalizedRole = normalizeRole(user.role);

const token = generateToken({
  id: user.id,
  role: normalizedRole,
  isSuperAdmin: user.is_super_admin
});

  return {
    user: { ...user, role: normalizedRole },
    token
  };
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

  const normalizedRole = normalizeRole(user.role);

  const token = generateToken({
    id: user.id,
    role: normalizedRole
  });

  return {
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: normalizedRole
    },
    token
  };
};
