const express = require('express');
const path = require('path');
const router = express.Router();


router.get('/ping', (req, res) => {
  res.status(200).send('7f29b18a-b2a7-473b-b63f-57b728f780eb');
});
module.exports = router;
