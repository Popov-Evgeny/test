const express = require('express');
const Category = require('../models/Category');

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const categories = await Category.find();
    return res.send(categories);
  } catch(e) {
    next(e);
  }
});

module.exports = router;
