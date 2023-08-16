

class Display {
    constructor() {

    }

    async logAllSameType(typeID) {
        const slabsID = await ifcLoader.ifcManager.getAllItemsOfType(0, typeID);
      
        for (let i = 0; i <= slabsID.length; i++) {
          const slabID = slabsID[i];
          const slabProperties = await ifcLoader.ifcManager.getItemProperties(0, slabID);
          console.log(slabProperties);
        }
      }
}