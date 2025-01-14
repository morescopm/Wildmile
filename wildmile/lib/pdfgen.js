//Instructions Generator
const Plant = require("../models/Plant.js");
import IndividualPlant from "../models/IndividualPlant.js";
// const PlantObservation = require("../models/PlantObservation.js");
// const Mod = require("../models/Module.js");
import Module from "../models/Module.js";
const mongoose = require("mongoose");
// const { jsPDF } = require("jspdf"); // will automatically load the node version
import { jsPDF } from "jspdf";

const doc = new jsPDF();

global.doc = doc;

// exports.getPdf = (req, res) => {
//   Plant.find((err, plant) => {
//     Mod.find((err, docs) => {
//       IndividualPlant.find(async (err, individualPlant) => {
//         getPdf(),
//           res.render("pdf", {
//             mods: docs,
//             plants: plant,
//             plantedPlants: individualPlant,
//           });
//       });
//     });
//   });
// };

// tg = ["a"];

async function getPlantsArray() {
  // 1console.log('P')
  const plantsArray = await Module.find({
    x: 200,
    y: 1,
  })
    .distinct("_id")
    .then(async (usedMods, err) => {
      // 1console.log('usedMods: ', usedMods);
      if (err) {
        return err;
      }
      let tagMods = new Array();
      // 1console.log(tagMods);
      let search = "_id";
      for (let i = 0; i < usedMods.length; i++) {
        if (usedMods[i]) {
          let search = "module";
          tagMods.push(mongoose.Types.ObjectId(usedMods[i]));
        } else {
          tagMods = {};
        }
      }
      // 1console.log('tagmods', tagMods);
      return await IndividualPlant.aggregate([
        {
          $match: {
            module: {
              $in: tagMods,
            },
          },
        },

        {
          $lookup: {
            from: "plants",
            localField: "_id",
            foreignField: "_id",
            as: "plants",
          },
        },
        { $sort: { count: -1 } },
        // { "$unwind": { "path" : "$_id" } },
      ]).then((err, data) => {
        if (err) {
          return err;
        }
        m = JSON.stringify(data);
        const result = m;
        // 1console.log('result: ', result[0].plants);
        return result[0].plants;
      });
    });
  return plantsArray;
}

async function modInfo(tag) {
  const mInfo = await Module.find({ tags: tag }).then(async (module, err) => {
    if (err) {
      return null;
    }
    return module;
  });
  return mInfo;
}

async function allModInfo() {
  const mInfo = await Module.find().then(async (module, err) => {
    if (err) {
      return null;
    }
    return module;
  });
  return mInfo;
}
async function getP(x, y) {
  // 1console.log('P')
  const pnum = await Module.find({
    x: x,
    y: y,
  })
    .distinct("_id")
    .then(async (usedMods, err) => {
      // 1console.log('usedMods: ', usedMods);
      if (err) {
        return err;
      }
      let tagMods = new Array();
      // 1console.log(tagMods);
      let search = "_id";
      for (let i = 0; i < usedMods.length; i++) {
        if (usedMods[i]) {
          let search = "module";
          tagMods.push(new mongoose.Types.ObjectId(usedMods[i]));
        } else {
          tagMods = {};
        }
      }
      // 1console.log('tagmods', tagMods);
      return await IndividualPlant.aggregate([
        {
          $match: {
            module: {
              $in: tagMods,
            },
          },
        },
        // {$merge:{into: "coordinate", on:["x","y"]}},
        {
          $group: {
            _id: "$plant",
            count: {
              $sum: 1,
            },
            // y:{$addToSet: "$y"},
            // x:{$addToSet: "$x"},
            xy: { $push: { y: "$y", x: "$x" } },
          },
        },
        {
          $lookup: {
            from: "plants",
            localField: "_id",
            foreignField: "_id",
            as: "plants",
          },
        },
        {
          $project: {
            _id: 1,
            count: 1,
            plantName: "$plants.scientific_name",
            commonName: "$plants.common_name",
            plantId: "$plants._id",
            notes: "$module.notes",
            //x:  {$concatArrays: [ "$x"]},
            xy: "$xy",
          },
        },
        { $sort: { plantName: 1 } },
        // { "$unwind": { "path" : "$_id" } },
      ]).then((err, data) => {
        if (err) {
          return err;
        }
        m = JSON.stringify(data);
        const result = m;
        // 1console.log('result: ', result.x);
        return result;
      });
    });
  return pnum;
}

