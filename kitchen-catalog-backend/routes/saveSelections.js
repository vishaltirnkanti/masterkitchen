const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const mongoose = require('mongoose');
const Cabinet = require('../models/Cabinet');

mongoose.connect('mongodb://localhost/kitchenCatalog', { useNewUrlParser: true, useUnifiedTopology: true });

router.post('/save-selections', async (req, res) => {
  const { selectedCabinets, selectedDimensions } = req.body;

  if (!selectedCabinets || !selectedDimensions) {
    return res.status(400).json({ message: 'Invalid request body. Ensure selectedCabinets and selectedDimensions are provided.' });
  }

  console.log("Selected Dimensions:", JSON.stringify(selectedDimensions, null, 2));

  try {
    const masterZipPath = path.join(__dirname, '../data/masterdata.zip');
    const extractionPath = path.join(__dirname, '../data/extracted');

    if (!fs.existsSync(extractionPath)) {
      fs.mkdirSync(extractionPath);
    }

    await fs.createReadStream(masterZipPath)
      .pipe(unzipper.Extract({ path: extractionPath }))
      .promise();

    const cabinets = await Cabinet.find().lean();

    const cabinetCodeMap = {};
    cabinets.forEach(cabinet => {
      if (!cabinetCodeMap[cabinet.type]) {
        cabinetCodeMap[cabinet.type] = {};
      }
      cabinet.subcategories.forEach(subcat => {
        if (!cabinetCodeMap[cabinet.type][subcat.name]) {
          cabinetCodeMap[cabinet.type][subcat.name] = {};
        }
        subcat.dimensions.forEach(dim => {
          const code = dim.cabinet_code;
          cabinetCodeMap[cabinet.type][subcat.name][dim.width] = code;
        });
      });
    });

    console.log("Cabinet Code Map:", JSON.stringify(cabinetCodeMap, null, 2));

    const selectedCodes = [];
    Object.entries(selectedDimensions).forEach(([cabinetType, subcats]) => {
      Object.entries(subcats).forEach(([subcatName, widths]) => {
        if (Array.isArray(widths)) {
          widths.forEach(width => {
            if (cabinetCodeMap[cabinetType] && cabinetCodeMap[cabinetType][subcatName] && cabinetCodeMap[cabinetType][subcatName][width]) {
              selectedCodes.push(cabinetCodeMap[cabinetType][subcatName][width]);
            }
          });
        }
      });
    });

    console.log("Selected Codes:", selectedCodes);

    const filterCabinets = (data, codes) => {
      return data.filter(item => codes.includes(item.code));
    };

    const files = fs.readdirSync(extractionPath).filter(file => file.startsWith('Items_Kitchen'));
    files.forEach(file => {
      const filePath = path.join(extractionPath, file);
      const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const updatedData = filterCabinets(jsonData, selectedCodes);
      console.log("Filtered Data for file:", file, updatedData);
      fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));
    });

    res.status(200).json({ message: 'Selections processed and updated successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

module.exports = router;