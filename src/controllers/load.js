import { IFCLoader } from "web-ifc-three/IFCLoader";
import {
    geometryTypes
} from "./geometry-types";
import {
    IfcAPI, IFCRELDEFINESBYPROPERTIES
} from "web-ifc/web-ifc-api";

class Load {
    constructor() {
        this.ifcLoader = new IFCLoader();
        this.ifcapi = new IfcAPI();
        this.ifcapi.SetWasmPath("../wasm/");
        this.ifcLoader.ifcManager.setWasmPath("../wasm/");
        this.setWasmPath = this.setWasmPath.bind(this);
        
        this.ifcModels = [];

        // this.prop = document.getElementById("properties");
        // this.table = document.createElement("table");
        // this.leftContainer = document.getElementById("left-container");
        // this.json = document.getElementById("json");
        // this.row = document.createElement("tr");

        window.getPropertyWithExpressId = this.getPropertyWithExpressId;



        // this.ifcapi.Init().then(()=>{
        //     getIfcFile(ifcFileLocation).then((ifcData) => {
        //       modelID = ifcapi.OpenModel(ifcData);
        //       let isModelOpened = ifcapi.IsModelOpen(modelID);
        //       console.log({isModelOpened});
        //       ifcapi.CloseModel(modelID);
        //     });
        //   });
    }

    fetchForText(path) {
        fetch(path)
        .then(response => response.text())
        .then(data => {
            console.log(data);
            this.LoadFileData(data);
        });
    }

    async LoadFileData(ifcAsText) {
        // this.leftContainer.innerHTML = ifcAsText.replace(/(?:\r\n|\r|\n)/g, '<br>');
        const uint8array = new TextEncoder().encode(ifcAsText);
        const modelID = await this.OpenIfc(uint8array);
        const allItems = this.GetAllItems(modelID);
        const result = JSON.stringify(allItems, undefined, 2);
        console.log("Result", result);
        // json.textContent = result;
    
    }

    setWasmPath(path) {
        this.ifcLoader.ifcManager.setWasmPath(path);
    }

    getIfcFile(url) {
        return new Promise((resolve, reject) => {
            var oReq = new XMLHttpRequest();
            oReq.responseType = "arraybuffer";
            oReq.addEventListener("load", () => {
                resolve(new Uint8Array(oReq.response));
            });
            oReq.open("GET", url);
            oReq.send();
        });
    }

    getIfcModels() {
        return this.ifcModels;
    }

    async loadIFC(path, callback) {
        this.ifcLoader.load(path, (ifcModel) => {
          this.ifcModels.push(ifcModel);
          if (callback) callback(ifcModel);
        });
    }



    async getLevels() {
        levels = await this.ifcapi.GetLineIDsWithType(modelID, IFCBUILDINGSTOREY);
        for (let i = 0; i < levels.size(); i++) {
          const lvl = this.ifcapi.GetLine(modelID, levels.get(i));
          if (lvl.Name.value === "Nivel 2") {
            lvl.LongName.value = "Level 2";
            this.ifcapi.WriteLine(modelID, lvl);
            createDownloadLink(lvl);
          }
        }
      }

    async OpenIfc(ifcAsText) {
        await this.ifcapi.Init();
        return this.ifcapi.OpenModel(ifcAsText);
    }
    
    getAllItems(modelID, excludeGeometry = false) {
        const allItems = {};
        const lines = this.ifcapi.GetAllLines(modelID);
        this.getAllItemsFromLines(modelID, lines, allItems, excludeGeometry);
        return allItems;
    }
    
    getAllItemsFromLines(modelID, lines, allItems, excludeGeometry) {
        for (let i = 1; i <= lines.size(); i++) {
            try {
                this.saveProperties(modelID, lines, allItems, excludeGeometry, i);
            } catch (e) {
                console.log(e);
            }
        }
    }
    
    saveProperties(modelID, lines, allItems, excludeGeometry, index) {
        const itemID = lines.get(index);
        const props = this.ifcapi.GetLine(modelID, itemID);
        props.type = props.__proto__.constructor.name;
        if (!excludeGeometry || !geometryTypes.has(props.type)) {
            allItems[itemID] = props;
        }
    }
    
    getPropertyWithExpressId(modelID=0) {
        this.prop.innerHTML = "";
        table.innerHTML = "";
    
        const elementID = parseInt(document.getElementById("expressIDLabel").value);
    
        // If third parameter is added as true, we get a flatten result
        const element = ifcapi.GetLine(modelID, elementID);
    
        // Now you can fetch GUID of that Element
        const guid      = element.GlobalId.value;
        createRowInTable("GUID", guid);
    
        const name      = element.Name.value;
        createRowInTable("Name", name);
    
        const ifcType   = element.__proto__.constructor.name;
        createRowInTable("IfcType", ifcType);
    
        const type      = element.ObjectType.value;
        createRowInTable("Object Type", type);
    
        const tag       = element.Tag.value;
        createRowInTable("Tag", tag);
        
        // grab all propertyset lines in the file
        let lines = this.ifcapi.GetLineIDsWithType(modelID, IFCRELDEFINESBYPROPERTIES);
    
        // In the below array we will store the IDs of the Property Sets found
        let propSetIds = [];
        for (let i = 0; i < lines.size(); i++) {
            // Getting the ElementID from Lines
            let relatedID = lines.get(i);
            
            // Getting Element Data using the relatedID
            let relDefProps = this.ifcapi.GetLine(modelID, relatedID);
            
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
        let propsets = propSetIds.map(id => this.ifcapi.GetLine(modelID, id, true));
    
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
    
    
    createRowInTable(label, value){
        this.row.innerHTML = "<td>"+label+"</td><td>"+value+"</td>";
    
        this.table.appendChild(row);
    }
}

export { Load }
  






