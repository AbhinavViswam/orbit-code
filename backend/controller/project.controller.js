import Project from "../models/project.model.js";
import User from "../models/user.model.js";

/**
 * @param {import('express').Request & { user?: any }} req
 * @param {import('express').Response} res
 */
export const createProject = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const { projectName } = req.body;
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ e: "User does not exist" });
    }
    const project = await Project.create({
      name: projectName,
      owner: [
        { ownerid: user._id, ownerEmail: userEmail, ownerName: user.name },
      ],
      users: [],
    });
    return res.status(200).json({ m: "Project Created", o: project });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ e: "Internal server error" });
  }
};

/**
 * @param {import('express').Request & { user?: any }} req
 * @param {import('express').Response} res
 */
export const deleteProject = async (req, res) => {
  try {
    const userId = req.user.id; // logged-in user
    const { id } = req.params; // project id

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ e: "Project not found" });
    }

    // extract owner id
    const ownerId = project.owner?.[0]?.ownerid?.toString();

    // Check if logged-in user is the owner
    if (ownerId !== userId) {
      return res
        .status(403)
        .json({ e: "Only the project owner can delete this project." });
    }

    await Project.findByIdAndDelete(id);

    return res.status(200).json({ o: "Project deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ e: "Internal server error" });
  }
};

/**
 * @param {import('express').Request & { user?: any }} req
 * @param {import('express').Response} res
 */
export const showProject = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ e: "User does not exist" });
    }
    const project = await Project.find({
      $or: [
        { "users.userid": { $in: [user._id] } },
        { "owner.ownerid": { $in: [user._id] } },
      ],
    });
    if (!project) {
      return res.status(404).json({ e: "No projects found" });
    }
    res.status(200).json({ m: "Projects fetched", o: project });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ e: "Internal server error" });
  }
};

/**
 * @param {import('express').Request & { user?: any }} req
 * @param {import('express').Response} res
 */
export const addProjectPartner = async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.user.email;
    const { partnerEmail } = req.body;

    const user = await User.findOne({ email: userEmail });
    if (!user) return res.status(404).json({ e: "User does not exist" });

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ e: "Project does not exist" });

    const partner = await User.findOne({ email: partnerEmail });
    if (!partner) return res.status(404).json({ e: "Partner does not exist" });

    // Only owner can add partner
    if (project.owner[0]?.ownerid?.toString() !== user._id.toString()) {
      return res
        .status(401)
        .json({ e: "You are not the owner of the project" });
    }

    // Check if partner already exists
    const isPartnerAlreadyAdded = project.users.some(
      (u) => u.userid?.toString() === partner._id.toString()
    );

    if (isPartnerAlreadyAdded) {
      return res.status(400).json({ e: "Partner already added" });
    }

    // Add partner
    project.users.push(/** @type {any} */ ({
      userid: partner._id,
      userEmail: partner.email,
      userName: partner.name,
    }));

    await project.save();

    return res.status(200).json({ m: "Partner added", o: project });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ e: "Internal server error" });
  }
};

/**
 * @param {import('express').Request & { user?: any }} req
 * @param {import('express').Response} res
 */
export const deleteProjectPartner = async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.user.email;
    const { partnerEmail } = req.body;
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ e: "User does not exist" });
    }
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ e: "Project does not exist" });
    }
    const partner = await User.findOne({ email: partnerEmail });
    if (!partner) {
      return res.status(404).json({ e: "Partner does not exist" });
    }
    if (project.owner[0]?.ownerid?.toString() !== user._id.toString()) {
      return res
        .status(401)
        .json({ e: "You are not the owner of the project" });
    }
    const isPartner = project.users.some(
      (u) => u.userid?.toString() === partner._id.toString()
    );

    if (!isPartner) {
      return res
        .status(400)
        .json({ e: "Partner does not exist in this project" });
    }

    project.users = /** @type {any} */ (project.users.filter(
      (u) => u.userid?.toString() !== partner._id.toString()
    ));
    await project.save();
    return res
      .status(200)
      .json({ m: "Partner removed successfully", o: project });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ e: "Internal server error" });
  }
};

/**
 * @param {import('express').Request & { user?: any }} req
 * @param {import('express').Response} res
 */
export const showProjectById = async (req, res) => {
  try {
    const { pid } = req.params;
    const project = await Project.findById(pid);
    if (!project) {
      return res.status(404).json({ e: "Project does not exist" });
    }
    return res.status(200).json({ m: "Project fetched", o: project });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ e: "Internal server error" });
  }
};

/**
 * @param {import('express').Request & { user?: any }} req
 * @param {import('express').Response} res
 */
export const updateFileTree = async (req, res) => {
  const { projectId, fileTree } = req.body;
  if (!projectId || !fileTree) {
    return res.status(400).json({ e: "Bad request" });
  }
  try {
    const project = await Project.findOneAndUpdate(
      {
        _id: projectId,
      },
      {
        fileTree,
      },
      {
        new: true,
      }
    );
    if (!project) {
      return res.status(404).json({ e: "Project not found" });
    }
    return res.status(200).json({ m: "File tree updated", o: project });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ e: "Internal server error" });
  }
};
