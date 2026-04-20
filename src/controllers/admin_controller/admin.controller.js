import bcrypt from "bcryptjs";
import { createUser, findUserByEmail } from "../../database/queries/user.query.js";
import { normalizeRole, ROLES } from "../../constants/roles.js";

export const createAdmin = async (req, res, next) => {
  try {
    if (normalizeRole(req.user.role) !== ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: "Only super_admin can create admins"
      });
    }

    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Full name, email and password are required"
      });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = await createUser(
      fullName,
      email,
      hashedPassword,
      ROLES.ADMIN
    );

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: {
        id: newAdmin.id,
        full_name: newAdmin.full_name,
        email: newAdmin.email,
        role: normalizeRole(newAdmin.role)
      }
    });
  } catch (error) {
    next(error);
  }
};
