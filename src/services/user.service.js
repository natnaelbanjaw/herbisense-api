class User {
    getUser(req, res) {
        res.send("this is user router");
    }
    getUser2(req, res) {
        res.send("this is user router 2");
    }
}
module.exports = User;