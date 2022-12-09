const User = require("../../models/User");

const auth = async (req, res, next) => {
  const token = req.get('Authorization');

  if (!token) {
    return res.status(401).send({error: 'No token!'});
  }

  const user = await User.findOne({token});

  if (!user) {
    return res.status(401).send({error: 'This token is incorrect!'});
  }

  req.user = user;

  next();
};

module.exports = auth;