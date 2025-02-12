import React, { useEffect, useState } from 'react';
import { omit, isEqual } from 'lodash';
import { parseURL, refreshGrafanaVariables, setLabels } from './provider.tools';
import { QueryAnalyticsContext } from './provider.types';

const initialState = {} as QueryAnalyticsContext;

export const QueryAnalyticsProvider = React.createContext<QueryAnalyticsContext>(initialState);

export const UrlParametersProvider = ({ timeRange, children }) => {
  const actions = {
    // eslint-disable-next-line max-len
    setLabels: (value) => (state) => omit({ ...state, labels: setLabels(value), pageNumber: 1 }, ['queryId', 'querySelected']),
    resetLabels: () => (state) => omit({ ...state, labels: {}, pageNumber: 1 }, ['queryId', 'querySelected']),
    selectTime: (value) => (state) => ({
      ...state,
      from: value[0],
      to: value[1],
      rawTime: {
        from: value[0],
        to: value[1],
      },
    }),
    setActiveTab: (value) => (state) => ({ ...state, openDetailsTab: value }),
    highlightSparkline: (value) => (state) => ({ ...state, highlightedCoords: value }),
    setLoadingDetails: (value) => (state) => ({ ...state, loadingDetails: value }),
    selectQuery: (value, totals) => (state) => ({
      ...state,
      queryId: value.queryId,
      querySelected: true,
      database: value.database,
      // openDetailsTab: 'details',
      totals,
    }),
    addColumn: (value) => (state) => {
      const columns = [...state.columns];

      columns.push(value);

      return {
        ...state,
        columns,
      };
    },
    changeColumn: (value) => (state) => {
      const columns = [...state.columns];

      columns[columns.indexOf(value.oldColumn.simpleName)] = value.column;

      return {
        ...state,
        columns,
        orderBy:
          value.oldColumn.simpleName === state.orderBy.replace('-', '') ? `-${columns[0]}` : state.orderBy,
      };
    },
    swapMainColumn: (value) => (state) => {
      const columns = [...state.columns];
      const columnIndex = columns.indexOf(value.simpleName);
      const currentColumn = columns[columnIndex];

      // eslint-disable-next-line prefer-destructuring
      columns[columnIndex] = columns[0];
      columns[0] = currentColumn;

      return {
        ...state,
        columns,
      };
    },
    removeColumn: (value) => (state) => {
      const columns = [...state.columns];

      columns.splice(columns.indexOf(value.simpleName), 1);

      return {
        ...state,
        columns,
        orderBy: value.simpleName === state.orderBy.replace('-', '') ? `-${columns[0]}` : state.orderBy,
      };
    },
    changePage: (value) => (state) => omit(
      {
        ...state,
        pageNumber: value,
      },
      ['queryId', 'querySelected'],
    ),
    changePageSize: (value) => (state) => omit(
      {
        ...state,
        pageSize: value,
        pageNumber: 1,
      },
      ['queryId', 'querySelected'],
    ),
    changeSort: (value) => (state) => omit(
      {
        ...state,
        orderBy: value,
        pageNumber: 1,
      },
      ['queryId', 'querySelected'],
    ),
    changeGroupBy: (value) => (state) => omit(
      {
        ...state,
        groupBy: value,
        querySelected: false,
        pageNumber: 1,
      },
      ['queryId', 'querySelected'],
    ),
    closeDetails: () => (state) => omit(
      {
        ...state,
        loadingDetails: false,
      },
      ['queryId', 'querySelected'],
    ),
    setFingerprint: (value) => (state) => ({
      ...state,
      fingerprint: value,
    }),
    setSearch: ({ search }) => (state) => ({
      ...state,
      search,
    }),
    setDimensionSearchText: ({ search }) => (state) => ({
      ...state,
      dimensionSearchText: search,
    }),
  };

  const query = new URLSearchParams(window.location.search);

  const [panelState, setContext] = useState({
    ...parseURL(query),
    rawTime: {
      from: timeRange.raw.from,
      to: timeRange.raw.to,
    },
  });

  useEffect(() => {
    setContext({
      ...panelState,
      rawTime: {
        from: timeRange.raw.from,
        to: timeRange.raw.to,
      },
    });
  }, [timeRange.raw.from, timeRange.raw.to]);

  useEffect(() => {
    refreshGrafanaVariables(panelState);
  }, [panelState]);

  const [from, setFrom] = useState(timeRange.raw.from);
  const [to, setTo] = useState(timeRange.raw.to);
  const [previousState, setPreviousState] = useState(panelState);

  useEffect(() => {
    const getAbsoluteTime = (timeValue) => (timeValue.valueOf ? timeValue.valueOf() : timeValue);

    const newFrom = getAbsoluteTime(timeRange.raw.from);
    const newTo = getAbsoluteTime(timeRange.raw.to);

    const newState = {
      ...panelState,
      from: timeRange.from.utc().format('YYYY-MM-DDTHH:mm:ssZ'),
      to: timeRange.to.utc().format('YYYY-MM-DDTHH:mm:ssZ'),
      rawTime: {
        from: newFrom,
        to: newTo,
      },
    };

    if (from === newFrom && to === newTo) {
      const oldState = omit(previousState, ['from', 'to', 'rawTime']);
      const updatedState = omit(panelState, ['from', 'to', 'rawTime']);

      if (isEqual(oldState, updatedState)) {
        setContext(newState);
      }
    } else {
      newState.pageNumber = 1;
      delete newState.queryId;
      // @ts-expect-error
      delete newState.querySelected;
      setContext(newState);
    }

    setPreviousState(newState);
    setFrom(newFrom);
    setTo(newTo);
  }, [timeRange, from, to]);

  const wrapAction = (key) => (...value) => setContext(actions[key](...value));

  return (
    <QueryAnalyticsProvider.Provider
      value={{
        panelState,
        contextActions: Object.keys(actions).reduce((actionsList, key) => {
          // eslint-disable-next-line no-param-reassign
          actionsList[key] = wrapAction(key);

          return actionsList;
        }, {}),
      }}
    >
      {children}
    </QueryAnalyticsProvider.Provider>
  );
};