function eliminateBrackets(brackets, orientation, flipped) {
  if (orientation === "RH" && flipped === false) {
    brackets.tr = false;
    brackets.rt = false;
    brackets.rb = false;
  } else if (orientation === "LH" && flipped === false) {
    brackets.tl = false;
    brackets.lt = false;
    brackets.lb = false;
  } else if (orientation === "RH" && flipped === true) {
    brackets.bl = false;
    brackets.lt = false;
    brackets.lb = false;
  } else if (orientation === "LH" && flipped === true) {
    brackets.rt = false;
    brackets.rb = false;
    brackets.br = false;
  }
}

async function bracketFinder(x, y, orientation, flipped) {
  const allMods = await allModInfo();
  let brackets = {
    lt: false,
    tl: false,
    tr: false,
    rt: false,
    rb: false,
    br: false,
    bl: false,
    lb: false,
  };
  let bracketCount = 0;
  console.log("bracket finder: ", orientation, flipped, x, y);
  const modsToCheck = { left: x + 1, right: x - 1, top: y + 1, bottom: y - 1 };
  for (var i = 0; i < allMods.length; i++) {
    let cmod = allMods[i];
    if (cmod.x == modsToCheck.left && cmod.y == y) {
      if (cmod.shape == "R3" || cmod.shape == "R2.3") {
        (brackets.lt = true), (brackets.lb = true);
      } else if (cmod.shape == "T3" || cmod.shape == "T2.3") {
        // No connection at regular RH
        if (
          (cmod.orientation == "RH" && cmod.flipped == true) ||
          (cmod.orientation == "LH" && cmod.flipped == false)
        ) {
          (brackets.lt = true), (brackets.lb = true);
        }
      }
    }

    if (cmod.x == modsToCheck.right && cmod.y == y) {
      if (cmod.shape == "R3" || cmod.shape == "R2.3") {
        (brackets.rt = true), (brackets.rb = true);
      } else if (cmod.shape == "T3" || cmod.shape == "T2.3") {
        // No connection at regular RH
        if (
          (cmod.orientation == "RH" && cmod.flipped == false) ||
          (cmod.orientation == "LH" && cmod.flipped == true)
        ) {
          (brackets.lt = true), (brackets.rb = true);
        }
      }
    }

    if (cmod.x == x && cmod.y == modsToCheck.top) {
      if (cmod.shape == "R3" || cmod.shape == "R2.3") {
        (brackets.tl = true), (brackets.tr = true);
      } else if (cmod.shape == "T3" || cmod.shape == "T2.3") {
        // No connection at regular RH
        if (
          (cmod.orientation == "RH" && cmod.flipped == false) ||
          (cmod.orientation == "LH" && cmod.flipped == false)
        ) {
          (brackets.tl = true), (brackets.tl = true);
        } else if (cmod.orientation == "RH" && cmod.flipped == true) {
          brackets.tr = true;
        } else if (cmod.orientation == "LH" && cmod.flipped == true) {
          brackets.tl = true;
        }
      }
    }
    if (cmod.x == x && cmod.y == modsToCheck.bottom) {
      if (cmod.shape == "R3" || cmod.shape == "R2.3") {
        (brackets.bl = true), (brackets.br = true);
      } else if (cmod.shape == "T3" || cmod.shape == "T2.3") {
        // No connection at regular RH
        if (
          (cmod.orientation == "RH" && cmod.flipped == true) ||
          (cmod.orientation == "LH" && cmod.flipped == true)
        ) {
          (brackets.bl = true), (brackets.bl = true);
        } else if (cmod.orientation == "RH" && cmod.flipped == false) {
          brackets.bl = true;
        } else if (cmod.orientation == "LH" && cmod.flipped == false) {
          brackets.br = true;
        }
      }
    }
  }
  eliminateBrackets(brackets, orientation, flipped);

  return brackets;
}

