import { Router } from "express";
import { ObjectId } from "mongodb";

const router = Router();

const artists = {
  "A80F7A98-C02F-4A85-B13F-DCDF70035BDE": {
    id: "A80F7A98-C02F-4A85-B13F-DCDF70035BDE",
    name: "Ryan Anderson",
    website: "https://www.ryanandersenmusic.com",
  },
  "B80F7A98-C02F-4A85-B13F-DCDF70035BDE": {
    id: "B80F7A98-C02F-4A85-B13F-DCDF70035BDE",
    name: "Andy G. Cohen",
    website: "https://www.youtube.com/channel/UCJJBHPNXpLBcOPb5qFpy4wA",
  },
  "C80F7A98-C02F-4A85-B13F-DCDF70035BDE": {
    id: "C80F7A98-C02F-4A85-B13F-DCDF70035BDE",
    name: "Fast Ballerz",
  },
};

// Helpers used by multiple methods

function checkAuthenticated(error) {
  return async (req, res, next) => {
    if (!res.locals.authenticated) {
      const notAuthenticated = new Error();
      notAuthenticated.status = 401;
      notAuthenticated.errors = error;
      notAuthenticated.message =
        "The header 'authorization' must contain a valid token";
      return next(notAuthenticated);
    }
    next();
    return null;
  };
}

function checkNoDuplicateVersionIds() {
  return async (req, res, next) => {
    const versionIds = {};
    for (const version of req.body.versions) {
      if (versionIds.hasOwnProperty(version.id)) {
        const duplicateVersionId = new Error();
        duplicateVersionId.status = 400;
        duplicateVersionId.errors =
          "Versions of a level can't share the same versionId";
        duplicateVersionId.message = `Duplicate versionId ${version.id}`;
        return next(duplicateVersionId);
      }
      versionIds[version.id] = 1;
    }
    next();
    return null;
  };
}

function removeAdditionalFromGameObjects() {
  return async (req, res, next) => {
    // because express-openapi-validator can't properly handle oneOf
    // we need to remove additional properties from collectibles and obstacles manually
    for (const version of req.body.versions) {
      for (const object of version.objects) {
        if (object.type === "Obstacle") {
          delete object.collectibleType;
        } else if (object.type === "Collectible") {
          delete object.dimensions;
        }
      }
    }
    next();
    return null;
  };
}

function setArtists() {
  return async (req, res, next) => {
    req.body.artists = [];
    for (const artistId of req.body.artistIds) {
      if (artists.hasOwnProperty(artistId)) {
        req.body.artists.push(artists[artistId]);
      } else {
        const artistNotFound = new Error();
        artistNotFound.status = 404;
        artistNotFound.errors = "At least one unknown artistId given";
        artistNotFound.message = `No artist with artistId ${artistId} found`;
        return next(artistNotFound);
      }
    }
    delete req.body.artistIds;
    next();
    return null;
  };
}

function setAuthor() {
  return async (req, res, next) => {
    req.body.author = {
      id: res.locals.userId,
      username: res.locals.username,
    };
    next();
  };
}

function keepAuthor() {
  return async (req, res, next) => {
    req.body.author = {
      id: res.locals.authorId,
      username: res.locals.authorName,
    };
    next();
  };
}

function getAuthorFromDB() {
  return async (req, res, next) => {
    let query;
    try {
      query = { _id: new ObjectId(req.params.levelId) };
    } catch (err) {
      // An ObjectId can't be constructed from the given levelId
      const levelNotFound = new Error();
      levelNotFound.status = 404;
      levelNotFound.errors = "Level not found";
      levelNotFound.message = `No level with levelId ${req.params.levelId} found`;
      return next(levelNotFound);
    }
    const oldLevel = await res.app.locals.db
      .collection("levels")
      .findOne(query);
    if (!oldLevel) {
      const levelNotFound = new Error();
      levelNotFound.status = 404;
      levelNotFound.errors = "Level not found";
      levelNotFound.message = `No level with levelId ${req.params.levelId} found`;
      return next(levelNotFound);
    }
    res.locals.authorId = oldLevel.author.id;
    res.locals.authorName = oldLevel.author.username;
    next();
    return null;
  };
}

