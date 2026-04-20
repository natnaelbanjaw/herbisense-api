
import bcrypt from "bcryptjs";
import {
  getUserByIdQuery,
  updateUserPasswordQuery
} from "../queries/user.query.js";

export const changePasswordService = async (
  userId,
  currentPassword,
  newPassword
) => {
  const user = await getUserByIdQuery(userId);

  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  const isMatch = await bcrypt.compare(
    currentPassword,
    user.password
  );

  if (!isMatch) {
    throw { status: 400, message: "Current password is incorrect" };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  return await updateUserPasswordQuery(
    userId,
    hashedPassword
  );
};

class User {
    getUser(req, res) {
        res.send("this is user router");
    }
    getUser2(req, res) {
        res.send("this is user router 2");
    }
}
module.exports = User;