async function generateBrackets(moduleBrackets) {
  // lt:false,tl:false,tr:false,rt:false,rb:false,br:false,bl:false,lb:false
  //  triangle(x1, y1, x2, y2, x3, y3, styleopt)
  doc.setLineWidth(2);
  let x1 = 24;
  let y1 = 100;
  let x2 = x1 + 156;
  let y2 = y1 + 52;
  let bSize = 8;
  const thisModulesBrackets = moduleBrackets;
  // line(x1, y1, x2, y2, style)
  if (thisModulesBrackets.lt == true) {
    // doc.triangle(x1, y1, x1, y1 + 6, x1-6, y1 +3)
    doc.line(x1, y1, x1 - bSize, y1);
  }
  if (thisModulesBrackets.tl == true) {
    doc.line(x1, y1, x1, y1 - bSize);
  }
  if (thisModulesBrackets.tr == true) {
    doc.line(x2, y1, x2, y1 - bSize);
  }
  if (thisModulesBrackets.rt == true) {
    doc.line(x2, y1, x2 + bSize, y1);
  }
  if (thisModulesBrackets.rb == true) {
    doc.line(x2, y2, x2 + bSize, y2);
  }
  if (thisModulesBrackets.br == true) {
    doc.line(x2, y2, x2, y2 + bSize);
  }
  if (thisModulesBrackets.bl == true) {
    doc.line(x1, y2, x1, y2 + bSize);
  }
  if (thisModulesBrackets.lb == true) {
    doc.line(x1, y2, x1 - bSize, y2);
  }
  doc.setLineWidth(0);
}

async function drawModShape(shape, orientation, flipped) {
  let x1 = 24;
  let y1 = 100;
  let x2 = x1 + 156;
  let y2 = y1 + 52;
  let osx = 156; // offset X
  let osy = 52; // offset Y
  //Module
  if (shape == "R3" || shape == "R2.3") {
    doc.rect(x1, y1, osx, osy);
  }
  if (shape == "T3" || shape == "T2.3") {
    if (orientation === "LH") {
      if (flipped === true) {
        doc.triangle(x1, y1, x1, y2, x1, y1);
      } else {
        doc.triangle(x1, y2, x2, y2, x2, y1);
      }
    }
    if (orientation === "RH") {
      if (flipped === true) {
        doc.triangle(x1, y1, x2, y1, x2, y2);
      } else {
        doc.triangle(x1, y1, x1, y2, x2, y2);
      }
    }
  }
}
function returnAllModsInGroup(allMods, group, subGroup, subGroups) {
  allGroupMods = [];
  let groupInfo = "";
  for (var i = 0; i < allMods.length; i++) {
    //groupInfo = returnGroup(tags, group,subGroup);
    if (allMods[i].tags.includes(group)) {
      groupInfo = returnGroup(allMods[i].tags, [group], subGroups);
      modGroupInfo = {
        model: allMods[i].model,
        orientation: allMods[i].orientation,
        flipped: allMods[i].flipped,
        shape: allMods[i].shape,
        x: allMods[i].x,
        y: allMods[i].y,
        groupInfo: groupInfo,
      };
      allGroupMods.push(modGroupInfo);

      // if (allMods[i].tags.includes(subGroup)) {
      //   coordinates = [allMods[i].x, allMods[i].y];
      //   console.log('coordinates',coordinates);
      //   subGroups.push(coordinates);
      // }
      // }

      // console.log('includes', allMods[i].x);
    }
    // console.log(allGroupMods);
  }
  console.log("All group mods", allGroupMods.length);
  return allGroupMods;
}

function returnGroup(tags, groups = "none", subGroups = "none") {
  let group = "Z";
  let sub = "Z";
  for (var i = 0; i < groups.length; i++) {
    if (tags.includes(groups[i])) {
      group = groups[i];
      for (var g = 0; g < subGroups.length; g++) {
        if (tags.includes(subGroups[g])) {
          sub = subGroups[g];
          console.log("subs", subGroups[g]);
        }
      }
    }
  }

  let groupMatrix = { group: group, subgroup: sub };
  console.log(groupMatrix);

  return groupMatrix;
}
function difference(a, b) {
  return Math.abs(b - a);
}

