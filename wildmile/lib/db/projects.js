"use server";
import Project from "models/Project";
import Section from "/models/Section";
import Module from "/models/Module";

// PROJECTS
export async function createProject(req, res) {
  try {
    const { name, description, notes, decommisioned } = req;
    const project = await Project.create({
      name,
      description,
      notes,
      decommisioned: false,
    });
    result = await { success: true, data: project };
    return result;
  } catch (error) {
    console.error("Error creating section:", error);
    throw error;
  }
}

// SECTIONS

export async function createSection(req) {
  const { name, description, dateInstalled, notes, size, project_name } = req;
  try {
    const project = await Project.findOne({ name: req.project_name });
    if (!project) throw new Error("Project not found");

    const section = await Section.create({
      name,
      description,
      dateInstalled,
      notes,
      size,
      projectId: project._id,
    });
    console.log("createSection Section:", section);
    result = await { success: true, data: section };
    return result;
  } catch (error) {
    console.error("Error creating section:", error);
    throw error;
  }
}

// MODULES
export async function createModule(req) {
  if (!req.body) {
    throw new Error(
      "Request body is missing or does not contain an items property"
    );
  }
  const { name, description, dateInstalled, notes, size, projectId } = req.body;
  try {
    const module = await Module.create({
      name,
      description,
      dateInstalled,
      notes,
      size,
      projectId,
    });
    console.log("createModule Module:", module);
    return module;
  } catch (error) {
    console.error("Error creating module:", error);
    throw error;
  }
}

export async function getModulesToDraw(section_name) {
  if (section_name === "new") {
    return { props: { modules: [] } };
  }

  const section = await Section.findOne({ name: section_name });
  const result = await Module.find({ sectionId: section._id }).lean();

  const modules = JSON.stringify(result);
  return modules;
}

export async function updateOrInsertModules(params, locations) {
  console.log("updateOrInsertModules params:", params, "locations:", locations);
  try {
    const addedModules = [];
    // Find Project by projectName
    const project = await Project.findOne({ name: params.project_name });
    if (!project) throw new Error("Project not found");

    // Find Section by sectionName
    const section = await Section.findOne({ name: params.section_name });
    if (!section) throw new Error("Section not found");

    console.log("Project:", project, "Section:", section);
    // Iterate over locations and update/insert Modules
    for (const location of locations) {
      const { x, y } = location; // Assuming each location has x and y properties

      // Check if a Module exists with the given criteria
      const existingModule = await Module.findOne({
        x: x,
        y: y,
        project: project._id,
        section: section._id,
      });

      const updateData = {
        // Assuming these are the fields you want to update/insert
        model: params.model,
        flipped: params.flipped,
        island_name: params.island_name,
        locationCode: params.locationCode,
        notes: params.notes,
        orientation: params.orientation,
        projectId: project._id,
        sectionId: section._id,
        shape: params.shape,
        tag: params.tag,
        tags: params.tags,
      };

      if (existingModule) {
        // Update the existing Module
        await Module.updateOne(
          { _id: existingModule._id },
          { $set: updateData }
        );
      } else {
        // Insert a new Module
        const newModule = new Module({
          ...updateData,
          x: x,
          y: y, // Assuming Module schema has a location field with x and y
        });
        const newMod = await newModule.save();
        addedModules.push(newMod);
        console.log("New Module:", newModule);
      }
    }
    const result = await { success: true, data: addedModules };
    return result;
  } catch (error) {
    console.error("Error updating or inserting modules:", error);
    throw error; // Rethrow or handle as needed
  }
}

//   Project.findOne({ name: req.body.projectName }).select("_id").exec((err, project) => {
//     if (err) {
//       console.log("Error finding project:", err);
//     }
// Section.find

// req.body.forEach(async (module) => {
//   const { _id, name, description, dateInstalled, notes, size, projectId } = module;
//   Module.find
//   if (_id) {
//     await Module.findOneAndUpdate(_id, {
//       name,
//       description,
//       dateInstalled,
//       notes,
//       size,
//       projectId,
//     });
//   } else {
//     await Module.create({
//       name,
//       description,
//       dateInstalled,
//       notes,
//       size,
//       projectId,
//     });
//   }
// });

// }