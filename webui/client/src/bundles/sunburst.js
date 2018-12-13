import { fadeColor } from '../lib/utils'
import { createSelector } from 'redux-bundler'
import {
  forEach,
  includes,
  isEmpty,
  flatMap,
  join,
  map,
  orderBy,
  reduce,
  sortBy,
  values
} from 'lodash'

export default {
  name: 'charts',
  getReducer: () => {
    const initialState = {
      focusedKeyPath: [],
      chartLocked: false
    }
  
    return (state = initialState, action = {}) => {
      if (action.type === 'CHART_FOCUSED') {
        return {
          ...state,
          focusedKeyPath: action.payload
        }
      }
      if (action.type === 'CHART_UNFOCUSED') {
        return {
          ...state,
          focusedKeyPath: []
        }
      }
      if (action.type === 'CHART_LOCKED') {
        return {
          ...state,
          chartLocked: true
        }
      }
      if (action.type === 'CHART_UNLOCKED') {
        return {
          ...state,
          chartLocked: false
        }
      }
      return state;
    }
  },
  selectSunburst: createSelector(
    'selectEndpointsByLevelAndCategoryAndNameAndMethod',
    'selectLevelColours',
    'selectCategoryColours',
    'selectQueryObject',
    (endpointsByLevelAndCategoryAndNameAndMethod, levelColours, categoryColours, queryObject) => {
      return {
        name: 'root',
        children: map(endpointsByLevelAndCategoryAndNameAndMethod, (endpointsByCategoryAndNameAndMethod, level) => {
          return {
            name: level,
            color: determineLevelColours(queryObject, levelColours, level),
            children: categoriesSortedByEndpointCount(endpointsByCategoryAndNameAndMethod, level, categoryColours, queryObject)
          }
        })
      }
    }
  ),
  selectSunburstSorted: createSelector(
    'selectSunburst',
    (sunburst) => {
      var sortedLevels = orderBy(sunburst.children, 'name', 'desc')
      sunburst.children = sortedLevels
      return sunburst
    }
  ),
  selectInteriorLabel: createSelector(
    'selectQueryObject',
    'selectEndpointsWithTestCoverage',
    (query, endpoints) => {
      var nameAndCoverageInfo = determineNameAndCoverageInfo(query, endpoints)
      return nameAndCoverageInfo
    }
  ),
  selectFocusedPath: createSelector(
    'selectQueryObject',
    (queryObject) => {
      var queryValues = flatMap(queryObject)
      var focusedPath = join(queryValues, ' / ')
      return focusedPath
    }
  ),
  selectLabelStyle: () => {
    return {
      PERCENTAGE: {
        fontSize: '1.3em',
        textAnchor: 'middle'
      },
      FRACTION: {
        fontSize: '1.2em,',
        textAnchor: 'middle'
      },
      PATH: {
        fontSize: '1em',
        textAnchor: 'middle'
      },
      DESCRIPTION: {
        fontSize: '0.9em',
        textAnchor: 'middle'
      }
    }
  },
  doLockChart: () => {
    return {
      type: 'CHART_LOCKED'
    }
  },
  doUnlockChart: () => {
    return {
      type: 'CHART_UNLOCKED'
    }
  }
}

function categoriesSortedByEndpointCount (endpointsByCategoryAndNameAndMethod, level, categoryColours, queryObject) {
  var categories = categoriesWithEndpointsAsChildren(endpointsByCategoryAndNameAndMethod, level, categoryColours, queryObject)
  return orderBy(categories, (category) => category.children.length, ['desc'])
}

function categoriesWithEndpointsAsChildren (endpointsByCategoryAndNameAndMethod, level, categoryColours, queryObject) {
  return map(endpointsByCategoryAndNameAndMethod, (endpointsByNameAndMethod, category) => {
    return {
      name: category,
      color: determineCategoryColours(queryObject, categoryColours, category, level),
      children: endpointsSortedByConformance(endpointsByNameAndMethod, category, level, queryObject, categoryColours)
    }
  })
}

