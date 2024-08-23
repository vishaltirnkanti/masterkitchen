const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const mongoose = require('mongoose');
const Cabinet = require('../models/Cabinet'); // Ensure correct path to Cabinet model

mongoose.connect('mongodb://localhost/kitchenCatalog', { useNewUrlParser: true, useUnifiedTopology: true });

router.post('/save-selections', async (req, res) => {
  const { selectedCabinets, selectedDimensions } = req.body;

  console.log('Request Body:', req.body);
  console.log('Selected Cabinets:', selectedCabinets);
  console.log('Selected Dimensions:', selectedDimensions);

  if (!selectedCabinets || !selectedDimensions) {
    return res.status(400).json({ message: 'Invalid request body. Ensure selectedCabinets and selectedDimensions are provided.' });
  }

  try {
    const masterZipPath = path.join(__dirname, '../data/masterdata.zip');
    const extractionPath = path.join(__dirname, '../data/extracted');

    if (!fs.existsSync(extractionPath)) {
      fs.mkdirSync(extractionPath);
    }

    console.log(`Extracting ${masterZipPath} to ${extractionPath}`);

    await fs.createReadStream(masterZipPath)
      .pipe(unzipper.Extract({ path: extractionPath }))
      .promise();

    console.log('Extraction complete');

    const cabinets = await Cabinet.find().lean();
    console.log('Fetched Cabinets from MongoDB:', JSON.stringify(cabinets, null, 2));

    const cabinetCodeMap = {};
    cabinets.forEach(cabinet => {
      console.log(`Processing cabinet: ${cabinet.name}`);
      if (!cabinetCodeMap[cabinet.type]) {
        cabinetCodeMap[cabinet.type] = {};
      }
      cabinet.subcategories.forEach(subcat => {
        console.log(`  Subcategory: ${subcat.name}`);
        if (!cabinetCodeMap[cabinet.type][subcat.name]) {
          cabinetCodeMap[cabinet.type][subcat.name] = {};
        }
        subcat.dimensions.forEach(dim => {
          const code = dim.cabinet_code;
          console.log(`    Dimension: ${dim.width}, Code: ${code}`);
          cabinetCodeMap[cabinet.type][subcat.name][dim.width] = code;
        });
      });
    });

    console.log('Cabinet Code Map:', JSON.stringify(cabinetCodeMap, null, 2));

    const selectedCodes = [];
    const selectedDimensionsEntries = Object.entries(selectedDimensions);
    console.log('Selected Dimensions Entries:', JSON.stringify(selectedDimensionsEntries, null, 2));

    selectedDimensionsEntries.forEach(([cabinetType, subcats]) => {
      console.log(`Cabinet Type: ${cabinetType}`);
      const subcatsEntries = Object.entries(subcats);
      console.log(`Subcategories Entries for ${cabinetType}:`, JSON.stringify(subcatsEntries, null, 2));

      subcatsEntries.forEach(([subcatName, widths]) => {
        console.log(`Subcategory: ${subcatName}, Widths: ${widths}`);
        if (Array.isArray(widths)) {
          widths.forEach(width => {
            if (cabinetCodeMap[cabinetType] && cabinetCodeMap[cabinetType][subcatName] && cabinetCodeMap[cabinetType][subcatName][width]) {
              selectedCodes.push(cabinetCodeMap[cabinetType][subcatName][width]);
            } else {
              console.log(`Code not found for cabinet type: ${cabinetType}, subcategory: ${subcatName}, width: ${width}`);
            }
          });
        } else {
          console.log(`Widths is not an array for subcategory: ${subcatName}`, widths);
        }
      });
    });

    console.log('Selected Codes:', selectedCodes);

    const filterCabinets = (data, codes) => {
      return data.filter(item => {
        const result = codes.includes(item.cabinet_code);
        if (!result) {
          console.log(`Filtering out item with code: ${item.cabinet_code}`);
        }
        return result;
      });
    };

    const files = fs.readdirSync(extractionPath).filter(file => file.startsWith('Items_Kitchen'));
    files.forEach(file => {
      const filePath = path.join(extractionPath, file);
      const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      console.log(`Processing file: ${file}`);
      console.log(`Original Data Length: ${jsonData.length}`);

      const updatedData = filterCabinets(jsonData, selectedCodes);

      console.log(`Filtered Data Length: ${updatedData.length}`);

      fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));
    });

    res.status(200).json({ message: 'Selections processed and updated successfully' });

  } catch (error) {
    console.error('Error processing selections:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

module.exports = router;