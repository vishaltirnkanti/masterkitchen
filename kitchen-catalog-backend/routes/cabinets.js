const express = require('express');
const router = express.Router();
const Cabinet = require('../models/Cabinet');
const Material = require('../models/Material');

router.get('/', async (req, res) => {
  try {
    const cabinets = await Cabinet.find().lean();
    const materials = await Material.find().lean();
	console.log("Materials from DB:", materials);

    const materialMap = materials.reduce((map, material) => {
	  map[material.material.trim()] = material.emissionFactor;
	  return map;
	}, {});
	console.log("Material Map:", materialMap);

    cabinets.forEach(cabinet => {
	  cabinet.subcategories.forEach(subcat => {
		subcat.dimensions.forEach(dim => {
		  let totalCarbonFootprint = 0;
		  if (dim.materials) {
			dim.materials.forEach(material => {
			  const cleanMaterialName = material.name.trim();  // Remove trailing spaces and special characters
			  const emissionFactor = materialMap[cleanMaterialName];
			  console.log(`Material: ${cleanMaterialName}, Weight: ${material.weight}, Emission Factor: ${emissionFactor}`);
			  if (emissionFactor) {
				totalCarbonFootprint += material.weight * emissionFactor;
			  }
			});
		  }
		  console.log(`Total Carbon Footprint for ${dim.width}: ${totalCarbonFootprint}`);
		  dim.carbonFootprint = totalCarbonFootprint;
		});
	  });
	});

    res.json(cabinets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;