function getAuthorFromQuery() {
  return async (req, res, next) => {
    res.locals.authorId = req.query.authorId;
    next();
    return null;
  };
}

function checkAuthorized(error, message) {
  return async (req, res, next) => {
    if (res.locals.admin) {
      next();
      return null;
    }
    if (res.locals.authorId !== res.locals.userId) {
      const userNotAuthorized = new Error();
      userNotAuthorized.status = 403;
      userNotAuthorized.errors = error;
      userNotAuthorized.message = message;
      return next(userNotAuthorized);
    }
    next();
    return null;
  };
}

router.post(
  "/",
  checkAuthenticated("Levels can only be created by authenticated users"),
  checkNoDuplicateVersionIds(),
  removeAdditionalFromGameObjects(),
  setArtists(),
  setAuthor(),
  async (req, res, next) => {
    const { versions } = req.body;
    delete req.body.versions;
    const levelResult = await res.app.locals.db
      .collection("levels")
      .insertOne(req.body);
    if (!levelResult.acknowledged) {
      return next(
        new Error("Something went wrong inserting new level into the database")
      );
    }

    const versionInserts = [];
    for (const version of versions) {
      version._id = {
        levelId: new ObjectId(levelResult.insertedId),
        versionId: version.id,
      };
      delete version.id;
      versionInserts.push(
        res.app.locals.db.collection("versions").insertOne(version)
      );
    }
    const versionResults = await Promise.all(versionInserts);
    for (const versionResult of versionResults) {
      if (!versionResult.acknowledged) {
        return next(
          new Error(
            "Something went wrong inserting version of new level into the database"
          )
        );
      }
    }

    res.json({
      id: levelResult.insertedId,
    });
    return null;
  }
);

