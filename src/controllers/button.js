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

let preselectModel = { id: -1 };
let selectModel = { id: -1 };

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

class Button {
  constructor(canvas, aspect, scene, ifcModels) {
    this.ifcLoader = new IFCLoader();
    this.ifcapi = new IfcAPI();
    this.iLoadMan = this.ifcLoader.ifcManager;
    this.threeCanvas = canvas;
    this.aspect = aspect;
    this.ifcModels = ifcModels;
    this.scene = scene;

    // this.preselectMat = preselectMat;
    // this.selectMat = selectMat;
    // this.preselectModel = preselectModel;
    // this.selectModel = selectModel;

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
    const bounds = this.threeCanvas.getBoundingClientRect();
  
    const x1 = event.clientX - bounds.left;
    const x2 = bounds.right - bounds.left;
    this.mouse.x = (x1 / x2) * 2 - 1;
  
    const y1 = event.clientY - bounds.top;
    const y2 = bounds.bottom - bounds.top;
    this.mouse.y = -(y1 / y2) * 2 + 1;
  
    // Places it on the camera pointing to the mouse
    this.raycaster.setFromCamera(this.mouse, this.camera);
  
    // Casts a ray
    return this.raycaster.intersectObjects(this.ifcModels);
  }

  async pick(event) {
    // console.log(event, this);
    const found = this.cast(event)[0];
    if (found) {
      const index = found.faceIndex;
      const geometry = found.object.geometry;
      const id = this.iLoadMan.getExpressId(geometry, index);
      const modelID = found.object.modelID;
      console.log(id, modelID);
      // const props = await this.iLoadMan.getItemProperties(modelID, id);
      // output.innerHTML = id;
      // console.log(JSON.stringify(props, null, 2));
    }
  }

  highlight(event, material, scene, model) {
    // console.log(event, material, scene, model);
    const found = this.cast(event)[0];
    if (found) {
      // Gets model ID
      model.id = found.object.modelID;
  
      // Gets Express ID
      const index = found.faceIndex;
      const geometry = found.object.geometry;
      const id = this.iLoadMan.getExpressId(geometry, index);
      // console.log(model.id, id, material, scene);

      // Creates subset
      // this.iLoadMan.createSubset({
      //   modelID: model.id,
      //   ids: [id],
      //   material: material,
      //   scene: scene,
      //   removePrevious: true,
      // });
    } else {
      // Removes previous highlight
      // this.iLoadMan.removeSubset(model.id, material);
    }
  }
}

export { Button }
