import { IfcAPI } from "web-ifc/web-ifc-api";

const IfcAPI = new IfcAPI();
// IfcAPI.SetWasmPath("../../../../");

const input = document.getElementById("file-input");
IfcAPI.Init();
input.addEventListener("change", (changed) => {
  const reader = new FileReader();
  reader.onload = () => LoadFile(reader.result);
  reader.readAsText(changed.target.files[0]);
});

async function LoadFile(ifcAsText) {
  const uint8array = new TextEncoder().encode(ifcAsText);
  const modelID = await OpenIfc(uint8array);
  const allItems = GetAllItems(modelID);
  const result = JSON.stringify(allItems, undefined, 2);
}

async function OpenIfc(ifcAsText) {
  await IfcAPI.Init();
  return IfcAPI.OpenModel(ifcAsText);
}

function GetAllItems(modelID, excludeGeometry = false) {
  const allItems = {};
  const lines = IfcAPI.GetAllLines(modelID);
  getAllItemsFromLines(modelID, lines, allItems, excludeGeometry);
  return allItems;
}

function getAllItemsFromLines(modelID, lines, allItems, excludeGeometry) {
  for (let i = 1; i <= lines.size(); i++) {
    try {
      saveProperties(modelID, lines, allItems, excludeGeometry, i);
    } catch (e) {
      console.log(e);
    }
  }
}

function saveProperties(modelID, lines, allItems, excludeGeometry, index) {
  const itemID = lines.get(index);
  const props = IfcAPI.GetLine(modelID, itemID);
  props.type = props.__proto__.constructor.name;
  if (!excludeGeometry || !geometryTypes.has(props.type)) {
    allItems[itemID] = props;
  }
}