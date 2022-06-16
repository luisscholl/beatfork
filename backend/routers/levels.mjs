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

const checkAuthenticated = function (error) {
  return async (req, res, next) => {
    if (!res.app.locals.authenticated) {
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
};

const checkNoDuplicateVersionIds = function (error) {
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
};

const setArtists = function () {
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
};

const setAuthor = function () {
  return async (req, res, next) => {
    req.body.author = {
      id: res.app.locals.userId,
      username: res.app.locals.username,
    };
    next();
  };
};

const checkAuthorized = function (error, message) {
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
    const oldLevel = await req.app.locals.db
      .collection("levels")
      .findOne(query);
    if (!oldLevel) {
      const levelNotFound = new Error();
      levelNotFound.status = 404;
      levelNotFound.errors = "Level not found";
      levelNotFound.message = `No level with levelId ${req.params.levelId} found`;
      return next(levelNotFound);
    }
    if (oldLevel.author.id !== res.app.locals.userId) {
      const userNotAuthorized = new Error();
      userNotAuthorized.status = 403;
      userNotAuthorized.errors = error;
      userNotAuthorized.message = message;
      return next(userNotAuthorized);
    }
    next();
    return null;
  };
};

// TODO: only return unpublished levels to their autor

router.post(
  "/",
  checkAuthenticated("Levels can only be created by authorized users"),
  checkNoDuplicateVersionIds(),
  setArtists(),
  setAuthor(),
  async (req, res, next) => {
    const result = await req.app.locals.db
      .collection("levels")
      .insertOne(req.body);
    if (result.acknowledged) {
      res.json({
        id: result.insertedId,
      });
    } else {
      return next(
        new Error("Something went wrong inserting new level into the database")
      );
    }
    return null;
  }
);

router.get("/", async (req, res, next) => {
  // create the index for text search on title if it doesn't exist already
  const result = await req.app.locals.db
    .collection("levels")
    .createIndex({ title: "text" });

  const currentPage = req.query.hasOwnProperty("currentPage")
    ? req.query.currentPage
    : 1;
  const pageSize = req.query.hasOwnProperty("pageSize")
    ? req.query.pageSize
    : 20;
  // no rating or personalBest yet so use title as defailt in the meantime (also change in openapi.yaml)
  const orderBy =
    req.query.hasOwnProperty("orderBy") &&
    req.query.orderBy !== "personalBest" &&
    req.query.orderBy !== "rating"
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
    : 0; // tracking of personal bests not implemented
  const maxPersonalBest = req.query.hasOwnProperty("maxPersonalBest")
    ? req.query.maxPersonalBest
    : 100; // tracking of personal bests not implemented
  const minRating = req.query.hasOwnProperty("minRating")
    ? req.query.minRating
    : 0; // tracking of ratings not implemented
  const title = req.query.hasOwnProperty("title") ? req.query.title : "";
  const author = req.query.hasOwnProperty("author") ? req.query.author : "";
  const artist = req.query.hasOwnProperty("artist") ? req.query.artist : "";

  const aggregationPipeline = [];
  aggregationPipeline.push({
    $match: {
      ...(title !== "" && { $text: { $search: title } }),
      ...(!res.app.locals.authenticated && { published: true }),
      ...(res.app.locals.authenticated && {
        $or: [{ published: true }, { "author.id": res.app.locals.userId }],
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
      "versions.difficulty": {
        $gte: minDifficulty,
        $lte: maxDifficulty,
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
          $addFields: {
            id: "$_id",
          },
        },
        {
          $project: {
            "versions.objects": false,
            _id: false,
            ...(orderBy === "difficulty" && { difficulty: false }),
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

router.get("/:levelId", async (req, res, next) => {
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
  const level = await req.app.locals.db.collection("levels").findOne(query);
  if (!level) {
    const levelNotFound = new Error();
    levelNotFound.status = 404;
    levelNotFound.errors = "Level not found";
    levelNotFound.message = `No level with levelId ${req.params.levelId} found`;
    return next(levelNotFound);
  }
  if (
    !(
      level.published ||
      (res.app.locals.authenticated &&
        res.app.locals.userId === level.author.id)
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
  level.id = level._id;
  delete level._id;
  res.json(level);
  return null;
});

router.put(
  "/:levelId",
  checkAuthenticated("Levels can only be updated by authenticated users"),
  checkNoDuplicateVersionIds(),
  setArtists(),
  setAuthor(),
  checkAuthorized(
    "Levels can only be updated by authorized users",
    "The given user isn't authorized to update this level"
  ),
  async (req, res, next) => {
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
    const result = await req.app.locals.db
      .collection("levels")
      .replaceOne(query, req.body);
    if (!result.acknowledged || !result.matchedCount === 1) {
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

router.delete(
  "/:levelId",
  checkAuthenticated("Levels can only be deleted by authenticated users"),
  checkAuthorized(
    "Levels can only be deleted by authorized users",
    "The given user isn't authorized to delete this level"
  ),
  async (req, res, next) => {
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
    const result = await req.app.locals.db
      .collection("levels")
      .deleteOne(query);
    if (!result.acknowledged || !result.matchedCount === 1) {
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

router.get("/:levelId/:versionId", async (req, res, next) => {
  const aggregationPipeline = [];
  try {
    aggregationPipeline.push({
      $match: {
        _id: ObjectId(req.params.levelId),
        "versions.id": {
          $eq: Number(req.params.versionId),
        },
      },
    });
  } catch (err) {
    // An ObjectId can't be constructed from the given levelId
    const levelNotFound = new Error();
    levelNotFound.status = 404;
    levelNotFound.errors = "Level not found";
    levelNotFound.message = `No level with levelId ${req.params.levelId} found`;
    return next(levelNotFound);
  }
  aggregationPipeline.push({
    $project: {
      version: {
        $first: {
          $filter: {
            input: "$versions",
            as: "version",
            cond: {
              $eq: ["$$version.id", Number(req.params.versionId)],
            },
          },
        },
      },
      published: true,
      "author.id": true,
    },
  });
  const levels = await req.app.locals.db
    .collection("levels")
    .aggregate(aggregationPipeline)
    .toArray();
  if (levels.length === 0) {
    const levelNotFound = new Error();
    levelNotFound.status = 404;
    levelNotFound.errors = "Version of level not found";
    levelNotFound.message = `Either no level with levelId ${req.params.levelId} found or no version with versionId ${req.params.versionId} of level found`;
    return next(levelNotFound);
  }
  const level = levels[0];
  if (
    !(
      level.published ||
      (req.app.locals.authenticated &&
        req.app.locals.userId === level.author.id)
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
  res.json(level.version);
  return null;
});

export default router;