function moduleCoordinates(
  shape,
  orientation,
  flipped,
  width,
  height,
  homeX,
  homeY,
  options = "S"
) {
  console.log(
    "moduleCoordinates",
    shape,
    orientation,
    flipped,
    width,
    height,
    homeX,
    homeY
  );
  if (["T3", "T2.3"].includes(shape)) {
    const xTl = homeX;
    const yTl = homeY;
    const xTr = homeX + width;
    const yTr = homeY;
    const xBl = homeX;
    const yBl = homeY + height;
    const xBr = homeX + width;
    const yBr = homeY + height;
    let coordinates;
    // doc.setLineWidth();

    if (orientation === "LH") {
      if (flipped === true) {
        console.log("flippped", xTl, yTl, xTr, yTr, xBr, yBr);
        doc.triangle(xTl, yTl, xTr, yTr, xBr, yBr, options);
      } else {
        doc.triangle(xTl, yTl, xBl, yBl, xBr, yBr, options);
      }
    } else if (orientation === "RH") {
      if (flipped === true) {
        doc.triangle(xTr, yTr, xBl, yBl, xTl, yTl, options);
      } else {
        doc.triangle(xTr, yTr, xBr, yBr, xBl, yBl, options);
      }
    }
  }
  if (orientation === "flat") {
    console.log("oeuttuhoeh", homeX, homeY, width, height);
    doc.rect(homeX, homeY, width, height, (style = options));
  }
}

function groupRender(thisMod, AllModsInGroup, mod) {
  thisSubGroup = [];
  thisGroup = [];
  let largestSubX = -1;
  let largestSubY = -1;
  let largestX = -1;
  let largestY = -1;
  for (var i = 0; i < AllModsInGroup.length; i++) {
    if (thisMod.group === AllModsInGroup[i].groupInfo.group) {
      thisGroup.push(AllModsInGroup[i]);
      if (AllModsInGroup[i].x > largestX) {
        largestX = AllModsInGroup[i].x;
      }
      if (AllModsInGroup[i].y > largestY) {
        console.log("true");
        largestY = AllModsInGroup[i].y;
      }
      // get mod subgroup
      if (thisMod.subgroup === AllModsInGroup[i].groupInfo.subgroup) {
        thisSubGroup.push(AllModsInGroup[i]);
        if (AllModsInGroup[i].x > largestSubX) {
          largestSubX = AllModsInGroup[i].x;
        }
        if (AllModsInGroup[i].y > largestSubY) {
          console.log("true");
          largestSubY = AllModsInGroup[i].y;
        }
      }
      // console.log();
    }
  }
  console.log("thisSub", thisSubGroup, largestSubY);
  // starting position of selection
  startX = 18;
  startY = 178;
  rectSizeX = 30;
  rectSizeY = 10;

  let subgroup;
  for (var i = 0; i < thisSubGroup.length; i++) {
    x = thisSubGroup[i].x;
    y = thisSubGroup[i].y;
    xMultiple = difference(x, largestSubX);
    yMultiple = difference(y, largestSubY);
    xMultiple = largestSubY - y;
    console.log("yMult", yMultiple, difference(y, largestSubY));
    modStartX = xMultiple * rectSizeX + startX;
    modStartY = yMultiple * rectSizeY + startY;
    console.log("modStartX", x, modStartY);

    if (mod.x == x && mod.y == y) {
      fill = "FD";
      doc.setFillColor("#D3D3D3");
    } else {
      fill = "S";
      doc.setFillColor("#ffffff");
    }
    console.log(
      "allinfo",
      thisSubGroup[i].shape,
      thisSubGroup[i].orientation,
      thisSubGroup[i].flipped,
      rectSizeX,
      rectSizeY,
      modStartX,
      modStartY,
      fill
    );
    moduleCoordinates(
      thisSubGroup[i].shape,
      thisSubGroup[i].orientation,
      thisSubGroup[i].flipped,
      rectSizeX,
      rectSizeY,
      modStartX,
      modStartY,
      fill
    );
    doc.text(
      `${x},${y}`,
      modStartX + rectSizeX / 2,
      modStartY + rectSizeY / 2,
      { align: "center", baseline: "middle" }
    );
  }
  for (var n = 0; n < thisGroup.length; n++) {
    thisGroup[n];
    startX = 28;
    startY = 232;
    rectSizeX = 12;
    rectSizeY = 4;
    x = thisGroup[n].x;
    y = thisGroup[n].y;
    xGroupMultiple = difference(x, largestX);
    yGroupMultiple = difference(y, largestY);
    console.log("yMult", yMultiple, difference(y, largestSubY));
    modStartX = xGroupMultiple * rectSizeX + startX;
    modStartY = yGroupMultiple * rectSizeY + startY;
    console.log("modStartX", x, y);
    if (thisSubGroup[0].groupInfo.subgroup == thisGroup[n].groupInfo.subgroup) {
      fill = "FD";
      doc.setFillColor("#b9b9b9");
    } else {
      fill = "S";
      doc.setFillColor("#ffffff");
    }
    doc.setFontSize(6);
    moduleCoordinates(
      thisGroup[n].shape,
      thisGroup[n].orientation,
      thisGroup[n].flipped,
      rectSizeX,
      rectSizeY,
      modStartX,
      modStartY,
      fill
    );
    doc.text(
      `${x},${y}`,
      modStartX + rectSizeX / 2,
      modStartY + rectSizeY / 2,
      { align: "center", baseline: "middle" }
    );
  }
  // doc.text(`Group: ${thisSubGroup[0].groupInfo.group}`,modStartX, 228,{align: 'center'});
}

