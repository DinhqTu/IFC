// import "./styles.css";
import { Button } from "./controllers/button";
import { Load } from "./controllers/load";
import {
  AmbientLight,
  AxesHelper,
  DirectionalLight,
  GridHelper,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  Raycaster,
  Vector2,
  MeshLambertMaterial,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import { IFCLoader } from "web-ifc-three/IFCLoader";
// import { IfcAPI } from "web-ifc/web-ifc-api";

import {
  IfcAPI,
  IFCSPACE,
  IFCBUILDINGSTOREY,
  IFCRELDEFINESBYPROPERTIES
} from "web-ifc/web-ifc-api";
// class World {
//   constructor() {

//   }
// }

//Creates the Three.js scene
const scene = new Scene();

//Object to store the size of the viewport
const size = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// const output = document.querySelector(".output");
// const output2 = document.querySelector(".output2");

//Creates the camera (point of view of the user)
const aspect = size.width / size.height;
const camera = new PerspectiveCamera(75, aspect);
camera.position.z = 15;
camera.position.y = 13;
camera.position.x = 8;

//Creates the lights of the scene
const lightColor = 0xffffff;

const ambientLight = new AmbientLight(lightColor, 0.5);
scene.add(ambientLight);

const directionalLight = new DirectionalLight(lightColor, 1);
directionalLight.position.set(0, 10, 0);
directionalLight.target.position.set(-5, 0, 0);
scene.add(directionalLight);
scene.add(directionalLight.target);

//Sets up the renderer, fetching the canvas of the HTML
const threeCanvas = document.getElementById("three-canvas");
const renderer = new WebGLRenderer({
  canvas: threeCanvas,
  alpha: true,
});

renderer.setSize(size.width, size.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

//Creates grids and axes in the scene
const grid = new GridHelper(50, 30);
scene.add(grid);

const axes = new AxesHelper();
axes.material.depthTest = false;
axes.renderOrder = 1;
scene.add(axes);

//Creates the orbit controls (to navigate the scene)
const controls = new OrbitControls(camera, threeCanvas);
controls.enableDamping = true;
controls.target.set(-2, 0, 0);

//Animation loop
const animate = () => {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};

animate();

//Adjust the viewport to the size of the browser
window.addEventListener("resize", () => {
  size.width = window.innerWidth;
  size.height = window.innerHeight;
  camera.aspect = size.width / size.height;
  camera.updateProjectionMatrix();
  renderer.setSize(size.width, size.height);
});

// Sets up the IFC loading
const ifcLoader = new IFCLoader();
const ifcapi = new IfcAPI();
ifcLoader.ifcManager.setWasmPath("../wasm/");

// // const booter = new Load();
// // booter.setWasmPath("wasm/");
const input = document.getElementById("file-input");

const ifcModels = [];
async function loadIFC(path) {
  ifcLoader.load(path, (ifcModel) => {
    ifcModels.push(ifcModel);
    scene.add(ifcModel);
  });
}

loadIFC("../model/47L.ifc");
// // booter.loadIFC("../model/47L.ifc");

input.addEventListener(
  "change",
  (changed) => {
    const file = changed.target.files[0];
    var ifcURL = URL.createObjectURL(file);
    loadIFC(ifcURL);
    // booter.loadIFC(ifcURL, (ifcModel) => scene.add(ifcModel));
  },
  false
);
  
ifcapi.SetWasmPath("../wasm/");

fetch("model/47L.ifc")
  .then((response) => response.text())
  .then((data) => {
    // This will send the file data to our LoadFileData method
    // console.log(data);
    LoadFileData(data);
  });

async function LoadFileData(ifcAsText) {
  const uint8array = new TextEncoder().encode(ifcAsText);
  modelID = await OpenIfc(uint8array);
  // console.log("ModelID", modelID);
  getPropertyWithExpressId(modelID);
  // getLevels();

}

async function OpenIfc(ifcAsText) {
  await ifcapi.Init();
  return ifcapi.OpenModel(ifcAsText);
}

async function getLevels() {
  levels = await ifcapi.GetLineIDsWithType(modelID, IFCBUILDINGSTOREY);
  // console.log("Lvl:", levels.size());
  for (let i = 0; i < levels.size(); i++) {
    const lvl = ifcapi.GetLine(modelID, levels.get(i));
    console.log(lvl);
    if (lvl.Name.value === 'Undefined') {
      // lvl.LongName.value = "Level 2";
      ifcapi.WriteLine(modelID, lvl);
      createDownloadLink(modelID);
    }
  }
}

function createDownloadLink(modelID) {
  const data = ifcapi.ExportFileAsIFC(modelID);
  const blob = new Blob([data]);
  const file = new File([blob], "modified.ifc");
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.innerText = "Download";
  link.download = "modified.ifc";
  link.setAttribute("href", url);

  document.body.appendChild(link);
}

const table = document.createElement("table");

function getPropertyWithExpressId(modelID=0) {
  // Clearing if previous values present
  const prop = document.getElementById("properties");
  prop.innerHTML = "";
  table.innerHTML = "";

  // Getting the Element ID from User and parsing it to
  const elementID = parseInt(document.getElementById("expressIDLabel").value);
  // Getting Element Data - Refer Below
  // If third parameter is added as true, we get a flatten result
  // const elementAll = ifcapi.GetAllLines(modelID);
  // console.log("All", elementAll);

  // const raw = ifcapi.GetRawLineData(modelID, elementID);
  // console.log("Raw", raw);
  const element = ifcapi.GetLine(modelID, elementID);
  // Now you can fetch GUID of that Element
  // const geometry = IfcAPI.GetGeometry(modelID, elementID);
  // createRowInTable("Type", geometry);
  for (const [key, value] of Object.entries(element)) {
    if (value) {
      if (typeof(value) === 'object'){
        createRowInTable(`${key}`, JSON.stringify(value));
      } else createRowInTable(`${key}`, value)
    }
    // console.log(key, value);
  }
  // const eid = element.expressId;
  // createRowInTable("ExpressID", eid);

  // const name = element.Name.value;
  // createRowInTable("Name", name);

  // const ifcType = element.__proto__.constructor.name;
  // createRowInTable("IfcType", ifcType);

  // const type = element.ObjectType.value;
  // createRowInTable("Object Type", type);

  // const tag = element.Tag.value;
  // createRowInTable("Tag", tag);

  // grab all propertyset lines in the file
  let lines = ifcapi.GetLineIDsWithType(modelID, IFCRELDEFINESBYPROPERTIES);
  // console.log("Lines", lines);

  // In the below array we will store the IDs of the Property Sets found
  let propSetIds = [];
  for (let i = 0; i < lines.size(); i++) {
      // Getting the ElementID from Lines
      let relatedID = lines.get(i);
      
      // Getting Element Data using the relatedID
      let relDefProps = ifcapi.GetLine(modelID, relatedID);
      
      // Boolean for Getting the IDs if relevant IDs are present
      let foundElement = false;

      // RelatedObjects is a property that is an Array of Objects. 
      // The way IFC is structured, Entities that use same property are included inside RelatedObjects
      // We Search inside RelatedObjects if our ElementID is present or not
      relDefProps.RelatedObjects.forEach((relID) => {
          if(relID.value === elementID){
              foundElement = true;
          }
      });

      if(foundElement){
          // Relevant IDs are found we then we go to RelatingPropertyDefinition
          // RelatingPropertyDefinition contain the IDs of Property Sets
          // But they should not be array, hence using (!Array.isArray())
          if(!Array.isArray(relDefProps.RelatingPropertyDefinition)){
              let handle = relDefProps.RelatingPropertyDefinition;

              // Storing and pushing the IDs found in propSetIds Array
              propSetIds.push(handle.value);
          }
      }
  }

  

  // Getting the Property Sets from their IDs
  let propsets = propSetIds.map(id => ifcapi.GetLine(modelID, id, true));

  propsets.forEach((set) => {
      // There can multiple Property Sets
      set.HasProperties.forEach(p => {
          // We will check if the Values that are present are not null
          if(p.NominalValue != null){
              if(p.NominalValue.label === "IFCBOOLEAN"){
                  // We will talk about this function in Frontend Part
                  createRowInTable(p.Name.value, p.NominalValue.value);
              }
              else{
                  // We will talk about this function in Frontend Part
                  createRowInTable(p.NominalValue.label, p.NominalValue.value);
              }
          }
      });
  });

  // Appending Table to our Div
  prop.appendChild(table);
}

function createRowInTable(label, value) {
  // Create a New Row Element
  const row = document.createElement("tr");

  // Add Label to 1st Coloumn and Value to 2nd Coloumn
  row.innerHTML = "<td>" + label + "</td><td>" + value + "</td>";

  // Appending the Row to Table - It means inserting Row inside Table
  table.appendChild(row);
}


// function getAllSpaces(modelID) {
//   // Get all the propertyset lines in the IFC file
//   let lines = ifcapi.GetLineIDsWithType(modelID, IFCSPACE);
//   let lineSize = lines.size();
//   let spaces = [];
//   for (let i = 0; i < lineSize; i++) {
//     // Getting the ElementID from Lines
//     let relatedID = lines.get(i);
//     // Getting Element Data using the relatedID
//     let relDefProps = ifcapi.GetLine(modelID, relatedID);
//     spaces.push(relDefProps);
//   }
//   return spaces;
// }

// function getIfcFile(url) {
//   return new Promise((resolve, reject) => {
//     var oReq = new XMLHttpRequest();
//     oReq.responseType = "arraybuffer";
//     oReq.addEventListener("load", () => {
//       resolve(new Uint8Array(oReq.response));
//     });
//     oReq.open("GET", url);
//     oReq.send();
//   });
// }
// ifcapi.Init().then(() => {
//   getIfcFile("model/47L.ifc").then((ifcData) => {
//     modelID = ifcapi.OpenModel(ifcData);
//     let isModelOpened = ifcapi.IsModelOpen(modelID);
//     console.log({ isModelOpened });
//     let spaces = getAllSpaces(modelID);
//     console.log({ spaces });
//     ifcapi.CloseModel(modelID);
//   });
// });
// let modelID = 0;

// // const button = new Button(threeCanvas, aspect, scene, booter.getIfcModels());
// // const button = new Button(threeCanvas, aspect, scene, ifcModels);
// // threeCanvas.ondblclick = button.pick;



// // async function OpenIfc(ifcAsText) {
// //   await ifcapi.Init();
// //   return ifcapi.OpenModel(ifcAsText);
// // }

// // document.getElementById("fetch").onclick = booter.fetchForText('../../model/47L.ifc');
// // booter.fetchForText();

// // threeCanvas.onmousemove = (event) => button.highlight(event, preselectMat, scene, preselectModel);
// // threeCanvas.ondblclick = (event) => button.highlight(event, selectMat, scene, selectModel);
