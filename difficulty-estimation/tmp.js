const version = {
  _id: {
    levelId: {
      $oid: '630393687319cba6bc3621d8'
    },
    versionId: 1
  },
  difficulty: 1,
  objects: [
    {
      type: 'Collectible',
      collectibleType: 1,
      position: {
        x: -0.5191373763790316,
        y: -0.4509770621371213,
        z: 0.20000000000000012
      },
      measure: 0,
      beat: 0
    },
    {
      type: 'Collectible',
      collectibleType: 1,
      position: {
        x: 0.4617222376630424,
        y: -0.484570945373687,
        z: 0.49999999999999994
      },
      measure: 0,
      beat: 0
    },
    {
      type: 'Collectible',
      collectibleType: 1,
      position: {
        x: 0.5203158701013666,
        y: 0.04902293786287876,
        z: 0.5
      },
      measure: 0,
      beat: 0
    },
    {
      type: 'Collectible',
      collectibleType: 1,
      position: {
        x: 0.6226598160374932,
        y: -0.6470708199745663,
        z: 0.8999999999999999
      },
      measure: 0,
      beat: 0
    },
    {
      type: 'Collectible',
      collectibleType: 1,
      position: {
        x: -0.44257482935436115,
        y: -0.5685551518686185,
        z: 1
      },
      measure: 0,
      beat: 0
    }
  ]
};

console.log(version.objects.map((e) => e.position.z));
