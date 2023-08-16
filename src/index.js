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
  Mesh
} from "three";
import {
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
} from "three-mesh-bvh";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import { IFCLoader } from "web-ifc-three/IFCLoader";
// import { IfcAPI } from "web-ifc/web-ifc-api";

import {
  IfcAPI,
  IFCSPACE,
  IFCBUILDINGSTOREY,
  IFCRELDEFINESBYPROPERTIES,
  IFCSLAB
} from "web-ifc/web-ifc-api";

//Creates the Three.js scene
const scene = new Scene();

//Object to store the size of the viewport
const size = {
  width: window.innerWidth,
  height: window.innerHeight,
};

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
let ifcLoader = new IFCLoader();
const ifcapi = new IfcAPI();
ifcLoader.ifcManager.setWasmPath("../wasm/");

const booter = new Load();
booter.setWasmPath("wasm/");

ifcapi.SetWasmPath("../wasm/");
const ifcModels = [];

const input = document.getElementById("file-input");
async function loadIFC(path) {
  ifcLoader.load(path, (ifcModel) => {
    ifcModel.visible = false; 

    const modelCopy = new Mesh(
      ifcModel.geometry,
      new MeshLambertMaterial({
        transparent: true,
        opacity: 0.1,
        color: 0x77aaff,
      })
    );
    ifcModels.push(ifcModel);
    scene.add(ifcModel);
    scene.add(modelCopy);
  });
}

// // booter.loadIFC("../model/47L.ifc");

input.addEventListener(
  "change",
  (changed) => {
    const file = changed.target.files[0];
    var ifcURL = URL.createObjectURL(file);
    loadIFC(ifcURL);
    // booter.loadIFC(ifcURL, (ifcModel) => scene.add(ifcModel));
    fetch(ifcURL)
    .then((response) => response.text())
    .then((data) => {
      LoadFileData(data);
    });
  },
  false
);
  
  
// loadIFC("../model/SPAHOTEL.ifc");

async function LoadFileData(ifcAsText) {
  const uint8array = new TextEncoder().encode(ifcAsText);
  modelID = await OpenIfc(uint8array);
  // console.log("ModelID", modelID);
  // getAllProperties(modelID);
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

function displayPropertyFromExpressID(elementID) {
  // const elName = Object.getPrototypeOf(props).constructor.name;
  table.innerHTML = "";
  
  const element = ifcapi.GetLine(0, elementID);
  
  for (const [key, value] of Object.entries(element)) {
    if (key === 'type') {
      logAllSameType(value);
    }
    if (value) {
      if (typeof(value) === 'object'){
        createRowInTable(`${key}`, JSON.stringify(value));
      } else createRowInTable(`${key}`, value)
      
    }
  }
}

function getPropertyWithExpressId(modelID=0) {
  // Clearing if previous values present
  const prop = document.getElementById("properties");
  prop.innerHTML = "";
  table.innerHTML = "";

  // Getting the Element ID from User and parsing it to
  const elementID = parseInt(document.getElementById("expressIDLabel").value);
  
  const element = ifcapi.GetLine(modelID, elementID);
  
  for (const [key, value] of Object.entries(element)) {
    if (value) {
      if (typeof(value) === 'object'){
        createRowInTable(`${key}`, JSON.stringify(value));
      } else createRowInTable(`${key}`, value)
    }
  }

  let lines = ifcapi.GetLineIDsWithType(modelID, IFCRELDEFINESBYPROPERTIES);

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
  
  prop.appendChild(table);
}

function createRowInTable(label, value) {
  const row = document.createElement("tr");
  row.innerHTML = "<td>" + label + "</td><td>" + value + "</td>";
  table.appendChild(row);
}

async function releaseMemory() {
  await ifcLoader.ifcManager.dispose();
  ifcLoader = null;
  ifcLoader = new IFCLoader();

  await ifcLoader.ifcManager.setWasmPath("../wasm/");

  ifcModels.length = 0;
  table.innerHTML = "";
}

// Sets up memory disposalo
const releaseBtn = document.getElementById("memory-button");
releaseBtn.addEventListener(`click`, () => releaseMemory());
// releaseBtn.addEventListener(`click`, () => button.releaseMemory());

const preselectMat = new MeshLambertMaterial({
  transparent: true,
  opacity: 0.6,
  color: 0xff88ff,
  depthTest: false,
});
const selectMat = new MeshLambertMaterial({
  transparent: true,
  opacity: 0.6,
  color: 0xff00ff,
  depthTest: false,
});

ifcLoader.ifcManager.setupThreeMeshBVH(computeBoundsTree, disposeBoundsTree, acceleratedRaycast);

const button = new Button(ifcLoader, ifcapi, threeCanvas, aspect, scene, ifcModels);
threeCanvas.ondblclick = (event) => button.pick(event, (elementID) => displayPropertyFromExpressID(elementID));
window.onmousemove = (event) => button.highlight(event, undefined, 'highlightModel');
window.ondblclick = (event) => button.highlight(event, selectMat, 'selectModel');
// window.onmousemove = (event) => button.highlight(event, preselectMat, preselectModel);


async function logAllSameType(typeID) {
  const slabsID = await ifcLoader.ifcManager.getAllItemsOfType(0, typeID);

  for (let i = 0; i <= slabsID.length; i++) {
    const slabID = slabsID[i];
    const slabProperties = await ifcLoader.ifcManager.getItemProperties(0, slabID);
    console.log(slabProperties);
  }
}