function generateGroups(mod, allMods) {
  // groups = ['A','B','C','D','E','F','G','H','I','J','K','M','N','O','P'];
  groups = ["M", "N", "O", "P"];
  subGroups = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"];
  thisModGroup = returnGroup(mod.tags, groups, subGroups);
  console.log("thismod", thisModGroup);
  AllModsInGroup = returnAllModsInGroup(
    allMods,
    thisModGroup.group,
    thisModGroup.subgroup,
    subGroups
  );
  //returnAllGroups(allMods, groups,subGroups)
  groupText = `Group: ${thisModGroup.group}${thisModGroup.subgroup}`;
  groupNum = `Group: ${thisModGroup.group}`;
  doc.setFontSize(22);
  doc.text(groupText, 18, 176); //{baseline:'top', maxWidth: 64}
  doc.text(groupNum, 18, 226);
  groupRender(thisModGroup, AllModsInGroup, mod);
}
function generateShapeInfo(shape, orientation, model) {
  console.log(shape, orientation, model);
  let color;
  if (model === "5-d") {
    if (shape === "R3") {
      color = "Brown";
    }
    if (shape === "T3") {
      if (orientation === "RH") {
        color = "Yellow";
      } else {
        color = "Purple";
      }
    }
  }
  if (model === "3-d") {
    if (shape === "R2.3") {
      color = "Lime Green";
    } else if (shape === "R3") {
      color = "Green";
    } else if (shape === "T3") {
      if (orientation === "RH") {
        color = "Blue";
      } else {
        color = "Pink";
      }
    }
    if (shape === "T2.3") {
      if (orientation === "RH") {
        color = "Yellow";
      } else {
        color = "Orange";
      }
    }
  }
  return color;
}

