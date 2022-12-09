const path = require('path');
const fs = require("fs").promises;
const express = require('express');
const multer = require('multer');
const { nanoid } = require('nanoid');
const config = require('../config');
const Product = require('../models/Product')
const mongoose = require("mongoose");
const auth = require("./middleware/auth");


const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, nanoid() + path.extname(file.originalname))
  }
});

const upload = multer({storage});

router.get('/', async (req, res, next) => {
  try {
    const query = {};

    if (req.query.category) {
      query.category = req.query.category
    }
    const products = await Product.find(query).populate('user', 'name');
    return res.send(products);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('user', '_id');

    if (!product) {
      return res.status(404).send({message: 'Not found'});
    }

    return res.send(product);
  } catch (e) {
    next(e);
  }
});

router.post('/', upload.single('image'), auth, async (req, res, next) => {
  try {
    const productData = {
      title: req.body.title,
      category: req.body.category,
      price: parseFloat(req.body.price),
      description: req.body.description,
      image: null,
      user: req.user._id,
    };

    if (req.file) {
      productData.image = req.file.filename;
    }

    const product = new Product(productData);

    await product.save();

    return res.send({message: 'Created new product', id: product._id});
  } catch (e) {
    if (e instanceof mongoose.Error.ValidationError) {
      if (req.file) {
        await fs.unlink(req.file.path);
      }

      return res.status(400).send(e);
    }

    next(e);
  }
});

router.delete('/:id', auth , upload.single('image'), async (req, res, next) => {
  try {
    const product = await Product.findOne({_id: req.params.id}).populate('user', '_id token');
    const token = req.get('Authorization');

    if(token === product.user.token){
      await Product.deleteOne({_id: req.params.id});
      return res.send({message: 'delete'});
    }
    return res.status(403).send({error: 'You don`t have access'});
  } catch (error) {
    if(error instanceof mongoose.Error.ValidationError){
      return res.status(400).send(error);
    }
    return next(error);
  }
});

module.exports = router;