router.get("/", async (req, res) => {
  // create the index for text search on title if it doesn't exist already
  await res.app.locals.db.collection("levels").createIndex({ title: "text" });

  const currentPage = req.query.hasOwnProperty("currentPage")
    ? req.query.currentPage
    : 1;
  const pageSize = req.query.hasOwnProperty("pageSize")
    ? req.query.pageSize
    : 20;
  // no rating yet so use title as default in the meantime (also change in openapi.yaml)
  const orderBy =
    req.query.hasOwnProperty("orderBy") && req.query.orderBy !== "rating"
      ? req.query.orderBy
      : "title";
  const direction =
    req.query.hasOwnProperty("direction") &&
    req.query.direction === "descending"
      ? -1
      : 1;
  const minDifficulty = req.query.hasOwnProperty("minDifficulty")
    ? req.query.minDifficulty
    : 1;
  const maxDifficulty = req.query.hasOwnProperty("maxDifficulty")
    ? req.query.maxDifficulty
    : 20;
  const minLength = req.query.hasOwnProperty("minLength")
    ? req.query.minLength
    : 0;
  const maxLength = req.query.hasOwnProperty("maxLength")
    ? req.query.maxLength
    : 0;
  const minPersonalBest = req.query.hasOwnProperty("minPersonalBest")
    ? req.query.minPersonalBest
    : 0;
  const maxPersonalBest = req.query.hasOwnProperty("maxPersonalBest")
    ? req.query.maxPersonalBest
    : 100;
  /*
  const minRating = req.query.hasOwnProperty("minRating")
    ? req.query.minRating
    : 0; // tracking of ratings not implemented
  */
  const title = req.query.hasOwnProperty("title") ? req.query.title : "";
  const author = req.query.hasOwnProperty("author") ? req.query.author : "";
  const artist = req.query.hasOwnProperty("artist") ? req.query.artist : "";

  const aggregationPipeline = [];
  aggregationPipeline.push({
    $match: {
      ...(title !== "" && { $text: { $search: title } }),
      ...(!res.locals.authenticated && { published: true }),
      ...(res.locals.authenticated &&
        !res.locals.admin && {
          $or: [{ published: true }, { "author.id": res.locals.userId }],
        }),
      "author.username": {
        $regex: author,
        $options: "i",
      },
      ...(artist !== "" && {
        "artists.name": {
          $regex: artist,
          $options: "i",
        },
      }),
      length: {
        $gte: minLength,
        ...(maxLength > 0 && { $lte: maxLength }),
      },
    },
  });
  aggregationPipeline.push({
    $lookup: {
      from: "versions",
      localField: "_id",
      foreignField: "_id.levelId",
      as: "versions",
    },
  });
  let personalBestField;
  if (res.locals.authenticated) {
    personalBestField = `$$version.personalBests.${res.locals.userId}`;
  }
  aggregationPipeline.push({
    $addFields: {
      id: "$_id",
      versions: {
        $map: {
          input: "$versions",
          as: "version",
          in: {
            id: "$$version._id.versionId",
            difficulty: "$$version.difficulty",
            ...(res.locals.authenticated && {
              personalBest: {
                $ifNull: [personalBestField, { $literal: 0 }],
              },
            }),
          },
        },
      },
    },
  });
  aggregationPipeline.push({
    $match: {
      "versions.difficulty": {
        $gte: minDifficulty,
        $lte: maxDifficulty,
      },
    },
  });
  aggregationPipeline.push({
    $match: {
      "versions.personalBest": {
        $gte: minPersonalBest,
        $lte: maxPersonalBest,
      },
    },
  });
  if (orderBy === "difficulty") {
    if (direction === 1) {
      aggregationPipeline.push({
        $addFields: {
          difficulty: {
            $reduce: {
              input: "$versions",
              initialValue: 20,
              in: { $min: ["$$value", "$$this.difficulty"] },
            },
          },
        },
      });
    } else {
      aggregationPipeline.push({
        $addFields: {
          difficulty: {
            $reduce: {
              input: "$versions",
              initialValue: 1,
              in: { $max: ["$$value", "$$this.difficulty"] },
            },
          },
        },
      });
    }
  }
  if (orderBy === "personalBest") {
    if (direction === 1) {
      aggregationPipeline.push({
        $addFields: {
          personalBest: {
            $reduce: {
              input: "$versions",
              initialValue: 100,
              in: { $min: ["$$value", "$$this.personalBest"] },
            },
          },
        },
      });
    } else {
      aggregationPipeline.push({
        $addFields: {
          personalBest: {
            $reduce: {
              input: "$versions",
              initialValue: 0,
              in: { $max: ["$$value", "$$this.personalBest"] },
            },
          },
        },
      });
    }
  }
  aggregationPipeline.push({
    $facet: {
      statistics: [
        {
          $count: "totalLevels",
        },
        {
          $project: {
            totalPages: {
              $ceil: {
                $divide: ["$totalLevels", pageSize],
              },
            },
            _id: false,
            currentPage: {
              $literal: currentPage,
            },
            pageSize: {
              $literal: pageSize,
            },
          },
        },
      ],
      levels: [
        {
          $sort: {
            [orderBy]: direction,
            _id: 1, // we need to sort on at least one unique field for skip and limit
          },
        },
        {
          $skip: (currentPage - 1) * pageSize,
        },
        {
          $limit: pageSize,
        },
        {
          $project: {
            _id: false,
            ...(orderBy === "difficulty" && { difficulty: false }),
            ...(orderBy === "personalBest" && { personalBest: false }),
          },
        },
      ],
    },
  });
  aggregationPipeline.push({
    $project: {
      statistics: {
        $ifNull: [
          {
            $first: "$statistics",
          },
          {
            totalPages: 0,
            currentPage,
            pageSize,
          },
        ],
      },
      levels: true,
    },
  });

  const levels = await res.app.locals.db
    .collection("levels")
    .aggregate(aggregationPipeline)
    .toArray();
  res.json(levels[0]);
});

