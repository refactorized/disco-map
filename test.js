const test = require('tape')
const discoMap = require('./index.js')
const util = discoMap._util

test('discoMap._util.allSequential', (t) => {
  t.ok(util.allSequential(validArr()))
  t.notOk(util.allSequential(overlappingArr()))
  t.end()
})

test('discoMap._util.pushDisco', (t) => {
  t.doesNotThrow(() => util.pushDisco(prepush())(pushes.good()))
  t.throws(() => util.pushDisco(prepush())(pushes.badx()))
  t.throws(() => util.pushDisco(prepush())(pushes.bady()))
  t.throws(() => util.pushDisco(prepush())(pushes.badd()))
  t.end()
})

test('discoMap._util.discoContainsIndex', (t) => {
  let d = {x: 10, y: 20, d: 10}

  // unlikely
  t.notOk(util.discoContainsIndex('x')(0)(d))
  t.notOk(util.discoContainsIndex('x')(-1)(d))

  // more likely
  t.ok(util.discoContainsIndex('x')(10)(d))
  t.notOk(util.discoContainsIndex('x')(9)(d))
  t.ok(util.discoContainsIndex('x')(11)(d))
  t.notOk(util.discoContainsIndex('x')(20)(d))
  t.notOk(util.discoContainsIndex('x')(21)(d))
  t.ok(util.discoContainsIndex('y')(20)(d))
  t.notOk(util.discoContainsIndex('y')(19)(d))
  t.ok(util.discoContainsIndex('y')(21)(d))
  t.notOk(util.discoContainsIndex('y')(30)(d))
  t.notOk(util.discoContainsIndex('y')(31)(d))
  t.end()
})

test('discoMap._util.discoOverlapsRange', (t) => {
  let d = {x: 10, y: 10, d: 10}
  t.notOk(util.discoOverlapsRange('x')(2)(2)(d), 'outside far from min')
  t.notOk(util.discoOverlapsRange('x')(8)(2)(d), 'outside adjacent to min')
  t.ok(util.discoOverlapsRange('x')(8)(4)(d), 'crossing min')
  t.ok(util.discoOverlapsRange('x')(10)(2)(d), 'inside adjacent to min')
  t.ok(util.discoOverlapsRange('x')(14)(2)(d), 'inside with space')
  t.ok(util.discoOverlapsRange('x')(18)(2)(d), 'inside adjacent to max')
  t.ok(util.discoOverlapsRange('x')(18)(44)(d), 'crossing max')
  t.notOk(util.discoOverlapsRange('x')(20)(2)(d), 'outside adjacent to max')
  t.notOk(util.discoOverlapsRange('x')(24)(2)(d), 'outside far from max')
  t.ok(util.discoOverlapsRange('x')(2)(42)(d), 'crossing whole')
  t.end()
})

test('discoMap basic useage, stateful', (t) => {
  let m = discoMap()
  t.ok(m.arr, '.arr property exists')
  t.ok(Array.isArray(m.arr), '.arr gets array')
  t.notEqual(m.arr, m.arr, '.arr property is cloned via getter')

  let prepushes = prepush()
  m.add(prepushes[0])
  t.equal(m.arr.length, 1, 'adding disco affects arr size (1)')
  let pre1 = prepushes[1]
  pre1.hitchhiker = 42
  m.add(pre1)
  t.deepEqual(m.arr[1], pre1, 'added disco can be retreived')
  t.notEqual(m.arr[1], pre1, '... but are clones, not aliases')
  t.equal(m.arr[1].hitchhiker, 42, 'also arbitrary values can hitchhike on discos just fine')
  t.equal(m.arr.length, 2, 'adding disco affects arr size (2)')
  t.throws(() => m.add(pushes.badx()), 'adding disco with bad x throws')
  t.equal(m.arr.length, 2, '...and .arr size remains same (2)')
  t.throws(() => m.add(pushes.bady()), 'adding disco with bad y throws')
  t.equal(m.arr.length, 2, '...and .arr size remains same (2)')
  t.throws(() => m.add(pushes.badd()), 'adding disco with bad d throws')
  t.equal(m.arr.length, 2, '...and .arr size remains same (2)')
  t.doesNotThrow(() => m.add(pushes.good()), 'adding good disco again works')
  t.equal(m.arr.length, 3, 'adding disco affects arr size (3)')
  t.end()
})

