const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
    const token = req.headers.authorization;
    if (token) {
        jwt.verify(token, "saikhmirsat", (err, decoded) => {
            if (err) {
                console.log("Error:", err); // Log the error to see what's going wrong
                res.send({ "msg": "Please Login" });
            } else {
                console.log("Decoded:", decoded); // Log the decoded payload to verify the user ID
                req.body.user = decoded.UserID;
                next();
            }
        });
    } else {
        res.send({ "msg": "Please Login" });
    }
};

module.exports = {
    authenticate
};
