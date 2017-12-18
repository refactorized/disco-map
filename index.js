// Discontinuous mapping: discoMap
// A mapping between two arrays/strings/sequences idicating related ranges
// of data between each. Each pair of ranges constitute a discontinuous mapping
// between identically sized ranges in otherwise disparate data. This allows 1:1,
// isomorphic mapping between points in each set to the other.  We call these
// discontinuous mappings 'discos'

// discos:
// discos represent two, same-sized ranges, their minimum (inclusive) extent
// stored as x and y, and their maximum extent (exclusive) defined by the shared
// d (distance/delta) property. therefore each disco, expressed as {x,y,d} defines
// two ranges: [x, x+d) and [y, y+d)
//
// terse parameter names
// to keep the static methods below consice, parameters are very abbreviated.
// discos are often referred to as smiply `d` or `dn` or `d[n]`
// a collecton of discos is often `D`
// disco parameters are `x, y, d`- so sometimes there can be a `d.d` (sorry)
// some functions specify dimesion as either 'x' or 'y' passed in as `dim`,
// in this case the index is expressed as i (not x or y)
//
// Range model
// ranges are described as [min, max) with min = x or y and max = min + d
// ranges [0,3) and [3,6) don't overlap, nor do discos {x:0,y:0,d:3} and {x:3,y:3,d:3}
// x value for the next range is described: d[n].x >= d[n-1].x + d[n-1].d (same with y)

const r = require('ramda')

// static utility methods, some/all exposed in _util
// does d1 follow d0 on both dimensions
const areSequential = (d0, d1) =>
  (d0.x + d0.d) <= (d1.x) &&
  (d0.y + d0.d) <= (d1.y)

// are all discos in collection sequential (inductively)
const allSequential = arr => r.all(r.apply(areSequential))(r.aperture(2)(arr))

// verify _dn, and return a clone of _discos with a clone of _dn appended
const pushDisco = _discos => _dn => {
  let discos = r.clone(_discos)
  let dn = r.clone(_dn)

  if (discos.length > 0 && !areSequential(r.last(discos), dn)) {
    throw Error('bad disco sequencing')
  }
  if (dn.d < 1) {
    throw Error('discos must have d > 0')
  }
  discos.push(dn)
  return discos
}

// is the given index, on the given dimension, bounded by the given disco
const discoContainsIndex = dim => i => dn => dn[dim] <= i && i < (dn[dim] + dn.d)

// is the given range, on the given dimension, onverlapping with given disco
const discoOverlapsRange = dim => i => dist => dn => (dn[dim]) < (i + dist) && (dn[dim] + dn.d) > i

// TODO this isn't directly covered inn tests yet ( indirectly via discoMap methods )
// gets disco associated to given index and dimension, or throws if not found
const discoForIndex = dim => i => D => r.findIndex(discoContainsIndex(dim)(i))(D)

// gets all discos overlapping the given range, on the given dimension
const discosOverlapping = dim => i => d => D => r.filter(discoOverlapsRange(dim)(i)(d))(D)

// use to flip dim argument
const flipDim = dim => dim === 'x' ? 'y' : 'x'

// generalized mapping from one dimesion index to its counterpart
const a2b = dim => i => D => {
  let b = flipDim(dim)
  let a = flipDim(b)
  let dIndex = discoForIndex(a)(i)(D)
  if (dIndex === -1) { throw Error('could not find index within any range') }
  let d = D[dIndex]
  let offset = i - d[a]
  return d[b] + offset
}

// access to underlying statics for testing, reuse
const _util = {
  areSequential,
  allSequential,
  pushDisco,
  discoContainsIndex,
  discoForIndex,
  discoOverlapsRange,
  discosOverlapping
}

// data struct with instance methods via forwarding to statics
class DiscoMap {
  constructor (_discos) {
    this.discos = []
    if (_discos) {
      this.arr = _discos
    }
  }

  // adds/pushes a new disco to the collection
  add (d) {
    this.discos = pushDisco(this.discos)(d)
  }

  // attempts retrive corresponding y index for supplied x
  x2y (i) {
    return a2b('x')(i)(this.discos)
  }

  // attempts retrive corresponding x index for supplied y
  y2x (i) {
    return a2b('y')(i)(this.discos)
  }

  // retreive all discos with that overlap the range described in the x dimension
  xOverlaps (i, d) {
    return discosOverlapping('x')(i)(d)(this.discos)
  }

  // retreive all discos with that overlap the range described in the y dimension
  yOverlaps (i, d) {
    return discosOverlapping('y')(i)(d)(this.discos)
  }

  // get a copy of the underlying discos array
  get arr () {
    return r.clone(this.discos)
  }

  // verify and set underlying discos array
  set arr (_arr) {
    if (allSequential(_arr)) {
      this.discos = r.clone(_arr)
    } else {
      throw Error('invalid discos or sequencing')
    }
  }
}

// implement module as factory function, with property `_util`
const D = (discos) => new DiscoMap(discos)
D._util = _util

module.exports = D
