import React from 'react';
import { useState,useEffect } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Select, TextField, Card, CardContent, Typography, Grid, Container } from '@mui/material';
import Papa from "papaparse";
import Tooltip from "./Tooltip";


const DEFAULT_ARTIFACTS_CSV = "./artifacts.csv"; // Path to the default CSV file
const ArtifactCalculator = () => {
  const [selectedArtifacts, setSelectedArtifacts] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [savedBuilds, setSavedBuilds] = useState({});
  const [buildName, setBuildName] = useState(""); // State for build name input
  const [selecdetTemplate, setSelecdetTemplate] = useState(""); // State for build name input


  // Function to load artifacts from the default CSV file
  const loadDefaultArtifacts = () => {
    fetch(DEFAULT_ARTIFACTS_CSV)
      .then(response => response.text())
      .then(data => {
        Papa.parse(data, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            const parsedArtifacts = result.data.map((row, index) => {
              let name = row["Имя"] || "";
              if (!row["Имя"]) {
                for (let i = index - 1; i >= 0; i--) {
                  if (result.data[i]["Имя"]) {
                    name = result.data[i]["Имя"];
                    break;
                  }
                }
              }
              return {
                name,
                tier: Number(row["Тир"]) || 1,
                ...Object.fromEntries(
                  Object.entries(row).map(([key, value]) => [key, Number(value) || 0])
                )
              };
            });
            setArtifacts(parsedArtifacts);
          },
        });
      });
  };
  
    // Load saved builds from local storage
  useEffect(() => {
    const loadedBuilds = localStorage.getItem("savedBuilds");
    if (loadedBuilds) {
      setSavedBuilds(JSON.parse(loadedBuilds));
    }
  }, []);


  useEffect(() => {
    loadDefaultArtifacts(); // Load default artifacts on mount
  }, []);


  const selectArtifact = (artifact) => {
    setSelectedArtifacts((prev) => [...prev, { name: artifact.name, tier: artifact.tier }]);
    // setOpenDialog(false);
  };

  const removeArtifact = (index) => {
    setSelectedArtifacts((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTier = (index, tier) => {
    setSelectedArtifacts((prev) => {
      const updated = [...prev];
      updated[index].tier = Number(tier);
      return updated;
    });
  };

  const saveBuild = (name) => {
    const buildNameToSave = name || `Build_${new Date().toISOString().slice(0, 16).replace("T", "_").replace(/:/g, "-")}`;
    setSavedBuilds((prev) => ({ ...prev, [buildNameToSave]: selectedArtifacts }));
    localStorage.setItem("savedBuilds", JSON.stringify({ ...savedBuilds, [buildNameToSave]: selectedArtifacts }));
    setBuildName(""); // Clear the build name input after saving
  };

  const loadBuild = (name) => {
    if (savedBuilds[name]) {
      setSelectedArtifacts(savedBuilds[name]);
    }
  };

  const deleteBuild = (name) => {
    const updatedBuilds = { ...savedBuilds };
    delete updatedBuilds[name];
    setSavedBuilds(updatedBuilds);
    localStorage.setItem("savedBuilds", JSON.stringify(updatedBuilds));
	setSelecdetTemplate("");
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const parsedArtifacts = result.data.map((row, index) => {
            let name = row["Имя"] || "";
            if (!row["Имя"]) {
              for (let i = index - 1; i >= 0; i--) {
                if (result.data[i]["Имя"]) {
                  name = result.data[i]["Имя"];
                  break;
                }
              }
            }
            return {
              name,
              tier: Number(row["Тир"]) || 1,
              ...Object.fromEntries(
                Object.entries(row).map(([key, value]) => [key, Number(value) || 0])
              )
            };
          });
          setArtifacts(parsedArtifacts);
        },
      });
    }
  };

  const calculateStats = () => {
    return selectedArtifacts.reduce((acc, artifact) => {
      const fullArtifact = artifacts.find(a => a.name === artifact.name && a.tier === artifact.tier);
      if (fullArtifact) {
        Object.keys(fullArtifact).forEach((key) => {
          if (!["name", "tier", "Тир", "Имя", "№"].includes(key)) {
            acc[key] = (acc[key] || 0) + (fullArtifact[key] || 0);
          }
        });
      }
      return acc;
    }, {});
  };

  const stats = calculateStats();
  const MAX_TIERS = Math.max(...artifacts.map(a => a.tier), 4);
  const groupedArtifacts = Array.from({ length: MAX_TIERS }, () => []);
  
  artifacts.forEach((artifact) => {
    const tierIndex = Math.min(artifact.tier - 1, MAX_TIERS - 1);
    groupedArtifacts[tierIndex].push(artifact);
  });

  return (
    <Container maxWidth="md" className="p-4">
      <Typography variant="h5" gutterBottom>
        Калькулятор артефактов
        <input type="file" accept=".csv" onChange={handleFileUpload} className="mb-4" />
      </Typography>

      <Grid container spacing={2} className="mb-4">
        {selectedArtifacts.map((artifact, index) => (
          <Grid item xs={12 / 4} key={`${artifact.name}-${index}`}>
            <Card variant="outlined">
			<Tooltip>
              <CardContent tooltip={
						  <>
							<Typography variant="h6" gutterBottom>Суммарные характеристики</Typography>
							{Object.entries(artifacts.find(a => a.name === artifact.name && a.tier === artifact.tier)||{}).map(([key, value]) => {
							  
							  return value !== 0 && !["tier", "№"].includes(key) ? (
								<Typography key={key}>{key}: {value}</Typography>
							  ) : null;
							})}
						  </>
						}>
                <Typography variant="h6" align="center">{artifact.name}</Typography>
                <Select
                  value={artifact.tier}
                  onChange={(e) => updateTier(index, e.target.value)}
                  displayEmpty
                  fullWidth
                  variant="outlined"
                  margin="normal"
                >
                  {[...Array(MAX_TIERS).keys()].map(tier => (
                    <MenuItem key={tier + 1} value={tier + 1}>{`Тир ${tier + 1}`}</MenuItem>
                  ))}
                </Select>
                <Button variant="contained" color="error" onClick={() => removeArtifact(index)}>Удалить</Button>
                <Button variant="contained" color="error" onClick={() => selectArtifact(artifact)}>+</Button>
				
              </CardContent>
			</Tooltip>
            </Card>
          </Grid>
        ))}
        <Grid item xs={12}>
          <Button variant="outlined" onClick={() => setOpenDialog(true)}>Добавить артефакт</Button>
          <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
            <DialogTitle>Выберите артефакт</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} className="mb-4">
                {groupedArtifacts.map((tierArtifacts, tierIndex) => (
                  <Grid item xs={12 / MAX_TIERS} key={tierIndex}>
                    <Typography variant="subtitle1">Тир {tierIndex + 1}</Typography>
                    {tierArtifacts.map((artifact,index) => (
                      <Card
                        key={`${artifact.name}-${index}-${tierIndex}`}
                        variant="outlined"
                        onClick={() => selectArtifact(artifact)}
                        style={{ cursor: 'pointer' }}
                      >
						<Tooltip>
							<div     tooltip={
										  <>
											<Typography variant="h6" gutterBottom>Суммарные характеристики</Typography>
											{Object.entries(artifact).map(([key, value]) => 
											  value !== 0 && ![ "tier", "№"].includes(key) && <Typography key={key}>{key}: {value}</Typography>
											)}
										  </>
							}>
							  <Typography variant="body1">{artifact.name}</Typography>
							  <Typography variant="body1">{`Тир ${artifact.tier}`}</Typography>
							</div>
						</Tooltip>
                      </Card>
                    ))}
                  </Grid>
                ))}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)}>Закрыть</Button>
            </DialogActions>
          </Dialog>
        </Grid>
      </Grid>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>Суммарные характеристики</Typography>
          {Object.entries(stats).map(([key, value]) => value !== 0 && <Typography key={key}>{key}: {value}</Typography>)}
        </CardContent>
      </Card>
      <div className="flex flex-col gap-2 mt-4">
        <TextField
          value={buildName}
          onChange={(e) => setBuildName(e.target.value)}
          label="Введите название шаблона"
          variant="outlined"
          fullWidth
        />
        <div className="flex gap-2">
          <Button variant="outlined" onClick={() => setSelectedArtifacts([])}>Сбросить</Button>
          <Button variant="contained" onClick={() => saveBuild(buildName)}>Сохранить шаблон</Button>
          <Select
            onChange={(e) => {loadBuild(e.target.value)
			setSelecdetTemplate(e.target.value);
			}
			
			}
            displayEmpty
            variant="outlined"
			value = {selecdetTemplate}
          >
            <MenuItem value="">Загрузить шаблон (не выбран)</MenuItem>
            {Object.keys(savedBuilds).map((name) => (
              <MenuItem key={name} value={name}>{name}</MenuItem>
            ))}
          </Select>
          <Button variant="contained" color="error" onClick={() => deleteBuild(selecdetTemplate!= "" ? selecdetTemplate : prompt("Введите название шаблона для удаления"))}>
            Удалить шаблон
          </Button>
        </div>
      </div>
    </Container>
  );
};
 
function App() {
  return (
    <React.StrictMode>
      <ArtifactCalculator />
    </React.StrictMode>
  );
}

export default App;
