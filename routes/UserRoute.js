const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

const { UserModel } = require("../model/UserModel");

const UserRoute = express.Router();

UserRoute.get("/", async (req, res) => {
    try {
        const AllUsers = await UserModel.find();

        res.status(201).json({ success: true, data: AllUsers });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

UserRoute.post("/register", async (req, res) => {
    const { name, email, mobile, password } = req.body;

    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    try {
        const existingUser = await UserModel.find({ email });

        if (!isValidEmail(email)) {
            return res.status(500).json({
                success: false,
                message: "its not a valid mail please check!",
            });
        }

        if (existingUser.length > 0) {
            return res
                .status(400)
                .json({ success: false, message: "User already exists" });
        }

        bcrypt.hash(password, 10, async (err, hash) => {
            if (err) {
                return res.status(500).json({ success: false, error: err.message });
            }

            try {
                const newUser = await UserModel.create({
                    name,
                    email,
                    mobile,
                    password: hash,
                });

                return res
                    .status(201)
                    .json({ success: true, message: "User Register Successfully" });
            } catch (err) {
                return res.status(500).json({ success: false, error: err.message });
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

UserRoute.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const finduser = await UserModel.find({ email });
        if (finduser.length > 0) {
            bcrypt.compare(password, finduser[0].password, async (err, result) => {
                if (result) {
                    const token = jwt.sign({ UserID: finduser[0]._id }, "saikhmirsat", {
                        expiresIn: "1d",
                    });

                    const setUserToken = await UserModel.updateMany(
                        { _id: finduser[0]._id },
                        [{ $set: { loginToken: token } }, { $set: { isAuth: true } }]
                    );

                    const user = await UserModel.find({ email });

                    return res.send({
                        success: true,
                        message: "Login Successful",
                        user,
                    });
                } else {
                    return res.send({ success: false, message: "Wrong creadencial" });
                }
            });
        } else {
            return res.send({
                success: false,
                message: "This email is not register please Register first ",
            });
        }
    } catch (err) {
        console.log(err);
    }
});

UserRoute.post("/logout/:_id", async (req, res) => {
    const id = req.params._id;

    try {
        const user = await UserModel.find({ _id: id });

        if (user.length > 0) {
            await UserModel.updateMany({ _id: user[0]._id }, [
                { $set: { loginToken: "" } },
                { $set: { isAuth: false } },
            ]);
            return res
                .status(201)
                .json({ success: true, message: "Logout successful" });
        } else {
            return res
                .status(500)
                .json({ success: false, message: "something wrong" });
        }
    } catch (err) {
        return res.status(500).json({ success: false, error: err });
    }
});

UserRoute.post("/resetpassword", async (req, res) => {
    const { email } = req.body;
    try {
        const findmail = await UserModel.find({ email });

        if (findmail.length > 0) {
            const token = jwt.sign(
                { UserID: findmail[0]._id },
                "saikhmirsat",
                { expiresIn: "2m" } // Set the expiration time to 2 minutes
            );

            await UserModel.updateMany({ _id: findmail[0]._id }, [
                { $set: { loginToken: token } },
                { $set: { date_of_updata_password: new Date() } },
            ]);

            const transporter = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: "saikh.mirsat55@gmail.com",
                    pass: "obktgevmkgfhxmqc",
                },
            });

            // Compose the email
            const mailOptions = {
                from: "saikh.mirsat55@gmail.com",
                to: findmail[0].email,
                subject: "Password Reset",
                text: `Here is your password reset link: https://forget-password-funtionality.vercel.app/forgetpassword/${findmail[0]._id}/${token}`,
            };

            // Send the email
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error("Error sending email:", error);
                    res.send({ success: false, message: "Error sending email" });
                } else {
                    console.log("Email sent:", info.response);
                    res.send({ success: true, message: "Email sent successfully" });
                }
            });
        } else {
            res.send({
                success: false,
                message: "Email not found. Please check your email!",
            });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "An error occurred" });
    }
});

UserRoute.patch("/forgetpassword/:id/:token", async (req, res) => {
    const { id, token } = req.params;
    const { password } = req.body;

    try {
        // Find the user by ID and token
        const findUser = await UserModel.findOne({ _id: id, loginToken: token });

        if (!findUser) {
            // No matching user found
            return res
                .status(404)
                .json({ success: false, message: "Invalid ID or token" });
        }

        const decodedToken = jwt.decode(token);
        const currentTime = Math.floor(Date.now() / 1000); // Convert to seconds

        if (decodedToken.exp < currentTime) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Password reset link has expired. Please request a new reset link.",
                });
        }

        // Update the user's password
        bcrypt.hash(password, 10, async (err, hash) => {
            if (err) {
                console.error("Password hash error:", err);
                return res
                    .status(500)
                    .json({
                        success: false,
                        message: "An error occurred while hashing the password.",
                    });
            }

            try {
                findUser.password = hash;
                await findUser.save();
                res
                    .status(200)
                    .json({ success: true, message: "Password updated successfully" });

                const token = jwt.sign(
                    { UserID: findUser._id },
                    "saikhmirsat",
                    { expiresIn: "1day" } // Set the expiration time to 1 minute
                );

                await UserModel.updateMany(
                    { _id: findUser._id },
                    [{ $set: { loginToken: token } }, { $set: { date_of_updata_password: new Date } }]
                );
            } catch (err) {
                console.error("Password update error:", err);
                res
                    .status(500)
                    .json({
                        success: false,
                        message: "An error occurred while updating the password.",
                    });
            }
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "An error occurred" });
    }
});

module.exports = {
    UserRoute,
};
