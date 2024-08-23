import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import {
  Container, Grid, Typography, Card, CardContent, CardMedia, Checkbox, FormControlLabel,
  Tabs, Tab, Button, FormGroup, CircularProgress, Box, Alert, Badge
} from '@mui/material';

const App = () => {
  const [cabinets, setCabinets] = useState([]);
  const [selectedCabinets, setSelectedCabinets] = useState([]);
  const [category, setCategory] = useState('base');
  const [selectedDimensions, setSelectedDimensions] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [totalCarbonFootprint, setTotalCarbonFootprint] = useState(0);

  useEffect(() => {
  axios.get('http://localhost:5000/api/cabinets')
    .then(response => {
      console.log("Cabinet Data:", response.data); // Check the data received
      setCabinets(response.data);
    })
    .catch(error => {
      console.error("There was an error fetching the cabinets!", error);
    });
}, []);

  const handleSelection = (cabinetId) => {
    setSelectedCabinets(prev =>
      prev.includes(cabinetId) ? prev.filter(id => id !== cabinetId) : [...prev, cabinetId]
    );
  };

  const handleDimensionSelection = (cabinetType, subcatName, width) => {
	  setSelectedDimensions(prev => {
		const currentSelections = prev[cabinetType]?.[subcatName] || [];
		const updatedSelections = currentSelections.includes(width)
		  ? currentSelections.filter(w => w !== width)
		  : [...currentSelections, width];

		// Find the selected dimension and its carbon footprint
		const selectedSubcat = cabinets.find(c => c.type === cabinetType).subcategories.find(s => s.name === subcatName);
		const selectedDimension = selectedSubcat.dimensions.find(d => d.width === width);

		// Calculate the new total carbon footprint
		const footprintChange = selectedDimension.carbonFootprint * (updatedSelections.includes(width) ? 1 : -1);
		setTotalCarbonFootprint(prevTotal => prevTotal + footprintChange);

		return {
		  ...prev,
		  [cabinetType]: {
			...prev[cabinetType],
			[subcatName]: updatedSelections
		  }
		};
	  });
	};

  const handleSubmit = () => {
    setLoading(true);
    setMessage('');
    const data = { selectedCabinets, selectedDimensions };
    axios.post('http://localhost:5000/api/save-selections', data)
      .then(response => {
        setLoading(false);
        setMessage('Selections saved successfully');
      })
      .catch(error => {
        setLoading(false);
        setMessage('Error saving selections');
        console.error('Error saving selections:', error);
      });
  };

  const handleCategoryChange = (event, newCategory) => {
    setCategory(newCategory);
  };

  const handleReset = () => {
    setSelectedCabinets([]);
    setSelectedDimensions({});
	setTotalCarbonFootprint(0);
    setMessage('');
  };

  const countSelectedInCategory = (categoryType) => {
    const categorySelections = selectedDimensions[categoryType] || {};
    return Object.values(categorySelections).flat().length;
  };

  return (
	  <Container>
		<Box display="flex" justifyContent="space-between" alignItems="center">
		  <Typography variant="h3" gutterBottom>Kitchen Catalog</Typography>
		  <Typography variant="h6">
			Total Carbon Footprint: {totalCarbonFootprint.toFixed(2)} kg CO2e
		  </Typography>
		</Box>
		<Tabs value={category} onChange={handleCategoryChange} aria-label="category tabs">
		  <Tab label={<Badge color="secondary" badgeContent={countSelectedInCategory('base')}>Base Cabinets</Badge>} value="base" />
		  <Tab label={<Badge color="secondary" badgeContent={countSelectedInCategory('wall')}>Wall Cabinets</Badge>} value="wall" />
		  <Tab label={<Badge color="secondary" badgeContent={countSelectedInCategory('tall')}>Tall Cabinets</Badge>} value="tall" />
		</Tabs>
		{/*
		<Grid container spacing={3}>
		  {cabinets.filter(cabinet => cabinet.type === category).map(cabinet => (
			cabinet.subcategories.map((subcat, index) => (
			  <Grid item xs={12} sm={6} md={4} key={index}>
				<Card>
				  <div style={{ width: 256, height: 256, overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
					<CardMedia
					  component="img"
					  style={{ maxWidth: '100%', maxHeight: '100%' }}
					  image={subcat.image_url}
					  alt={subcat.name}
					/>
				  </div>
				  <CardContent>
					<Typography gutterBottom variant="h5" component="div">
					  {subcat.name}
					</Typography>
					<Typography variant="body2" color="text.secondary">
					  Select Width
					</Typography>
					{subcat.dimensions.length > 0 && (
					  <FormGroup>
						{subcat.dimensions.map((dim, idx) => (
						  <FormControlLabel
							key={idx}
							control={
							  <Checkbox
								checked={selectedDimensions[cabinet.type]?.[subcat.name]?.includes(dim.width) || false}
								onChange={() => handleDimensionSelection(cabinet.type, subcat.name, dim.width)}
							  />
							}
							label={`${dim.width}`}
						  />
						))}
						{selectedDimensions[cabinet.type]?.[subcat.name]?.length > 0 && (
						  <Typography variant="body2" color="text.secondary" style={{ marginTop: 8 }}>
							Carbon Footprint: {subcat.dimensions.find(dim => selectedDimensions[cabinet.type]?.[subcat.name]?.includes(dim.width)).carbonFootprint.toFixed(2)} kg CO2e
						  </Typography>
						)}
					  </FormGroup>
					)}
				  </CardContent>
				</Card>
			  </Grid>
			))
		  ))}
		</Grid>
		*/}
		<Box mt={3}>
		  <Button variant="contained" color="primary" onClick={handleSubmit} disabled={loading}>
			Save Selection
		  </Button>
		  <Button variant="outlined" color="secondary" onClick={handleReset} disabled={loading} style={{ marginLeft: 15 }}>
			Reset
		  </Button>
		  {loading && <CircularProgress size={24} style={{ marginLeft: 15 }} />}
		</Box>
		{message && (
		  <Box mt={3}>
			<Alert severity={message.includes('Error') ? 'error' : 'success'}>{message}</Alert>
		  </Box>
		)}
	  </Container>
	);
};

export default App;