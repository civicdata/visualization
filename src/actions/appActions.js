import ACTIONS, { uri } from './index'
import { OrderedSet } from 'immutable'
import { fetchGeoJson, fetchStatsJson } from './mapActions'
import store from '../configureStore'

/**
 * Simple function to change the year
 * @param {String} year
 */
export function changeYear (year) {
  return () => {
    store.dispatch({ type: ACTIONS.CHANGE_YEAR, year })
    console.log('Year change')
    fetchGeoJson()
  }
}

/**
 * collectBranchAndYears organizes the metaData for the rest of the application
 * TODO: Consider refactoring to list
 * Each year for a particular layer is then concatinated
 * and returned
 * This function is extremely ugly but it is functional.
 * Eventually it will need to be rewritten.
 * @param {OrderedSet} - immutable ordered-set
 * @return {Array} - returns an array with two elements
 * the first being the branch
 * the second being an ordered-set descending
 */
export function collectBranchAndYears (orderedSet, layer = null) {
  // Defensive programming but whatever
  if (!(orderedSet instanceof OrderedSet)) return null
  // Pulls the state from redux
  // Gets the current branch of government if not already passed
  if (layer === null) {
    const { mapControllerReducer } = store.getState()
    layer = mapControllerReducer.layer
  }
  // Gets the internal object
  const list = orderedSet.toList().get(layer)
  // Gets the key for the level government
  const level = Object.keys(list)
  // Grabs all the available keys
  const years = Object.keys(list[level]).sort((x, y) => y - x)
  // Sort and return an array with the level of government and an OrderSet
  return [level, OrderedSet(years)]
}

/**
 * Simple function to convert branch to the display name
 * @param {String} branch
 */
export function convertBranch (branch) {
  switch (branch) {
    case 'federal':
      return 'U.S. House Districts'
    case 'lower':
      return 'P.A. House Districts'
    case 'upper':
      return 'P.A. Senate Districts'
    default:
      return branch
  }
}

/**
 * onLoad functions checks on the availability of the META-Data
 */
export function onLoad () {
  const { mapDataReducer } = store.getState()
  // REVIEW: Potentially unnecessary check
  if (mapDataReducer.geoFiles.size < 1) {
    pullMetaData()
    return
  }
  fetchGeoJson()
}

/**
 * pullMetaData triggers an ajax action and loads necessary data if needed
 */
export function pullMetaData () {
  const { META_DATA } = ACTIONS
  window.fetch(uri + 'metaData.json')
        .then(rsp => {
          rsp.json().then(json => {
            const geoFiles = OrderedSet(json.geoFiles)
            const { statsFiles } = json
            const collected = collectBranchAndYears(geoFiles) // need to add error handler
            store.dispatch({
              type: META_DATA,
              geoFiles,
              statsFiles,
              branch: collected[0],
              years: collected[1]
            })
            fetchGeoJson()
            fetchStatsJson()
          })
        })
        .catch(e => console.error(e))
}
