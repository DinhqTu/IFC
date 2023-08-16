//picking
import {
    acceleratedRaycast,
    computeBoundsTree,
    disposeBoundsTree,
} from "three-mesh-bvh";
import {
  Raycaster,
  Vector2,
  PerspectiveCamera,
  MeshLambertMaterial
} from "three";
  
import { IfcAPI } from "web-ifc/web-ifc-api";
import { IFCLoader } from "web-ifc-three/IFCLoader";

// const preselectMat = new MeshLambertMaterial({
//   transparent: true,
//   opacity: 0.6,
//   color: 0xff88ff,
//   depthTest: false,
// });
// const selectMat = new MeshLambertMaterial({
//   transparent: true,
//   opacity: 0.6,
//   color: 0xff00ff,
//   depthTest: false,
// });

class Button {
  constructor(ifcLoader, ifcapi, canvas, aspect, scene, ifcModels) {
    // this.ifcLoader = new IFCLoader();
    // this.ifcapi = new IfcAPI();
    this.ifcLoader = ifcLoader;
    this.ifcapi = ifcapi;
    this.iLoadMan = this.ifcLoader.ifcManager;
    this.threeCanvas = canvas;
    this.aspect = aspect;
    this.ifcModels = ifcModels;
    this.scene = scene;

    this.preselectModel = { id: -1 };
    this.selectModel = { id: -1 };
    this.highlightModel = { id: -1};

    this.iLoadMan.setupThreeMeshBVH(
      computeBoundsTree,
      disposeBoundsTree,
      acceleratedRaycast
    );

    this.raycaster = new Raycaster();
    this.raycaster.firstHitOnly = true;
    this.mouse = new Vector2();
    this.camera = new PerspectiveCamera(75, this.aspect);
    this.pick = this.pick.bind(this);
    this.highlight = this.highlight.bind(this);
  }

  cast(event) {
    // Computes the position of the mouse on the screen
    // console.log(this.threeCanvas, this.mouse, this.raycaster);
    const bounds = this.threeCanvas.getBoundingClientRect();

    const x1 = event.clientX - bounds.left;
    const x2 = bounds.right - bounds.left;
    this.mouse.x = (x1 / x2) * 2 - 1;
  
    const y1 = event.clientY - bounds.top;
    const y2 = bounds.bottom - bounds.top;
    this.mouse.y = -(y1 / y2) * 2 + 1;
  
    // Places it on the camera pointing to the mouse
    this.raycaster.setFromCamera(this.mouse, this.camera);
    // console.log(this.raycaster.intersectObjects(this.ifcModels));
    // Casts a ray
    return this.raycaster.intersectObjects(this.ifcModels);
  }

  async pick(event, onPick) {
    console.log(this);
    const found = this.cast(event)[0];
    // console.log(found);
    if (found) {
      const index = found.faceIndex;
      const geometry = found.object.geometry;
      const id = this.iLoadMan.getExpressId(geometry, index);
      const modelID = found.object.modelID;
      // console.log("IFC Type:", this.iLoadMan.getIfcType(id, modelID));
      console.log(`id: ${id}, model: ${modelID}`);
      const props = await this.ifcLoader.ifcManager.getItemProperties(modelID, id);
      // console.log(props);
      // output.innerHTML = JSON.stringify(props, null, 2);
      if (onPick) onPick(id);
    }
  }

  highlight(event, material, key) {
    const found = this.cast(event)[0];
    if (found) {
      // Gets model ID
      if (key === 'selectModel') {

        this.selectModel.id = found.object.modelID;
        // console.log(found);
        // console.log(`selected: ${this.selectModel.id}, highlight: ${this.highlightModel.id}`);
      } else {
        this.highlightModel.id = found.object.modelID;
      }

      const index = found.faceIndex;
      const geometry = found.object.geometry;
      const id = this.ifcLoader.ifcManager.getExpressId(geometry, index);
       
      // Creates subset
      this.ifcLoader.ifcManager.createSubset({
        modelID: found.object.modelID,
        ids: [id],
        material: material,
        scene: this.scene,
        removePrevious: true,
      });
    } else {
      // Removes previous highlight
      this.ifcLoader.ifcManager.removeSubset(this.highlightModel.id, material);
    }
  }

  async releaseMemory() {
    // This releases all IFCLoader memory
    await ifcLoader.ifcManager.dispose();
    ifcLoader = null;
    ifcLoader = new IFCLoader();
  
    // If the wasm path was set before, we need to reset it
    await ifcLoader.ifcManager.setWasmPath("../wasm/");
  
    // If IFC models are an array or object,
    // you must release them there as well
    // Otherwise, they won't be garbage collected
    ifcModels.length = 0;
    table.innerHTML = "";
  }
}

export { Button }
