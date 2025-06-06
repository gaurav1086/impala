// Licensed to the Apache Software Foundation (ASF) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The ASF licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

import {maxts, set_maxts, clearDOMChildren} from "./global_members.js";

export let exportedForTest;
// In the data array provided for c3's line chart,
// 0th element is name of dataset
// 1st element is zero in all datasets(to compensate missing value for line chart)
// Hence the values index start at 2
export const ARRAY_VALUES_START_INDEX = 2;

function accumulateTimeseriesValues(values_array, time_series_counter, max_samples) {
  const samples = time_series_counter.data.split(",").map(el => parseInt(el));
  const MAX_TRAVERSE_LEN = Math.min(samples.length, values_array.length
      - ARRAY_VALUES_START_INDEX);
  if (isNaN(samples[0])) return;
  for (let j = 0; j < MAX_TRAVERSE_LEN; ++j) {
    values_array[j + ARRAY_VALUES_START_INDEX] += samples[j];
  }
  if (time_series_counter.num > max_samples.collected || time_series_counter.period
      > max_samples.period) {
    max_samples.available = samples.length;
    max_samples.period = time_series_counter.period;
    max_samples.collected = time_series_counter.num;
  }
}

export function generateTimesamples(timesamples_array, max_samples, extend) {
  const AVG_PERIOD = max_samples.collected * max_samples.period /
      (max_samples.available * 1000);
  const MAX_TRAVERSE_LEN = Math.min(max_samples.available, timesamples_array.length
      - ARRAY_VALUES_START_INDEX);
  for (let k = 0; k <= MAX_TRAVERSE_LEN; ++k) {
    timesamples_array[k + 1] = k * AVG_PERIOD;
  }
  if (maxts / 1e9 > timesamples_array[max_samples.available + 1]) {
    // extend by one additional point or correct the final point
    if (extend) {
      // extend
      timesamples_array[max_samples.available + ARRAY_VALUES_START_INDEX] = maxts / 1e9;
    } else {
      // correct
      timesamples_array[max_samples.available + 1] = maxts / 1e9;
    }
  } else {
    set_maxts(timesamples_array[max_samples.available + 1] * 1e9);
  }
  let j = max_samples.available + (extend ? 3 : 2);
  for (; j < timesamples_array.length && timesamples_array[j] !== null; ++j) {
    timesamples_array[j] = null;
  }
}

export function mapTimeseriesCounters(time_series_counters, counters) {
  let no_change;
  for (let i = 0; i < counters.length; i++) {
    no_change = true;
    for (let j = 0; j < time_series_counters.length; j++) {
      if (time_series_counters[j].counter_name === counters[i][0]) {
        counters[i][2] = j;
        no_change = false;
      }
    }
    if (no_change) {
      throw new Error(`"${counters[i][0]}" not found within profile`);
    }
  }
}

export function clearTimeseriesValues(values_array, max_samples) {
  const MAX_TRAVERSE_LEN = Math.min(max_samples.available + 1, values_array.length - 1);
  for (let j = ARRAY_VALUES_START_INDEX; j <= MAX_TRAVERSE_LEN; ++j) {
    values_array[j] = null;
  }
}

export function aggregateProfileTimeseries(parent_profile, aggregate_array,
    counters, max_samples) {
  parent_profile.child_profiles.forEach(time_series_profiles => {
    for (let i = 0; i < aggregate_array.length; ++i) {
      accumulateTimeseriesValues(aggregate_array[i],
          time_series_profiles.time_series_counters[counters[i][2]],
          max_samples);
    }
  });
}

export function showTooltip(chart, x) {
  if (chart === null) return;
  chart.tooltip.show({x : chart.internal.findClosestFromTargetsByX(
      chart.internal.getTargets(), x).x});
}

export function hideTooltip(chart) {
  if (chart === null) return;
  chart.tooltip.hide();
}

export function displayWarning(parent_element, msg, diagram_width, margin_l, margin_r) {
  clearDOMChildren(parent_element);
  parent_element.style.display = "flex";
  parent_element.style.width = `${diagram_width - margin_l - margin_r}px`;
  parent_element.style.height = "200px";
  parent_element.style.justifyContent = "center";
  parent_element.style.alignItems = "center";
  parent_element.style.padding = "20px";
  parent_element.style.textAlign = "center";
  parent_element.style.marginLeft = `${margin_l}px`;
  parent_element.style.border = "1px solid black";
  parent_element.innerHTML = `<span style="color:#ff0f0f;font-size:20px;">${msg}</span>`;
}

export function destroyChart(chart, chart_dom_obj) {
  try {
    chart.destroy();
  } catch (e) {
  }
  clearDOMChildren(chart_dom_obj);
  return null;
}

if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
  exportedForTest = {accumulateTimeseriesValues};
}