router.delete(
  "/",
  checkAuthenticated("Levels can only be deleted by authenticated users"),
  getAuthorFromQuery(),
  checkAuthorized(
    "Levels can only be deleted by authorized users",
    "The given user isn't authorized to delete this level"
  ),
  async (req, res, next) => {
    const levelsQuery = { "author.id": res.locals.authorId };

    const levels = await res.app.locals.db
      .collection("levels")
      .find(levelsQuery)
      .toArray();

    const deleteLevelsResult = await res.app.locals.db
      .collection("levels")
      .deleteMany(levelsQuery);
    if (!deleteLevelsResult.acknowledged) {
      const unknownServerError = new Error();
      unknownServerError.status = 500;
      unknownServerError.errors = "Something went wrong";
      unknownServerError.message = "Something went wrong";
      return next(unknownServerError);
    }

    const levelsIds = [];
    for (const level of levels) {
      levelsIds.push(new ObjectId(level._id));
    }

    const versionsQuery = { "_id.levelId": { $in: levelsIds } };

    const deleteVersionsResult = await res.app.locals.db
      .collection("versions")
      .deleteMany(versionsQuery);

    if (!deleteVersionsResult.acknowledged) {
      const unknownServerError = new Error();
      unknownServerError.status = 500;
      unknownServerError.errors = "Something went wrong";
      unknownServerError.message = "Something went wrong";
      return next(unknownServerError);
    }

    res.sendStatus(200);
    return null;
  }
);

router.get("/:levelId", async (req, res, next) => {
  let levelId;
  try {
    levelId = new ObjectId(req.params.levelId);
  } catch (err) {
    // An ObjectId can't be constructed from the given levelId
    const levelNotFound = new Error();
    levelNotFound.status = 404;
    levelNotFound.errors = "Level not found";
    levelNotFound.message = `No level with levelId ${req.params.levelId} found`;
    return next(levelNotFound);
  }
  let personalBestField;
  if (res.locals.authenticated) {
    personalBestField = `$$version.personalBests.${res.locals.userId}`;
  }
  const aggregationPipeline = [
    {
      $match: { _id: levelId },
    },
    {
      $lookup: {
        from: "versions",
        localField: "_id",
        foreignField: "_id.levelId",
        as: "versions",
      },
    },
    {
      $addFields: {
        id: "$_id",
        versions: {
          $map: {
            input: "$versions",
            as: "version",
            in: {
              id: "$$version._id.versionId",
              difficulty: "$$version.difficulty",
              ...(res.locals.authenticated && {
                personalBest: personalBestField,
              }),
              objects: "$$version.objects",
            },
          },
        },
      },
    },
    {
      $project: {
        _id: false,
      },
    },
  ];
  const levels = await res.app.locals.db
    .collection("levels")
    .aggregate(aggregationPipeline)
    .toArray();
  if (levels.length === 0) {
    const levelNotFound = new Error();
    levelNotFound.status = 404;
    levelNotFound.errors = "Level not found";
    levelNotFound.message = `No level with levelId ${req.params.levelId} found`;
    return next(levelNotFound);
  }
  const level = levels[0];
  if (
    !(
      level.published ||
      res.locals.admin(
        res.locals.authenticated && res.locals.userId === level.author.id
      )
    )
  ) {
    const userNotAuthorized = new Error();
    userNotAuthorized.status = 403;
    userNotAuthorized.errors =
      "Levels, that aren't published, can only be viewed by authorized users";
    userNotAuthorized.message =
      "The given user isn't authorized to view this level";
    return next(userNotAuthorized);
  }
  res.json(level);
  return null;
});