async function gettingModule(tag) {
  const allMods = await allModInfo();
  const minfo = await modInfo(tag);
  for (var i = 0; i < minfo.length; i++) {
    const plantTable = await gettingPlants(minfo[i].x, minfo[i].y);
    console.log(typeof plantTable);
    await generatePlants(minfo[i].x, minfo[i].y);
    const moduleBrackets = await bracketFinder(
      minfo[i].x,
      minfo[i].y,
      minfo[i].orientation,
      minfo[i].flipped
    );
    await generateBrackets(moduleBrackets);
    // generateGroups(minfo[i], allMods);
    doc.setTextColor("#ffffff");
    // xy rectangle
    doc.setFillColor("#000000");
    // doc.rect(10, 10, 24, 50, (style = "F"));
    doc.rect(10, 10, 24, 50);
    doc.rect(10, 10, 65, 50);
    doc.setFontSize(60);
    doc.text("X\nY", 15, 30);
    // Mod number
    doc.setTextColor("#000000");
    doc.text(minfo[i].x + "\n" + minfo[i].y, 35, 30);
    let shapeColor = generateShapeInfo(
      minfo[i].shape,
      minfo[i].orientation,
      minfo[i].model
    );
    console.log("tuehoutnoehtnuoeht", shapeColor);

    //table
    doc.table(84, 10, plantTable, headers, {
      autoSize: true,
    });
    // Mod model info
    doc.setFontSize(22);
    let modModel = `${minfo[i].shape} ${minfo[i].model} ${minfo[i].orientation} (${shapeColor})`;
    doc.text(modModel, 15, 70);
    // draw module Shape
    await drawModShape(minfo[i].shape, minfo[i].orientation, minfo[i].flipped);
    //Home Corners
    let x1 = 24;
    let y1 = 100;
    let x2 = x1 + 156;
    let y2 = y1 + 52;
    let osx = 156; // offset X
    let osy = 52; // offset Y
    doc.setFontSize(9);
    doc.text(" 00Blue>\nHome \nCorner ", 18, 150, { align: "right" });
    doc.text("< Yellow\n Home\n Corner", 190, 100, { align: "left" });

    //text box
    doc.setLineWidth(0);
    doc.setFontSize(22);
    doc.text("Notes", 118, 174, { baseline: "bottom" });
    doc.rect(118, 174, 65, 40);
    doc.setLineWidth(2);
    doc.setFontSize(14);
    let notes = `${minfo[i].notes}                                                ${minfo[i].tags} \n Flipped= ${minfo[i].flipped} `;
    doc.text(notes, 120, 176, { baseline: "top", maxWidth: 64 });

    // 1// 1console.log('minfo',minfo);
    //adds new page to document
    doc.addPage();
  }
  return;
}
async function gettingPlants(x, y) {
  let thePlants = [];
  const ppp = await getP(x, y);
  console.log(ppp);
  //   let plantLength = ppp.length;
  for (var i = 0; i < ppp.length; i++) {
    let id = i + 1;
    let x = {
      id: id.toString(),
      scientific_name: ppp[i].plantName[0],
      num: ppp[i].count.toString(),
      notes: " ",
    };
    // "common_name":ppp[i].commonName[0]}
    thePlants.push(x);
  }
  console.log("theplants", thePlants);
  return thePlants;
}
var generateData = async function () {
  var result = [];
  var data = {
    num: "300",
    scientific_name: "GameGroup",
    common_name: "XPTO2",
  };
  for (var i = 0; i < 3; i += 1) {
    data.id = (i + 1).toString();
    result.push(Object.assign({}, data));
  }
  return result;
};
function createHeaders(keys) {
  var result = [];
  for (var i = 0; i < keys.length; i += 1) {
    result.push({
      id: keys[i],
      name: keys[i],
      prompt: keys[i],
      width: 65,
      align: "center",
      padding: 0,
    });
  }
  return result;
}

var headers = createHeaders([
  "id",
  "scientific_name",
  "num",
  "notes",
  // "common_name",
]);

async function generatePlants(x, y) {
  const gp = await getP(x, y);
  for (var i = 0; i < gp.length; i++) {
    // gp[i];
    for (var j = 0; j < gp[i].xy.length; j++) {
      // 1// 1console.log(gp[i].xy[j]);
      let plantPlacement = gp[i].xy[j];
      let leftMargin = 24 + 5;
      let topMargin = 100 + 3;
      let radius = 5;
      let x = leftMargin + radius + plantPlacement.x * 15;
      let y = topMargin + radius + plantPlacement.y * 12;
      doc.setFont("Helvetica", "Bold");
      doc.setFontSize(20);
      let id = i + 1;
      doc.setTextColor("#ffffff");
      doc.setFillColor("#333333");
      doc.circle(x, y, 5);
      doc.text(id.toString(), x, y, { align: "center", baseline: "middle" });
    }
  }
  doc.setFillColor("#000000");
  doc.setTextColor("#000000");
  return;
}
export async function getPdf() {
  const pgen = await gettingModule("new2");

  doc.text("Hello world!", 10, 10);

  //   console.log("pgen", doc);
  //   await doc.save("/pdfs/a5.pdf"); // will save the file
  const savedFile = doc.save("../pdfs/mypdf.pdf");
  console.log("saved", savedFile);
  return;
}

// export default async function GeneratePdf(tag) {
//   console.log("generating pdf");
//   await gettingModule("new2");
//   await doc.save("a5.pdf");
// }

export default async function GeneratePDF(tag) {
  const handlePDF = async () => {
    console.log("handlepdf");
    const doc = new jsPDF("p", "pt", "a4", false);
    doc.text("Hello world!", 10, 10);

    // do whatever you want in your pdf and finally save your pdf
    const savedFile = doc.save("/pdfs/mypdf.pdf");
    return savedFile;
  };
  const file = await handlePDF();
  return file;
  //   <button onClick={handlePDF}>Generate PDF</button>;
}
async function test() {
  // 1console.log(await generateData);
  const doc = new jsPDF();
  doc.text("Hello world!", 10, 10);
  doc.save("a1.pdf");
}
// test();
// 1console.log( doc.getFontList());
