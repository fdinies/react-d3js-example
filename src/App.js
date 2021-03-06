import React from 'react'
import * as d3 from 'd3'
import _ from 'lodash'

import './style.css'

import Preloader from './components/Preloader'
import { loadAllData } from './DataHandling'

import CountyMap from './components/CountyMap'
import Histogram from './components/Histogram'
import {
  Title,
  Description,
  GraphDescription
} from './components/Meta'
import MedianLine from './components/MedianLine'

import Controls from './components/Controls'

class App extends React.Component {
  state = {
    techSalaries: [],
    medianIncomes: [],
    salariesFilter: () => true,
    countyNames: [],
    filteredBy: {
      USstate: '*',
      year: '*',
      jobTitle: '*'
    }
  }

  componentDidMount() {
    loadAllData(data => this.setState(data))
  }

  countyValue(county, techSalariesMap) {
    const medianHousehold = this.state.medianIncomes[county.id],
      salaries = techSalariesMap[county.name]

    if (!medianHousehold || !salaries) {
      return null
    }

    const median = d3.median(salaries, d => d.base_salary)

    return {
      countyID: county.id,
      value: median - medianHousehold.medianIncome
    }
  }

  updateDataFilter = (filter, filteredBy) => {
    this.setState({
      salariesFilter: filter,
      filteredBy: filteredBy
    })
  }

  render() {
    const {
      countyNames,
      usTopoJson,
      techSalaries,
      USstateNames,
      filteredBy,
      medianIncomesByUSState,
      medianIncomesByCounty
    } = this.state

    if (techSalaries.length < 1) {
      return <Preloader />
    }

    const filteredSalaries = techSalaries.filter(
        this.state.salariesFilter
      ),
      filteredSalariesMap = _.groupBy(filteredSalaries, 'countyID'),
      countyValues = countyNames
        .map(county => this.countyValue(county, filteredSalariesMap))
        .filter(d => !_.isNull(d))

    let zoom = null,
      medianHousehold = medianIncomesByUSState['US'][0].medianIncome

    if (filteredBy.USstate !== '*') {
      zoom = filteredBy.USstate
      medianHousehold = d3.mean(
        medianIncomesByUSState[zoom],
        d => d.medianIncome
      )
    }

    return (
      <div className="App container">
        <Title data={filteredSalaries} filteredBy={filteredBy} />

        <Description
          data={filteredSalaries}
          allData={techSalaries}
          medianIncomesByCounty={medianIncomesByCounty}
          filteredBy={filteredBy}
        />

        <GraphDescription
          data={filteredSalaries}
          filteredBy={this.state.filteredBy}
        />

        <svg width="1100" height="500">
          <CountyMap
            usTopoJson={usTopoJson}
            USstateNames={USstateNames}
            values={countyValues}
            x={0}
            y={0}
            width={500}
            height={500}
            zoom={zoom}
          />

          <rect
            x="500"
            y="0"
            width="600"
            height="500"
            style={{ fill: 'white' }}
          />

          <Histogram
            bins={10}
            width={500}
            height={500}
            x="500"
            y="10"
            data={filteredSalaries}
            axisMargin={83}
            bottomMargin={5}
            value={d => d.base_salary}
          />
          <MedianLine
            data={filteredSalaries}
            x={500}
            y={10}
            width={600}
            height={500}
            bottomMargin={5}
            median={medianHousehold}
            value={d => d.base_salary}
          />
        </svg>

        <Controls
          data={techSalaries}
          updateDataFilter={this.updateDataFilter}
        />
      </div>
    )
  }
}

export default App
