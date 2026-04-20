import { changePasswordService } from "../services/user.service.js";

export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Both current and new password are required"
      });
    }

    await changePasswordService(
      userId,
      currentPassword,
      newPassword
    );

    res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });

  } catch (error) {
    next(error);
  }
};