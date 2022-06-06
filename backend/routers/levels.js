const express = require('express')
const router = express.Router()

const artists = {
  'A80F7A98-C02F-4A85-B13F-DCDF70035BDE': {
    "id": "A80F7A98-C02F-4A85-B13F-DCDF70035BDE",
    "name": "Ryan Anderson",
    "website": "https://www.ryanandersenmusic.com"
  }
}

router.post('/', async (req, res, next) => {
  if (!req.app.locals.authorized) {
    let notAuthorized = new Error()
    notAuthorized.status = 401
    notAuthorized.errors = 'Levels can only be created by authorized users'
    notAuthorized.message = 'The header \'authorization\' must contain a valid token'
    return next(notAuthorized)
  }

  // add check for audiolinks to domains on blocklist

  let level = req.body
  level.author = {
    id: req.app.locals.userId,
    username: req.app.locals.username
  }

  level.artists = []
  for (artistId of level.artistIds) {
    if (artists.hasOwnProperty(artistId)) {
      level.artists.push(artists[artistId])
    } else {
      let artistNotFound = new Error()
      artistNotFound.status = 404
      artistNotFound.errors = 'At least one unknown artistId given'
      artistNotFound.message = 'No artist with artistId ' + artistId + ' found'
      return next(artistNotFound)
    }
  }
  delete level.artistIds

  const result = await req.app.locals.db.collection('levels').insertOne(level)
  if (result.acknowledged) {
    res.json({
      id: result.insertedId
    })
  } else {
    throw new Error('Something went wrong inserting new level into the database')
  }
})

router.get('/', async (req, res, next) => {
  // create the index for text search on title if it doesn't exist already
  const result = await req.app.locals.db.collection('levels').createIndex({ title: "text" });
  console.log(`Index created: ${result}`);

  const currentPage = req.query.hasOwnProperty('currentPage') ? req.query.currentPage : 1
  const pageSize = req.query.hasOwnProperty('pageSize') ? req.query.pageSize : 20
  const orderBy = 'length' // no rating yet so use length in the meantime (also change in openapi.yaml)
  const direction = req.query.hasOwnProperty('direction') && req.query.direction === 'descending' ? -1 : 1
  const minDifficulty = req.query.hasOwnProperty('minDifficulty') ? req.query.minDifficulty : 1
  const maxDifficulty = req.query.hasOwnProperty('maxDifficulty') ? req.query.maxDifficulty : 20
  const minLength = req.query.hasOwnProperty('minLength') ? req.query.minLength : 0
  const maxLength = req.query.hasOwnProperty('maxLength') ? req.query.maxLength : 0
  const minPersonalBest = req.query.hasOwnProperty('minPersonalBest') ? req.query.minPersonalBest : 0 // tracking of personal bests not implemented
  const maxPersonalBest = req.query.hasOwnProperty('maxPersonalBest') ? req.query.maxPersonalBest : 100 // tracking of personal bests not implemented
  const minRating = req.query.hasOwnProperty('minRating') ? req.query.minRating : 0 // tracking of ratings not implemented
  const title = req.query.hasOwnProperty('title') ? req.query.title : ''
  const author = req.query.hasOwnProperty('author') ? req.query.author : ''
  const artist = req.query.hasOwnProperty('artist') ? req.query.artist : ''

  const aggregationPipeline = [
    {
      $match: {
        ...(title !== '' && { $text: { $search: title } }),
        'author.username': {
          $regex: author,
          $options: 'i'
        },
        'artists.name': {
          $regex: artist,
          $options: 'i'
        },
        length: {
          $gte: minLength,
          ...(maxLength > 0 && { $lte: maxLength })
        },
        'versions.difficulty': {
          $gte: minDifficulty,
          $lte: maxDifficulty
        }
      }
    },
    {
      $facet: {
        statistics: [
          {
            $count: 'totalLevels'
          },
          {
            $project: {
              totalPages: {
                $ceil: {
                  $divide: [
                    '$totalLevels',
                    pageSize
                  ]
                }
              },
              _id: false,
              currentPage: {
                $literal: currentPage
              },
              pageSize: {
                $literal: pageSize
              }
            }
          }
        ],
        levels: [
          {
            $sort: {
              [orderBy]: direction,
              _id: 1 // we need to sort on at least one unique field for skip and limit
            }
          },
          {
            $skip: (currentPage - 1) * pageSize
          },
          {
            $limit: pageSize
          },
          {
            $unset: ['versions.objects', '_id']
          }
        ]
      }
    },
    {
      $project: {
        statistics: {
          $ifNull: [
            {
              $first: '$statistics'
            },
            {
              totalPages: 0,
              currentPage: currentPage,
              pageSize: pageSize
            }
          ]
        },
        levels: true
      }
    }
  ]

  const levels = await req.app.locals.db.collection('levels').aggregate(aggregationPipeline).toArray()
  res.json(levels[0])
})

module.exports = router