test('discoMap.arr set, stateful', (t) => {
  let dm = discoMap()
  dm.arr = validArr()
  t.deepEqual(dm.arr, validArr(), 'set arr clones valid array as discos')
  t.throws(() => { dm.arr = overlappingArr() }, 'setting invalid array throws')
  t.notDeepEqual(dm.arr, overlappingArr(), '...and doesn\'t set internal discos array')
  t.deepEqual(dm.arr, validArr(), '... but keeps the old one')
  t.end()
})

test('discoMap factory allows passing of seed array of discos', (t) => {
  let arr = validArr()
  let dm = discoMap(arr)
  t.deepEqual(dm.arr, validArr(), 'discoMap.arr is clone of passed array')
  t.end()
})

test('x2y', (t) => {
  let model = palindromeModel()
  let dm = discoMap()
  dm.arr = model.discos
  const testPoint = point => {
    t.equal(dm.x2y(point.x), point.y, 'verify x->y 1:1 mapping')
    t.equal(dm.y2x(point.y), point.x, 'verify y->x 1:1 mapping')
  }
  const testMiss = miss => {
    const fn = miss.dim === 'x' ? dm.x2y : dm.y2x
    t.throws(() => { fn(miss.index) }, 'mappings ouside of disco-space cause throw')
  }
  model.points.forEach(testPoint)
  model.misses.forEach(testMiss)
  t.end()
})

test('mapping ranges over discos', (t) => {
  let model = palindromeModel()
  let dm = discoMap(model.discos)
  let overlaps = dm.yOverlaps(model.search.yFound, model.search.dFound)
  t.deepEqual(overlaps, model.search.discosOverlapping)
  t.end()
})

// test data, implemented as constant factories

const validArr = () => [
  {x: 0, y: 0, d: 1},
  {x: 10, y: 2, d: 2},
  {x: 20, y: 5, d: 4}
]

const prepush = () => [
  {x: 0, y: 0, d: 1},
  {x: 2, y: 2, d: 2}
]

const pushes = {
  good: () => ({x: 4, y: 4, d: 1}),
  badx: () => ({x: 3, y: 4, d: 1}),
  bady: () => ({x: 4, y: 3, d: 1}),
  badd: () => ({x: 4, y: 4, d: 0})
}

const overlappingArr = () => [
  {x: 0, y: 0, d: 1},
  {x: 1, y: 1, d: 2}, // ok
  {x: 3, y: 2, d: 1}  // overlap
]

const palindromeModel = () => ({
  description: 'example string data and transform which removes non-letter content',
  txtA: 'a man, a plan, a canal. panama',
  //     0 000  0 1111  1 11222  222223
  //     01235  8 0123  6 89012  567890
  txtB: 'amanaPlanacanalPanama',
  //     123456789012345678901
  //     a man  a Plan  a canal  Panama
  //     0 000  0 0000  1 11111  111122
  //     0 123  5 6789  0 12345  678901
  discos: [
    {x: 0, y: 0, d: 1, content: 'a'},
    {x: 2, y: 1, d: 3, content: 'man'},
    {x: 8, y: 5, d: 1, content: 'a'},
    {x: 10, y: 6, d: 4, content: 'Plan'},
    {x: 16, y: 10, d: 1, content: 'a'},
    {x: 18, y: 11, d: 5, content: 'canal'},
    {x: 25, y: 16, d: 6, content: 'Panama'}
  ],
  points: [
    {x: 2, y: 1, char: 'a'},
    {x: 10, y: 6, char: 'P'},
    {x: 11, y: 7, char: 'l'},
    {x: 12, y: 8, char: 'a'},
    {x: 13, y: 9, char: 'n'},
    {x: 30, y: 21, char: 'a'}
  ],
  misses: [ // ppoints outside their source range
    {dim: 'x', index: '17'},
    {dim: 'y', index: '22'}
  ],
  search: { // this is a isomorphic result range expressed as a disco too!
    str: 'aPlanacana',
    //    5678901234
    yFound: 5,
    dFound: 10,
    yEnd: 15, // exclusive y<15
    xMapped: 8,
    xEndMapped: 22,
    discosOverlapping: [
      {x: 8, y: 5, d: 1, content: 'a'},
      {x: 10, y: 6, d: 4, content: 'Plan'},
      {x: 16, y: 10, d: 1, content: 'a'},
      {x: 18, y: 11, d: 5, content: 'canal'}
    ]
  }

})
// TODO NEED a way to express end point as leaf (disco)