function endpointsSortedByConformance (endpointsByNameAndMethod, category, level, queryObject, categoryColours) {
  var endpoints = createEndpointAndMethod(endpointsByNameAndMethod, category, level, queryObject, categoryColours)
  var sortedEndpoints = sortBy(endpoints, [
    (endpoint) => endpoint.tested === 'untested', (endpoint) => endpoint.isConformance !== 'conformance',
    (endpoint) => endpoint.testTagCount
  ])
  return sortedEndpoints
}

function createEndpointAndMethod(endpointsByNameAndMethod, category, level, queryObject, categoryColours) {
  return values(reduce(
    endpointsByNameAndMethod,
    (sofar, endpointsByMethod, name) => {
      sofar = fillOutMethodInfo(sofar, endpointsByMethod, category, name, level, queryObject, categoryColours)
      return sofar
    },
    {}
  ))
}

function fillOutMethodInfo (sofar, endpointsByMethod, category, name, level, queryObject, categoryColours) {
  forEach(endpointsByMethod, (endpoint, method) => {
    var { isTested } = endpoint
    var isConformance = checkForConformance(endpoint.test_tags)
    var path = `${name}/${method}`
    var size = (sofar[path] == null) ? 1 : sofar[path].size + 1
    var initialColor = calculateInitialColor(endpoint, isConformance, categoryColours)
    sofar[path] = {
      name,
      parentName: category,
      testTagCount: endpoint.test_tags.length,
      tested: isTested ? 'tested' : 'untested',
      isConformance: isConformance ? "conformance" : "not conformance",
      size,
      color: isTested ? determineEndpointColours(queryObject, initialColor, category, level, endpoint) : 'rgba(244,244,244, 1)',
    }
  })
  return sofar
}

function checkForConformance (test_tags) {
  var tagsAsStrings = test_tags.map(tag => tag.replace(/\[|]/g,''))
  return includes(tagsAsStrings, 'Conformance')
}

function determineLevelColours (query, colours, level) {
  if (isEmpty(query)) {
    return colours[level]
  } else if (query.level === level){
    return colours[level]
  } else {
    return fadeColor(colours[level], '0.1')
  }
}
function determineCategoryColours (query, categoryColours, category, level) {
  if (isEmpty(query)) {
    return categoryColours[`category.${category}`]
  } else if (query.level === level && query.category === category){
    return categoryColours[`category.${category}`]
  } else {
    return fadeColor(categoryColours[`category.${category}`], '0.1')
  }
}
function determineEndpointColours (query, color, category, level, endpoint) {
  if (isEmpty(query)) {
    return color
  } else if (query.level === level && query.category === category && query.name === endpoint.name){
    return color
  } else {
    return fadeColor(color, '0.1')
  }

}
function calculateInitialColor (endpoint, isConformance, categoryColours) {
  if (endpoint.isTested && isConformance)  {
    return categoryColours[`category.${endpoint.category}`]
  } else  if( endpoint.isTested && !isConformance) {
    var color = categoryColours[`category.${endpoint.category}`]
    var fadedColor = fadeColor(color, '0.2')
    return fadedColor
  } else {
    return 'rgba(244, 244, 244, 1)'
  }
}

function determineNameAndCoverageInfo (query, endpoints) {
 // check our query to see how far in the path we are.
 // If a response is null, it means its not a part of the path
 // therefore, we display the preceding level's info.
  if (endpoints.stable === undefined) return null
  if (query.level === undefined) {
    var name = ''
    var coverage = endpoints.coverage
    var endpoint = false
    var description= ''
  }else if (query.category === undefined) {
    name = query.level
    coverage = endpoints[query.level].coverage
    endpoint = false
    description= ''
  } else if (query.name === undefined) {
    name = query.category
    coverage = endpoints[query.level][query.category].coverage
    endpoint = false
    description= ''
  } else {
    var endpointInQuestion = endpoints[query.level][query.category][query.name]
    name = query.name
    endpoint= true
    description= determineDescription(endpoints[query.level][query.category][query.name])
    var tested = determineTested(endpointInQuestion)
    coverage = endpointInQuestion.coverage
  }
  return {
    name,
    ...coverage,
    endpoint,
    description,
    tested
  }
}

function determineDescription (endpoint) {
  var method = Object.keys(endpoint)[0]
  return endpoint[method].description
}
function determineTested (endpoint) {
  var method = Object.keys(endpoint)[0]
  return endpoint[method].isTested ? 'Tested' : 'Untested'
}