router.put(
  "/:levelId",
  checkAuthenticated("Levels can only be updated by authenticated users"),
  checkNoDuplicateVersionIds(),
  removeAdditionalFromGameObjects(),
  setArtists(),
  getAuthorFromDB(),
  checkAuthorized(
    "Levels can only be updated by authorized users",
    "The given user isn't authorized to update this level"
  ),
  keepAuthor(),
  async (req, res, next) => {
    const newVersions = req.body.versions;
    delete req.body.versions;

    let levelId;
    try {
      levelId = new ObjectId(req.params.levelId);
    } catch (err) {
      // An ObjectId can't be constructed from the given levelId
      const levelNotFound = new Error();
      levelNotFound.status = 404;
      levelNotFound.errors = "Level not found";
      levelNotFound.message = `No level with levelId ${req.params.levelId} found`;
      return next(levelNotFound);
    }
    const levelQuery = { _id: levelId };
    const levelUpdateResult = await res.app.locals.db
      .collection("levels")
      .replaceOne(levelQuery, req.body);
    if (
      !levelUpdateResult.acknowledged ||
      !levelUpdateResult.matchedCount === 1
    ) {
      const unknownServerError = new Error();
      unknownServerError.status = 500;
      unknownServerError.errors = "Something went wrong";
      unknownServerError.message = "Something went wrong";
      return next(unknownServerError);
    }

    const versionsQuery = { "_id.levelId": levelId };
    let oldVersionIds = await res.app.locals.db
      .collection("versions")
      .find(versionsQuery)
      .project({ _id: 1 })
      .toArray();
    const versionUpserts = [];
    for (const newVersion of newVersions) {
      oldVersionIds = oldVersionIds.filter(
        (oldVersionId) => oldVersionId._id.versionId !== newVersion.id
      );
      const versionQuery = { _id: { levelId, versionId: newVersion.id } };
      const update = {
        $set: {
          difficulty: newVersion.difficulty,
          objects: newVersion.objects,
          _id: versionQuery._id,
        },
      };
      versionUpserts.push(
        res.app.locals.db
          .collection("versions")
          .updateOne(versionQuery, update, { upsert: true })
      );
    }
    const versionUpsertResults = await Promise.all(versionUpserts);
    for (const versionUpsertResult of versionUpsertResults) {
      if (!versionUpsertResult.acknowledged) {
        return next(
          new Error(
            "Something went wrong updating or inserting version of new level into the database"
          )
        );
      }
    }
    if (oldVersionIds.length > 0) {
      oldVersionIds = oldVersionIds.map((id) => id._id);
      const versionDeleteResult = await res.app.locals.db
        .collection("versions")
        .deleteMany({ _id: { $in: oldVersionIds } });
      if (!versionDeleteResult.acknowledged) {
        return next(
          new Error(
            "Something went wrong updating or inserting version of new level into the database"
          )
        );
      }
    }

    res.sendStatus(200);
    return null;
  }
);

router.delete(
  "/:levelId",
  getAuthorFromDB(),
  checkAuthenticated("Levels can only be deleted by authenticated users"),
  checkAuthorized(
    "Levels can only be deleted by authorized users",
    "The given user isn't authorized to delete this level"
  ),
  async (req, res, next) => {
    let levelId;
    try {
      levelId = new ObjectId(req.params.levelId);
    } catch (err) {
      // An ObjectId can't be constructed from the given levelId
      const levelNotFound = new Error();
      levelNotFound.status = 404;
      levelNotFound.errors = "Level not found";
      levelNotFound.message = `No level with levelId ${req.params.levelId} found`;
      return next(levelNotFound);
    }
    const levelQuery = { _id: levelId };
    const levelResult = await res.app.locals.db
      .collection("levels")
      .deleteOne(levelQuery);
    if (!levelResult.acknowledged || !levelResult.matchedCount === 1) {
      const unknownServerError = new Error();
      unknownServerError.status = 500;
      unknownServerError.errors = "Something went wrong";
      unknownServerError.message = "Something went wrong";
      return next(unknownServerError);
    }
    const versionsQuery = { "_id.levelId": levelId };
    const versionsResult = await res.app.locals.db
      .collection("versions")
      .deleteMany(versionsQuery);
    if (!versionsResult.acknowledged) {
      return next(
        new Error(
          "Something went wrong deleting a version of the level from the database"
        )
      );
    }
    res.sendStatus(200);
    return null;
  }
);

router.get("/:levelId/:versionId", async (req, res, next) => {
  let levelId;
  let versionId;
  try {
    levelId = ObjectId(req.params.levelId);
    versionId = Number(req.params.versionId);
  } catch (err) {
    // An ObjectId can't be constructed from the given levelId
    const levelNotFound = new Error();
    levelNotFound.status = 404;
    levelNotFound.errors = "Version not found";
    levelNotFound.message = `No version with levelId ${req.params.levelId} and versionId ${req.params.versionId} found`;
    return next(levelNotFound);
  }
  const aggregationPipeline = [];
  aggregationPipeline.push({
    $match: {
      "_id.levelId": levelId,
      "_id.versionId": versionId,
    },
  });
  aggregationPipeline.push({
    $lookup: {
      from: "levels",
      localField: "_id.levelId",
      foreignField: "_id",
      as: "level",
    },
  });
  let personalBestField;
  if (res.locals.authenticated) {
    personalBestField = `$personalBests.${res.locals.userId}`;
  }
  aggregationPipeline.push({
    $project: {
      level: {
        $first: "$level",
      },
      ...(res.locals.authenticated && { personalBest: personalBestField }),
      id: "$_id.versionId",
      objects: 1,
      difficulty: 1,
      _id: 0,
    },
  });
  aggregationPipeline.push({
    $project: {
      personalBests: 0,
    },
  });
  const versions = await req.app.locals.db
    .collection("versions")
    .aggregate(aggregationPipeline)
    .toArray();
  if (versions.length === 0 || versions[0].level === null) {
    const levelNotFound = new Error();
    levelNotFound.status = 404;
    levelNotFound.errors = "Version not found";
    levelNotFound.message = `No version with levelId ${req.params.levelId} and versionId ${req.params.versionId} found`;
    return next(levelNotFound);
  }
  const version = versions[0];
  if (
    !(
      version.level.published ||
      res.locals.admin ||
      (res.locals.authenticated &&
        res.locals.userId === version.level.author.id)
    )
  ) {
    const userNotAuthorized = new Error();
    userNotAuthorized.status = 403;
    userNotAuthorized.errors =
      "Levels, that aren't published, can only be viewed by authorized users";
    userNotAuthorized.message =
      "The given user isn't authorized to view this level";
    return next(userNotAuthorized);
  }
  delete version.level;
  res.json(version);
  return null;
});

router.put(
  "/:levelId/:versionId/personalBest",
  checkAuthenticated("Only authenticated users can set personal bests"),
  async (req, res, next) => {
    let levelId;
    let versionId;
    try {
      levelId = ObjectId(req.params.levelId);
      versionId = Number(req.params.versionId);
    } catch (err) {
      // An ObjectId can't be constructed from the given levelId
      const levelNotFound = new Error();
      levelNotFound.status = 404;
      levelNotFound.errors = "Version not found";
      levelNotFound.message = `No version with levelId ${req.params.levelId} and versionId ${req.params.versionId} found`;
      return next(levelNotFound);
    }
    if (
      !res.locals.admin &&
      req.body.hasOwnProperty("userId") &&
      req.body.userId !== res.locals.userId
    ) {
      const userNotAuthorized = new Error();
      userNotAuthorized.status = 403;
      userNotAuthorized.errors =
        "A non admin user can only set his own personal best";
      userNotAuthorized.message =
        "The given user isn't authorized to view this level";
      return next(userNotAuthorized);
    }
    const query = { _id: { levelId, versionId } };
    const field = `personalBests.${req.body.userId || res.locals.userId}`;
    const update = { $set: {} };
    update.$set[field] = req.body.personalBest;
    const result = await res.app.locals.db
      .collection("versions")
      .updateOne(query, update);
    if (!result.acknowledged) {
      const unknownServerError = new Error();
      unknownServerError.status = 500;
      unknownServerError.errors = "Something went wrong";
      unknownServerError.message = "Something went wrong";
      return next(unknownServerError);
    }
    if (result.matchedCount === 0) {
      const levelNotFound = new Error();
      levelNotFound.status = 404;
      levelNotFound.errors = "Version not found";
      levelNotFound.message = `No version with levelId ${req.params.levelId} and versionId ${req.params.versionId} found`;
      return next(levelNotFound);
    }
    res.sendStatus(200);
    return null;
  }
);

export default router;
